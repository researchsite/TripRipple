/**
 * seed-elastic.ts
 * Seeds all source events, decisions, constraints, and dependencies
 * into a running Elasticsearch cluster.
 *
 * Usage:
 *   ELASTICSEARCH_URL=https://... ELASTICSEARCH_API_KEY=... npx tsx scripts/seed-elastic.ts
 *
 * Safe to run multiple times — uses _id-based upserts.
 */

import { Client } from '@elastic/elasticsearch';
import { SOURCE_EVENTS, DECISIONS, CONSTRAINTS, DEPENDENCIES, WORKSPACE_ID, TRIP_ID } from '../src/data/seed';

const url = process.env.ELASTICSEARCH_URL;
const apiKey = process.env.ELASTICSEARCH_API_KEY;

if (!url) {
  console.error('ERROR: ELASTICSEARCH_URL is not set.');
  process.exit(1);
}

const client = new Client({
  node: url,
  auth: apiKey ? { apiKey } : undefined,
});

const INDEXES = [
  'trip-source-events',
  'trip-memories',
  'trip-dependencies',
  'hotel-search-runs',
  'communication-status',
];

async function ensureIndexes() {
  for (const index of INDEXES) {
    const exists = await client.indices.exists({ index });
    if (!exists) {
      await client.indices.create({ index });
      console.log(`  Created index: ${index}`);
    } else {
      console.log(`  Index exists: ${index}`);
    }
  }
}

async function seedSourceEvents() {
  const ops = SOURCE_EVENTS.flatMap((ev) => [
    { index: { _index: 'trip-source-events', _id: ev.id } },
    { ...ev, workspaceId: WORKSPACE_ID, tripId: TRIP_ID },
  ]);
  const { errors, items } = await client.bulk({ operations: ops, refresh: true });
  if (errors) {
    const failed = items.filter((i) => i.index?.error);
    console.warn(`  ⚠ ${failed.length} source event(s) failed to index`);
  }
  console.log(`  Indexed ${SOURCE_EVENTS.length} source events`);
}

async function seedDecisions() {
  const ops = DECISIONS.flatMap((d) => [
    { index: { _index: 'trip-memories', _id: d.id } },
    { ...d, type: 'decision', workspaceId: WORKSPACE_ID, tripId: TRIP_ID },
  ]);
  await client.bulk({ operations: ops, refresh: true });
  console.log(`  Indexed ${DECISIONS.length} decisions`);
}

async function seedConstraints() {
  const ops = CONSTRAINTS.flatMap((c) => [
    { index: { _index: 'trip-memories', _id: c.id } },
    { ...c, type: 'constraint', workspaceId: WORKSPACE_ID, tripId: TRIP_ID },
  ]);
  await client.bulk({ operations: ops, refresh: true });
  console.log(`  Indexed ${CONSTRAINTS.length} constraints`);
}

async function seedDependencies() {
  const ops = DEPENDENCIES.flatMap((d) => [
    { index: { _index: 'trip-dependencies', _id: d.id } },
    { ...d, workspaceId: WORKSPACE_ID, tripId: TRIP_ID },
  ]);
  await client.bulk({ operations: ops, refresh: true });
  console.log(`  Indexed ${DEPENDENCIES.length} dependencies`);
}

async function main() {
  console.log(`\nConnecting to Elasticsearch: ${url}\n`);
  await client.ping();
  console.log('Ping OK\n');

  console.log('Ensuring indexes…');
  await ensureIndexes();

  console.log('\nSeeding data…');
  await seedSourceEvents();
  await seedDecisions();
  await seedConstraints();
  await seedDependencies();

  console.log('\nDone. Elasticsearch is ready for TripRipple.\n');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
