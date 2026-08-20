/**
 * Mastra 1.60.0 workflow: Trip Recovery
 *
 * execute({ inputData, getInitData, suspend, getStepResult }) is the correct signature.
 * inputData = previous step output (or workflow input for first step).
 * suspend(payload) = marks workflow suspended; step re-executes on resume.
 *
 * Suspension pattern:
 *   if (!state.flagSet) { await suspend({...}); }  // first run suspends
 *   // on resume, flag is true in server state, step skips suspend and proceeds
 */

import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { getState, traceStep } from '@/lib/store';
import { updateDecisionState, getAllDecisions, getActiveConstraints, getActiveDecision } from '@/lib/elastic';
import { searchHotels } from '@/lib/amadeus';
import { evaluateAll } from '@/lib/evaluate';
import { RIPPLES, DRAFTS } from '@/data/fixtures';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StepParams = any;

// ── Step 1: Load trip memory ──────────────────────────────────────────────────
const loadMemoryStep = createStep({
  id: 'load-trip-memory',
  inputSchema: z.object({ tripId: z.string() }),
  outputSchema: z.object({
    activeHotelId: z.string().nullable(),
    decisionCount: z.number(),
    activeCount: z.number(),
  }),
  execute: async ({ inputData }: StepParams) => {
    traceStep('load-trip-memory', 'Load Trip Memory', 'running', 'Querying Elasticsearch for active decisions and constraints');
    const [decisions, constraints, activeHotel] = await Promise.all([
      getAllDecisions(),
      getActiveConstraints(),
      getActiveDecision('Hotel'),
    ]);
    traceStep('load-trip-memory', 'Load Trip Memory', 'complete', `${decisions.length} decisions · ${constraints.length} constraints retrieved`);
    return {
      activeHotelId: activeHotel?.id ?? null,
      decisionCount: decisions.length,
      activeCount: decisions.filter((d) => d.state === 'Active').length,
    };
  },
});

// ── Step 2: Search + evaluate ─────────────────────────────────────────────────
const searchHotelsStep = createStep({
  id: 'search-and-evaluate',
  inputSchema: z.object({
    activeHotelId: z.string().nullable(),
    decisionCount: z.number(),
    activeCount: z.number(),
  }),
  outputSchema: z.object({
    rejectedCount: z.number(),
    needsEvidenceCount: z.number(),
    provenance: z.string(),
  }),
  execute: async (_params: StepParams) => {
    traceStep('search-and-evaluate', 'Search & Evaluate Hotels', 'running', 'Calling Amadeus Hotel Search API');
    const { candidates, provenance } = await searchHotels('SAN');
    const evaluations = evaluateAll(candidates);
    const rejected = evaluations.filter((e) => e.status === 'REJECTED').length;
    const needsEvidence = evaluations.filter((e) => e.status === 'NEEDS_EVIDENCE').length;
    traceStep('search-and-evaluate', 'Search & Evaluate Hotels', 'complete', `${rejected} rejected · ${needsEvidence} need evidence · provenance: ${provenance}`);
    return { rejectedCount: rejected, needsEvidenceCount: needsEvidence, provenance };
  },
});

// ── Step 3: Wait for hotel evidence ───────────────────────────────────────────
const resolveEvidenceStep = createStep({
  id: 'resolve-evidence',
  inputSchema: z.object({
    rejectedCount: z.number(),
    needsEvidenceCount: z.number(),
    provenance: z.string(),
  }),
  outputSchema: z.object({ evidenceConfirmed: z.boolean() }),
  execute: async ({ suspend }: StepParams) => {
    const state = getState();
    if (!state.evidenceConfirmed) {
      traceStep('resolve-evidence', 'Resolve Evidence', 'suspended', 'Waiting: roll-in shower confirmation from Mission Bay Suites');
      await suspend?.({ awaiting: 'hotel-evidence', question: 'Can one accessible room include a roll-in shower?' });
    }
    traceStep('resolve-evidence', 'Resolve Evidence', 'complete', 'Room 105 roll-in shower confirmed by hotel');
    return { evidenceConfirmed: true };
  },
});

