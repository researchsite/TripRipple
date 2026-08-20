/**
 * POST /api/demo/cancel
 * Triggers the Harbor View cancellation event and starts the Mastra recovery workflow.
 * The workflow runs through steps 1–3 (memory → search → evaluate),
 * then suspends at step 4 (resolve-evidence).
 */

import { NextResponse } from 'next/server';
import { patchState, advanceStep, logAction, activeWorkflowRuns, getState } from '@/lib/store';
import { searchHotels } from '@/lib/amadeus';
import { evaluateAll, failureLabel, unknownLabel } from '@/lib/evaluate';
import { mastra } from '@/mastra';
import { seedElasticsearch } from '@/lib/elastic';

export async function POST() {
  // Ensure data is seeded
  await seedElasticsearch();

  // Step 2 — show cancellation
  patchState({ cancellationTriggered: true, memoryLoaded: true });
  logAction('CANCELLATION_DETECTED', 'Harbor View lost two rooms due to water damage. Confirmation HV-8842.', 'SYNTHETIC_EVENT');
  advanceStep(2);

  // Start the Mastra workflow
  try {
    const wf = mastra.getWorkflow('recover-trip');
    const run = await wf.createRun();

    // Store the run so we can resume it later
    activeWorkflowRuns.set('main', { run, step: 'load-trip-memory' });
    patchState({ workflowRunId: run.runId });

    // Kick off the workflow — it will suspend at resolve-evidence
    run.start({ inputData: { tripId: 'trip-sandiego-2026' } }).catch((err: unknown) => {
      console.error('[Workflow] start error:', err);
    });
  } catch (err) {
    console.error('[Workflow] create error:', err);
  }

  logAction('MEMORY_LOADED', 'Retrieved active hotel decision (Harbor View), 4 hard constraints, 4 relevant dependencies.', 'INFERRED');

  return NextResponse.json({ ok: true, state: getState() });
}
