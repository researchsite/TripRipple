/**
 * Server-side demo state singleton.
 * Lives in module scope — survives across API route calls in the same process.
 * Reset via POST /api/demo/reset.
 */

import type { DemoState, ActionLogEntry, HotelCandidate, EvaluationResult, Ripple, Draft, Provenance, WorkflowTraceEntry, WorkflowStepStatus } from '@/types';

function initialState(): DemoState {
  return {
    step: 1,
    completedSteps: [],
    tripId: 'trip-sandiego-2026',

    memoryLoaded: false,
    cancellationTriggered: false,
    hotelsSearched: false,
    evidenceConfirmed: false,
    changeApproved: false,
    ripplesRetrieved: false,
    draftsReady: false,

    sourceEventCount: 32,
    decisionCount: 7,
    activeDecisionCount: 5,
    dependencyCount: 4,
    personCount: 8,

    candidates: [],
    evaluations: [],
    ripples: [],
    drafts: [],

    timeSavedMinutes: 48,
    manualMinutes: 51,
    triprippleMinutes: 3,

    workflowRunId: null,

    actionLog: [],
    workflowTrace: [],
  };
}

let _state: DemoState = initialState();

// Active Mastra workflow runs — stored by runId so resume works across API calls
export const activeWorkflowRuns = new Map<string, { run: unknown; step: string }>();

export function getState(): DemoState {
  return _state;
}

export function resetState(): DemoState {
  _state = initialState();
  activeWorkflowRuns.clear();
  return _state;
}

export function patchState(patch: Partial<DemoState>): DemoState {
  _state = { ..._state, ...patch };
  return _state;
}

export function logAction(action: string, detail: string, provenance: Provenance = 'INFERRED'): void {
  const entry: ActionLogEntry = {
    timestamp: new Date().toISOString(),
    action,
    detail,
    provenance,
  };
  _state = { ..._state, actionLog: [..._state.actionLog, entry] };
}

export function advanceStep(to: 1 | 2 | 3 | 4 | 5 | 6): void {
  const completed = _state.completedSteps.includes(_state.step)
    ? _state.completedSteps
    : [..._state.completedSteps, _state.step];
  _state = { ..._state, step: to, completedSteps: completed as (1 | 2 | 3 | 4 | 5 | 6)[] };
}

export function setCandidates(candidates: HotelCandidate[], evaluations: EvaluationResult[]): void {
  _state = { ..._state, candidates, evaluations, hotelsSearched: true };
}

export function setRipples(ripples: Ripple[]): void {
  _state = { ..._state, ripples, ripplesRetrieved: true };
}

export function setDrafts(drafts: Draft[]): void {
  _state = { ..._state, drafts, draftsReady: true };
}

export function traceStep(stepId: string, label: string, status: WorkflowStepStatus, detail?: string): void {
  const existing = _state.workflowTrace.findIndex((t) => t.stepId === stepId);
  const entry: WorkflowTraceEntry = { stepId, label, status, startedAt: new Date().toISOString(), detail };
  if (existing >= 0) {
    const updated = [..._state.workflowTrace];
    updated[existing] = entry;
    _state = { ..._state, workflowTrace: updated };
  } else {
    _state = { ..._state, workflowTrace: [..._state.workflowTrace, entry] };
  }
}
