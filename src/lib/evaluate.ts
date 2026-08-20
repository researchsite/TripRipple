/**
 * Deterministic requirement evaluator.
 * Never uses AI — this is pure rule-based logic as specified in the PDD.
 * Hard constraints are tested first; unknown fields block passage.
 */

import type { HotelCandidate, EvaluationResult, FailureReason, UnknownField } from '@/types';

const PRICE_CAP = 230;
const ROOMS_REQUIRED = 4;

export function evaluate(candidate: HotelCandidate): EvaluationResult {
  const failures: FailureReason[] = [];
  const unknowns: UnknownField[] = [];

  if (!candidate.available || candidate.roomsAvailable < ROOMS_REQUIRED) {
    failures.push('ROOMS');
  }

  if (candidate.nightlyPrice > PRICE_CAP) {
    failures.push('PRICE');
  }

  if (candidate.elevator === false) {
    failures.push('ELEVATOR');
  } else if (candidate.elevator === null) {
    unknowns.push('ELEVATOR');
  }

  if (candidate.wheelchairAccessibleEntrance === false) {
    failures.push('STEP_FREE');
  } else if (candidate.wheelchairAccessibleEntrance === null) {
    unknowns.push('STEP_FREE');
  }

  if (candidate.rollInShower === false) {
    failures.push('ROLL_IN_SHOWER');
  } else if (candidate.rollInShower === null) {
    unknowns.push('ROLL_IN_SHOWER');
  }

  const status =
    failures.length > 0
      ? 'REJECTED'
      : unknowns.length > 0
      ? 'NEEDS_EVIDENCE'
      : 'PASS';

  return {
    candidateId: candidate.id,
    candidateName: candidate.name,
    status,
    failures,
    unknowns,
  };
}

export function evaluateAll(candidates: HotelCandidate[]): EvaluationResult[] {
  return candidates.map(evaluate);
}

export function failureLabel(reason: FailureReason): string {
  const labels: Record<FailureReason, string> = {
    ROOMS: `Fewer than ${ROOMS_REQUIRED} rooms available`,
    PRICE: `Nightly price exceeds $${PRICE_CAP} cap`,
    ELEVATOR: 'No elevator — fails accessibility requirement',
    STEP_FREE: 'No step-free entrance — fails accessibility requirement',
    ROLL_IN_SHOWER: 'Roll-in shower absent — fails Maya\'s requirement',
  };
  return labels[reason];
}

export function unknownLabel(field: UnknownField): string {
  const labels: Record<UnknownField, string> = {
    ROLL_IN_SHOWER: 'Roll-in shower availability unconfirmed',
    ELEVATOR: 'Elevator availability unconfirmed',
    STEP_FREE: 'Step-free entrance unconfirmed',
  };
  return labels[field];
}