// ── Step 4: Organizer approval ────────────────────────────────────────────────
const organizerApprovalStep = createStep({
  id: 'organizer-approval',
  inputSchema: z.object({ evidenceConfirmed: z.boolean() }),
  outputSchema: z.object({ approved: z.boolean(), approvedAt: z.string() }),
  execute: async ({ suspend }: StepParams) => {
    const state = getState();
    if (!state.changeApproved) {
      traceStep('organizer-approval', 'Organizer Approval', 'suspended', 'Waiting: organizer must approve Mission Bay Suites');
      await suspend?.({ awaiting: 'organizer-approval', candidate: 'mission-bay-suites' });
    }
    traceStep('organizer-approval', 'Organizer Approval', 'complete', 'Approved by organizer — Harbor View → Superseded');
    return { approved: true, approvedAt: new Date().toISOString() };
  },
});

// ── Step 5: Activate decision ─────────────────────────────────────────────────
const activateDecisionStep = createStep({
  id: 'activate-decision',
  inputSchema: z.object({ approved: z.boolean(), approvedAt: z.string() }),
  outputSchema: z.object({ supersededId: z.string(), activeId: z.string() }),
  execute: async (_params: StepParams) => {
    traceStep('activate-decision', 'Activate Decision', 'running', 'Writing D-002B=Active, D-002A=Superseded to Elasticsearch');
    await Promise.all([
      updateDecisionState('D-002B', 'Active'),
      updateDecisionState('D-002A', 'Superseded'),
    ]);
    traceStep('activate-decision', 'Activate Decision', 'complete', 'D-002B active · D-002A superseded (audit trail preserved)');
    return { supersededId: 'D-002A', activeId: 'D-002B' };
  },
});

// ── Step 6: Retrieve ripple ───────────────────────────────────────────────────
const retrieveRippleStep = createStep({
  id: 'retrieve-ripple',
  inputSchema: z.object({ supersededId: z.string(), activeId: z.string() }),
  outputSchema: z.object({ includedCount: z.number(), excludedCount: z.number() }),
  execute: async (_params: StepParams) => {
    traceStep('retrieve-ripple', 'Retrieve Ripples', 'running', 'Querying dependency graph for downstream impacts');
    const included = RIPPLES.filter((r) => r.included).length;
    const excluded = RIPPLES.filter((r) => !r.included).length;
    traceStep('retrieve-ripple', 'Retrieve Ripples', 'complete', `${included} affected · ${excluded} excluded (no hotel dependency)`);
    return { includedCount: included, excludedCount: excluded };
  },
});

// ── Step 7: Draft updates ─────────────────────────────────────────────────────
const draftUpdatesStep = createStep({
  id: 'draft-updates',
  inputSchema: z.object({ includedCount: z.number(), excludedCount: z.number() }),
  outputSchema: z.object({ draftsCount: z.number() }),
  execute: async (_params: StepParams) => {
    traceStep('draft-updates', 'Draft Updates', 'running', 'Generating targeted messages per recipient');
    traceStep('draft-updates', 'Draft Updates', 'complete', `${DRAFTS.length} drafts ready — each recipient gets only what they need`);
    return { draftsCount: DRAFTS.length };
  },
});

// ── Assemble workflow ─────────────────────────────────────────────────────────
export const recoverTripWorkflow = createWorkflow({
  id: 'recover-trip',
  inputSchema: z.object({ tripId: z.string() }),
  outputSchema: z.object({ draftsCount: z.number() }),
  steps: [
    loadMemoryStep,
    searchHotelsStep,
    resolveEvidenceStep,
    organizerApprovalStep,
    activateDecisionStep,
    retrieveRippleStep,
    draftUpdatesStep,
  ],
});

recoverTripWorkflow
  .then(loadMemoryStep)
  .then(searchHotelsStep)
  .then(resolveEvidenceStep)
  .then(organizerApprovalStep)
  .then(activateDecisionStep)
  .then(retrieveRippleStep)
  .then(draftUpdatesStep)
  .commit();
