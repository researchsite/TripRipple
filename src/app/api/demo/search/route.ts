/**
 * POST /api/demo/search
 * Calls Amadeus (or cache), evaluates all candidates against hard constraints,
 * records the results, and advances to step 3.
 */

import { NextResponse } from 'next/server';
import { patchState, advanceStep, logAction, setCandidates, getState } from '@/lib/store';
import { searchHotels } from '@/lib/amadeus';
import { evaluateAll, failureLabel, unknownLabel } from '@/lib/evaluate';

export async function POST() {
  const { candidates, provenance, retrievedAt } = await searchHotels('SAN');
  const evaluations = evaluateAll(candidates);

  const enriched = evaluations.map((ev) => ({
    ...ev,
    failureLabels: ev.failures.map(failureLabel),
    unknownLabels: ev.unknowns.map(unknownLabel),
  }));

  setCandidates(candidates, enriched);

  const rejected = evaluations.filter((e) => e.status === 'REJECTED');
  const needsEvidence = evaluations.filter((e) => e.status === 'NEEDS_EVIDENCE');

  for (const r of rejected) {
    logAction(
      'REJECTED',
      `${r.candidateName} rejected: ${r.failures.map(failureLabel).join('; ')}. No contact sent.`,
      provenance
    );
  }
  for (const n of needsEvidence) {
    logAction(
      'NEEDS_EVIDENCE',
      `${n.candidateName} passes known hard checks. Missing: ${n.unknowns.join(', ')}. One inquiry required.`,
      provenance
    );
  }

  logAction('CONTACTS_SENT', `Contacts sent: 0 (${rejected.length} rejected before outreach).`, 'INFERRED');

  patchState({ hotelsSearched: true });
  advanceStep(3);

  return NextResponse.json({ ok: true, state: getState() });
}
