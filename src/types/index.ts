export type DemoStep = 1 | 2 | 3 | 4 | 5 | 6;

export type Provenance =
  | 'LIVE_API'
  | 'CACHED_API_RESPONSE'
  | 'SYNTHETIC_EVENT'
  | 'INFERRED'
  | 'HUMAN_CONFIRMED';

export type HotelScreeningStatus = 'REJECTED' | 'NEEDS_EVIDENCE' | 'PASS';
export type DecisionState = 'Active' | 'Superseded' | 'Needs Review' | 'Conflicted';
export type ConstraintSeverity = 'Required' | 'Preferred' | 'Critical';

export interface HotelCandidate {
  id: string;
  name: string;
  nightlyPrice: number;
  currency: string;
  roomsAvailable: number;
  elevator: boolean | null;
  wheelchairAccessibleEntrance: boolean | null;
  rollInShower: boolean | null;
  parkingCostPerNight: number | null;
  address: string;
  available: boolean;
  provenance: Provenance;
  retrievedAt: string;
}

export interface EvaluationResult {
  candidateId: string;
  candidateName: string;
  status: HotelScreeningStatus;
  failures: FailureReason[];
  unknowns: UnknownField[];
}

export type FailureReason =
  | 'ROOMS'
  | 'PRICE'
  | 'ELEVATOR'
  | 'STEP_FREE'
  | 'ROLL_IN_SHOWER';

export type UnknownField = 'ROLL_IN_SHOWER' | 'ELEVATOR' | 'STEP_FREE';

export interface SourceEvent {
  id: string;
  timestamp: string;
  sourceType: string;
  sourceRef: string;
  author: string;
  participants: string;
  subject: string;
  text: string;
  authority: string;
  objectType: string;
  relatedDecisionId?: string;
  provenance: Provenance;
}

export interface Decision {
  id: string;
  subject: string;
  state: DecisionState;
  oldValue?: string;
  newValue: string;
  reason: string;
  owner: string;
  decidedAt: string;
  effectiveAt: string;
  supersedes?: string;
  sourceEventIds: string[];
  confidence: number;
}

export interface Constraint {
  id: string;
  traveler: string;
  category: string;
  requirement: string;
  severity: ConstraintSeverity;
  appliesTo: string;
  status: string;
  evidenceEventIds: string[];
}

export interface Dependency {
  id: string;
  plan: string;
  dependsOn: string;
  owner: string;
  recipient: string;
  impactFromHotelChange: string;
  requiredAction: string;
  evidenceEventIds: string[];
  relevance: 'Relevant' | 'Irrelevant distractor';
}

export interface Ripple {
  id: string;
  recipient: string;
  plan: string;
  impact: string;
  requiredAction: string;
  evidenceIds: string[];
  included: boolean;
  excludedReason?: string;
}

export interface Draft {
  id: string;
  recipient: string;
  channel: string;
  subject: string;
  body: string;
  evidenceIds: string[];
  status: 'pending' | 'approved';
}

export interface ActionLogEntry {
  timestamp: string;
  action: string;
  detail: string;
  provenance: Provenance;
}

export type WorkflowStepStatus = 'pending' | 'running' | 'suspended' | 'complete' | 'error';

export interface WorkflowTraceEntry {
  stepId: string;
  label: string;
  status: WorkflowStepStatus;
  startedAt: string;
  detail?: string;
}

export interface DemoState {
  step: DemoStep;
  completedSteps: DemoStep[];
  tripId: string;

  // Flags tracking workflow progress
  memoryLoaded: boolean;
  cancellationTriggered: boolean;
  hotelsSearched: boolean;
  evidenceConfirmed: boolean;
  changeApproved: boolean;
  ripplesRetrieved: boolean;
  draftsReady: boolean;

  // Memory counts (shown on step 1)
  sourceEventCount: number;
  decisionCount: number;
  activeDecisionCount: number;
  dependencyCount: number;
  personCount: number;

  // Step 3 data
  candidates: HotelCandidate[];
  evaluations: EvaluationResult[];

  // Step 5 data
  ripples: Ripple[];

  // Step 6 data
  drafts: Draft[];
  timeSavedMinutes: number;
  manualMinutes: number;
  triprippleMinutes: number;

  // Workflow run tracking (for Mastra suspend/resume)
  workflowRunId: string | null;

  // Action log
  actionLog: ActionLogEntry[];

  // Mastra workflow trace
  workflowTrace: WorkflowTraceEntry[];
}

// BroadcastChannel message types
export type BroadcastMessage =
  | { type: 'STATE_UPDATE'; state: DemoState }
  | { type: 'STEP_ADVANCE'; toStep: DemoStep }
  | { type: 'ACTION'; action: string; detail: string };
