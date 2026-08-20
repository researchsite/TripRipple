import { NextResponse } from 'next/server';
import { getState } from '@/lib/store';
import type { HotelCandidate, EvaluationResult, FailureReason, UnknownField } from '@/types';

function evaluateCustom(c: HotelCandidate, priceCap: number, rooms: number): EvaluationResult {
  const failures: FailureReason[] = [];
  const unknowns: UnknownField[] = [];

  if (!c.available || c.roomsAvailable < rooms) failures.push('ROOMS');
  if (c.nightlyPrice > priceCap) failures.push('PRICE');
  if (c.elevator === false) failures.push('ELEVATOR');
  else if (c.elevator === null) unknowns.push('ELEVATOR');
  if (c.wheelchairAccessibleEntrance === false) failures.push('STEP_FREE');
  else if (c.wheelchairAccessibleEntrance === null) unknowns.push('STEP_FREE');
  if (c.rollInShower === false) failures.push('ROLL_IN_SHOWER');
  else if (c.rollInShower === null) unknowns.push('ROLL_IN_SHOWER');

  const status = failures.length > 0 ? 'REJECTED' : unknowns.length > 0 ? 'NEEDS_EVIDENCE' : 'PASS';
  return { candidateId: c.id, candidateName: c.name, status, failures, unknowns };
}

export async function POST(req: Request) {
  try {
    const { priceCap = 230, rooms = 4 } = await req.json();
    const state = getState();

    if (!state.candidates.length) {
      return NextResponse.json({ error: 'No candidates loaded. Complete step 2 first.' }, { status: 400 });
    }

    const evaluations = state.candidates.map((c) =>
      evaluateCustom(c, Number(priceCap), Number(rooms))
    );

    return NextResponse.json({ evaluations, priceCap, rooms });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
