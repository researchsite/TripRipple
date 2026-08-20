/**
 * Elasticsearch client with in-memory fallback.
 * When ELASTICSEARCH_URL is set, uses real ES.
 * Otherwise, uses in-memory arrays backed by seed data.
 */

import { SOURCE_EVENTS, DECISIONS, CONSTRAINTS, DEPENDENCIES, WORKSPACE_ID, TRIP_ID } from '@/data/seed';
import type { SourceEvent, Decision, Constraint, Dependency } from '@/types';

// --- In-memory store (fallback when no ES configured) ---

interface MemoryStore {
  sourceEvents: SourceEvent[];
  decisions: Decision[];
  constraints: Constraint[];
  dependencies: Dependency[];
  seeded: boolean;
}

const memStore: MemoryStore = {
  sourceEvents: [],
  decisions: [],
  constraints: [],
  dependencies: [],
  seeded: false,
};

function ensureSeeded() {
  if (memStore.seeded) return;
  memStore.sourceEvents = [...SOURCE_EVENTS];
  memStore.decisions = [...DECISIONS];
  memStore.constraints = [...CONSTRAINTS];
  memStore.dependencies = [...DEPENDENCIES];
  memStore.seeded = true;
}

// --- Elasticsearch client (optional) ---

let esClient: import('@elastic/elasticsearch').Client | null = null;

async function getEsClient() {
  if (!process.env.ELASTICSEARCH_URL) return null;
  if (esClient) return esClient;
  const { Client } = await import('@elastic/elasticsearch');
  esClient = new Client({
    node: process.env.ELASTICSEARCH_URL,
    auth: process.env.ELASTICSEARCH_API_KEY
      ? { apiKey: process.env.ELASTICSEARCH_API_KEY }
      : undefined,
  });
  return esClient;
}

// --- Public API ---

export async function seedElasticsearch(): Promise<{ seeded: boolean; backend: string }> {
  const client = await getEsClient();

  if (!client) {
    ensureSeeded();
    return { seeded: true, backend: 'in-memory' };
  }

  // Create indexes and bulk-insert seed data
  const indexes = [
    'trip-source-events',
    'trip-memories',
    'trip-dependencies',
    'hotel-search-runs',
    'communication-status',
  ];

  for (const index of indexes) {
    const exists = await client.indices.exists({ index });
    if (!exists) {
      await client.indices.create({ index });
    }
  }

  // Bulk index source events
  const eventOps = SOURCE_EVENTS.flatMap((ev) => [
    { index: { _index: 'trip-source-events', _id: ev.id } },
    { ...ev, workspaceId: WORKSPACE_ID, tripId: TRIP_ID },
  ]);
  if (eventOps.length) await client.bulk({ operations: eventOps, refresh: true });

  // Bulk index decisions
  const decisionOps = DECISIONS.flatMap((d) => [
    { index: { _index: 'trip-memories', _id: d.id } },
    { ...d, type: 'decision', workspaceId: WORKSPACE_ID, tripId: TRIP_ID },
  ]);
  if (decisionOps.length) await client.bulk({ operations: decisionOps, refresh: true });

  // Bulk index constraints
  const constraintOps = CONSTRAINTS.flatMap((c) => [
    { index: { _index: 'trip-memories', _id: c.id } },
    { ...c, type: 'constraint', workspaceId: WORKSPACE_ID, tripId: TRIP_ID },
  ]);
  if (constraintOps.length) await client.bulk({ operations: constraintOps, refresh: true });

  // Bulk index dependencies
  const depOps = DEPENDENCIES.flatMap((d) => [
    { index: { _index: 'trip-dependencies', _id: d.id } },
    { ...d, workspaceId: WORKSPACE_ID, tripId: TRIP_ID },
  ]);
  if (depOps.length) await client.bulk({ operations: depOps, refresh: true });

  return { seeded: true, backend: 'elasticsearch' };
}

export async function getActiveDecision(subject: string): Promise<Decision | null> {
  ensureSeeded();
  const client = await getEsClient();

  if (client) {
    const result = await client.search<Decision>({
      index: 'trip-memories',
      query: {
        bool: {
          must: [
            { term: { type: 'decision' } },
            { term: { subject: subject } },
            { term: { state: 'Active' } },
          ],
        },
      },
    });
    const hit = result.hits.hits[0];
    return hit?._source ?? null;
  }

  return memStore.decisions.find(
    (d) => d.subject === subject && d.state === 'Active'
  ) ?? null;
}

