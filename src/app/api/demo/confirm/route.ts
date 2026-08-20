/**
 * POST /api/demo/confirm
 * Simulates receiving hotel confirmation of roll-in shower availability.
 * Updates Mission Bay Suites candidate, re-evaluates (now PASS), resumes Mastra workflow.
 * Advances to step 4 (organizer approval gate).
 */

import { NextResponse } from 'next/server';
import { patchState, advanceStep, logAction, getState, activeWorkflowRuns } from '@/lib/store';
import { HOTEL_CONFIRMED_CANDIDATE } from '@/data/fixtures';
import { evaluate } from '@/lib/evaluate';

export async function POST() {
  // Update the Mission Bay Suites candidate with confirmed roll-in shower
  const confirmed = HOTEL_CONFIRMED_CANDIDATE;
  const evaluation = evaluate(confirmed);

  const state = getState();

  // Update candidates array with confirmed version
  const updatedCandidates = state.candidates.map((c) =>
    c.id === 'mission-bay-suites' ? confirmed : c
  );
  const updatedEvals = state.evaluations.map((e) =>
    e.candidateId === 'mission-bay-suites'
      ? { ...evaluation, failureLabels: [], unknownLabels: [] }
      : e
  );

  patchState({
    evidenceConfirmed: true,
    candidates: updatedCandidates,
    evaluations: updatedEvals,
  });

  logAction(
    'EVIDENCE_CONFIRMED',
    'Mission Bay Suites confirmed: roll-in shower available in room 105. Status: PASS.',
    'HUMAN_CONFIRMED'
  );
  logAction(
    'INQUIRY_SENT',
    'Inquiries sent: 1 (Mission Bay Suites only — 2 hotels rejected before any outreach).',
    'INFERRED'
  );

  // Resume the Mastra workflow at the resolve-evidence step
  const runEntry = activeWorkflowRuns.get('main');
  if (runEntry) {
    const run = runEntry.run as { resume: (args: Record<string, unknown>) => Promise<void> };
    run.resume({ stepId: 'resolve-evidence', resumeData: { evidenceConfirmed: true } }).catch(() => {});
  }

  advanceStep(4);

  return NextResponse.json({ ok: true, state: getState() });
}
