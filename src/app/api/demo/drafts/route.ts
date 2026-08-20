/**
 * POST /api/demo/drafts/approve — organizer approves all drafts (demo ends)
 * GET  /api/demo/drafts       — returns current draft state
 */

import { NextResponse } from 'next/server';
import { patchState, advanceStep, logAction, getState } from '@/lib/store';

export async function GET() {
  const state = getState();
  return NextResponse.json({ drafts: state.drafts, count: state.drafts.length });
}

export async function POST() {
  const state = getState();
  const approvedDrafts = state.drafts.map((d) => ({ ...d, status: 'approved' as const }));
  patchState({ drafts: approvedDrafts });
  logAction('DRAFTS_APPROVED', `${approvedDrafts.length} drafts approved. Demo complete. No external sends in MVP.`, 'HUMAN_CONFIRMED');
  advanceStep(6);
  return NextResponse.json({ ok: true, state: getState() });
}
