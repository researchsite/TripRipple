/**
 * POST /api/demo/approve
 * Organizer approves Mission Bay Suites.
 * - Activates D-002B, marks D-002A Superseded in ES/memory
 * - Retrieves ripple (4 included, 3 excluded)
 * - Generates targeted drafts
 * - Resumes Mastra workflow through final steps
 * - Advances to step 5 (ripple view)
 */

import { NextResponse } from 'next/server';
import { patchState, advanceStep, logAction, getState, setRipples, activeWorkflowRuns } from '@/lib/store';
import { updateDecisionState } from '@/lib/elastic';
import { RIPPLES, DRAFTS } from '@/data/fixtures';

export async function POST() {
  // Activate new decision, supersede old
  await Promise.all([
    updateDecisionState('D-002B', 'Active'),
    updateDecisionState('D-002A', 'Superseded'),
  ]);

  patchState({ changeApproved: true });

  logAction('DECISION_ACTIVATED', 'Mission Bay Suites set ACTIVE. Harbor View set SUPERSEDED. Original rationale preserved for audit.', 'HUMAN_CONFIRMED');

  // Detect ripples
  const included = RIPPLES.filter((r) => r.included);
  const excluded = RIPPLES.filter((r) => !r.included);

  setRipples([...included, ...excluded]);

  for (const r of included) {
    logAction('RIPPLE_DETECTED', `${r.recipient} (${r.plan}): ${r.impact}`, 'INFERRED');
  }
  for (const r of excluded) {
    logAction('RIPPLE_EXCLUDED', `${r.plan}: excluded — ${r.excludedReason}`, 'INFERRED');
  }

  // Prepare drafts
  patchState({ drafts: DRAFTS, draftsReady: true });

  logAction('DRAFTS_PREPARED', `${DRAFTS.length} recipient-specific drafts prepared. Not sent — awaiting organizer approval.`, 'INFERRED');

  // Resume the Mastra workflow at organizer-approval step
  const runEntry = activeWorkflowRuns.get('main');
  if (runEntry) {
    const run = runEntry.run as { resume: (args: Record<string, unknown>) => Promise<void> };
    run.resume({ stepId: 'organizer-approval', resumeData: { approved: true } }).catch(() => {});
  }

  advanceStep(5);

  return NextResponse.json({ ok: true, state: getState() });
}