export async function getDecisionById(id: string): Promise<Decision | null> {
  ensureSeeded();
  const client = await getEsClient();

  if (client) {
    const result = await client.search<Decision>({
      index: 'trip-memories',
      query: { term: { _id: id } },
    });
    return result.hits.hits[0]?._source ?? null;
  }

  return memStore.decisions.find((d) => d.id === id) ?? null;
}

export async function getAllDecisions(): Promise<Decision[]> {
  ensureSeeded();
  const client = await getEsClient();

  if (client) {
    const result = await client.search<Decision>({
      index: 'trip-memories',
      size: 100,
      query: { term: { type: 'decision' } },
    });
    return result.hits.hits.map((h) => h._source!);
  }

  return [...memStore.decisions];
}

export async function getActiveConstraints(): Promise<Constraint[]> {
  ensureSeeded();
  const client = await getEsClient();

  if (client) {
    const result = await client.search<Constraint>({
      index: 'trip-memories',
      size: 100,
      query: { term: { type: 'constraint' } },
    });
    return result.hits.hits.map((h) => h._source!);
  }

  return [...memStore.constraints];
}

export async function getRelevantDependencies(topic: string): Promise<Dependency[]> {
  ensureSeeded();
  const client = await getEsClient();

  if (client) {
    const result = await client.search<Dependency>({
      index: 'trip-dependencies',
      size: 20,
      query: {
        bool: {
          must: [{ term: { relevance: 'Relevant' } }],
          should: [
            { match: { dependsOn: topic } },
            { match: { plan: topic } },
          ],
        },
      },
    });
    return result.hits.hits.map((h) => h._source!);
  }

  return memStore.dependencies.filter((d) => d.relevance === 'Relevant');
}

export async function getDependencyById(id: string): Promise<Dependency | null> {
  ensureSeeded();
  return memStore.dependencies.find((d) => d.id === id) ?? null;
}

export async function getSourceEventById(id: string): Promise<SourceEvent | null> {
  ensureSeeded();
  return memStore.sourceEvents.find((e) => e.id === id) ?? null;
}

/**
 * Search source events with time-decay scoring.
 * Recent events score higher than old ones.
 * ES function_score: exp decay on `timestamp` field.
 *   scale=7d  → score halves every 7 days
 *   offset=1d → no decay for events in the last 24 h
 *   decay=0.5 → halving rate
 * Combined with multi_match (boost: text^2, subject^1.5) so relevance
 * and recency both influence ranking (score_mode: multiply).
 */
export async function searchSourceEvents(query: string): Promise<SourceEvent[]> {
  ensureSeeded();
  const client = await getEsClient();

  if (client) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decayQuery: any = {
      function_score: {
        query: {
          multi_match: {
            query,
            fields: ['text^2', 'subject^1.5', 'author'],
          },
        },
        functions: [
          {
            exp: {
              timestamp: {
                origin: 'now',
                scale: '7d',
                offset: '1d',
                decay: 0.5,
              },
            },
          },
        ],
        score_mode: 'multiply',
        boost_mode: 'multiply',
      },
    };

    const result = await client.search<SourceEvent>({
      index: 'trip-source-events',
      size: 10,
      query: decayQuery,
    });
    return result.hits.hits.map((h) => h._source!);
  }

  // In-memory fallback: keyword match + sort by recency
  const lower = query.toLowerCase();
  return memStore.sourceEvents
    .filter(
      (e) =>
        e.text.toLowerCase().includes(lower) ||
        e.subject.toLowerCase().includes(lower)
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);
}

export async function updateDecisionState(
  id: string,
  state: 'Active' | 'Superseded',
  supersedes?: string
): Promise<void> {
  ensureSeeded();
  const client = await getEsClient();

  if (client) {
    await client.update({
      index: 'trip-memories',
      id,
      doc: { state, supersedes },
      refresh: true,
    });
    return;
  }

  const decision = memStore.decisions.find((d) => d.id === id);
  if (decision) {
    decision.state = state;
    if (supersedes) decision.supersedes = supersedes;
  }
}

export async function getBackendInfo(): Promise<{ backend: string; healthy: boolean }> {
  const client = await getEsClient();
  if (!client) return { backend: 'in-memory', healthy: true };

  try {
    await client.ping();
    return { backend: 'elasticsearch', healthy: true };
  } catch {
    return { backend: 'elasticsearch', healthy: false };
  }
}
