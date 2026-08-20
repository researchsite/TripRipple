/**
 * reset-elastic.ts
 * Deletes all TripRipple indexes and re-creates + re-seeds them from scratch.
 * USE WITH CAUTION — this wipes all existing data in those indexes.
 *
 * Usage:
 *   ELASTICSEARCH_URL=https://... ELASTICSEARCH_API_KEY=... npx tsx scripts/reset-elastic.ts
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

async function deleteIndexes() {
  for (const index of INDEXES) {
    try {
      const exists = await client.indices.exists({ index });
      if (exists) {
        await client.indices.delete({ index });
        console.log(`  Deleted: ${index}`);
      } else {
        console.log(`  Not found (skip): ${index}`);
      }
    } catch (err) {
      console.warn(`  Could not delete ${index}:`, err);
    }
  }
}

async function createIndexes() {
  for (const index of INDEXES) {
    await client.indices.create({ index });
    console.log(`  Created: ${index}`);
  }
}

async function seedAll() {
  // Source events
  const eventOps = SOURCE_EVENTS.flatMap((ev) => [
    { index: { _index: 'trip-source-events', _id: ev.id } },
    { ...ev, workspaceId: WORKSPACE_ID, tripId: TRIP_ID },
  ]);
  await client.bulk({ operations: eventOps, refresh: true });
  console.log(`  Seeded ${SOURCE_EVENTS.length} source events`);

  // Decisions
  const decisionOps = DECISIONS.flatMap((d) => [
    { index: { _index: 'trip-memories', _id: d.id } },
    { ...d, type: 'decision', workspaceId: WORKSPACE_ID, tripId: TRIP_ID },
  ]);
  await client.bulk({ operations: decisionOps, refresh: true });
  console.log(`  Seeded ${DECISIONS.length} decisions`);

  // Constraints
  const constraintOps = CONSTRAINTS.flatMap((c) => [
    { index: { _index: 'trip-memories', _id: c.id } },
    { ...c, type: 'constraint', workspaceId: WORKSPACE_ID, tripId: TRIP_ID },
  ]);
  await client.bulk({ operations: constraintOps, refresh: true });
  console.log(`  Seeded ${CONSTRAINTS.length} constraints`);

  // Dependencies
  const depOps = DEPENDENCIES.flatMap((d) => [
    { index: { _index: 'trip-dependencies', _id: d.id } },
    { ...d, workspaceId: WORKSPACE_ID, tripId: TRIP_ID },
  ]);
  await client.bulk({ operations: depOps, refresh: true });
  console.log(`  Seeded ${DEPENDENCIES.length} dependencies`);
}

async function main() {
  console.log(`\nConnecting to Elasticsearch: ${url}\n`);
  await client.ping();
  console.log('Ping OK\n');

  console.log('Step 1: Deleting existing indexes…');
  await deleteIndexes();

  console.log('\nStep 2: Creating fresh indexes…');
  await createIndexes();

  console.log('\nStep 3: Seeding data…');
  await seedAll();

  console.log('\nReset complete. Elasticsearch is clean and ready.\n');
}

main().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
