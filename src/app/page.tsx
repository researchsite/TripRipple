'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  RotateCcw, Zap, Clock, Shield, Users, AlertTriangle,
  CheckCircle, ChevronRight, MessageSquare, Database, Wifi,
  Search, Sparkles, Plus, RefreshCw,
} from 'lucide-react';
import { StepRail } from '@/components/StepRail';
import { MemoryPanel } from '@/components/MemoryPanel';
import { HotelCard } from '@/components/HotelCard';
import { RippleCard } from '@/components/RippleCard';
import { DraftCard } from '@/components/DraftCard';
import { ProvenanceBadge } from '@/components/ProvenanceBadge';
import type { DemoState, EvaluationResult, SourceEvent } from '@/types';

const CHANNEL_NAME = 'tripripple-demo';
// Set NEXT_PUBLIC_INTERACTIVE_FEATURES=false in .env.local to revert to linear demo
const INTERACTIVE = process.env.NEXT_PUBLIC_INTERACTIVE_FEATURES !== 'false';

function useBroadcast(state: DemoState | null) {
  useEffect(() => {
    if (!state || typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const bc = new BroadcastChannel(CHANNEL_NAME);
    bc.postMessage({ type: 'STATE_UPDATE', state });
    return () => bc.close();
  }, [state]);
}

function useApiState() {
  const [state, setState] = useState<DemoState | null>(null);
  const [loading, setLoading] = useState(false);
  const [backend, setBackend] = useState<string>('');

  const refresh = useCallback(async () => {
    const res = await fetch('/api/demo/state');
    const data = await res.json();
    setState(data.state);
    setBackend(data.backend?.backend ?? '');
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const call = useCallback(async (url: string, method = 'POST') => {
    setLoading(true);
    try {
      const res = await fetch(url, { method });
      const data = await res.json();
      if (data.state) setState(data.state);
      if (data.backend) setBackend(data.backend?.backend ?? data.backend);
    } finally {
      setLoading(false);
    }
  }, []);

  // Non-blocking call for interactive features — doesn't spin the global loader
  const callApi = useCallback(async (url: string, body: object) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.state) setState(data.state);
    return data;
  }, []);

  return { state, loading, backend, refresh, call, callApi };
}

export default function DemoPage() {
  const { state, loading, backend, refresh, call, callApi } = useApiState();
  useBroadcast(state);

  if (!state) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
          <span className="text-sm">Loading TripRipple…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-slate-800/80 bg-[#0d1325]/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-100">TripRipple</span>
            <span className="text-xs text-slate-500 ml-2">Agent Memory Copilot</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {INTERACTIVE && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-violet-900/30 border border-violet-700/40 text-violet-400">
              <Sparkles size={9} /> Interactive
            </span>
          )}
          <span className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full border ${
            backend === 'elasticsearch'
              ? 'bg-blue-900/30 border-blue-700/40 text-blue-400'
              : 'bg-slate-800 border-slate-700 text-slate-500'
          }`}>
            {backend === 'elasticsearch' ? <Wifi size={10} /> : <Database size={10} />}
            {backend === 'elasticsearch' ? 'Elasticsearch' : 'In-memory'}
          </span>
          <a
            href="/notes"
            target="_blank"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded border border-slate-700 hover:border-slate-500 transition-colors"
          >
            <MessageSquare size={11} /> Notes
          </a>
          <button
            onClick={() => call('/api/demo/reset')}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 px-2 py-1 rounded border border-slate-700 hover:border-red-800 transition-colors disabled:opacity-50"
          >
            <RotateCcw size={11} /> Reset
          </button>
          <span className="text-xs font-mono text-teal-400 bg-teal-900/30 px-2 py-1 rounded border border-teal-800/50">
            Step {state.step}/6
          </span>
        </div>
      </header>

      {/* Main layout: rail | content | memory */}
      <div className="flex flex-1 min-h-0">
        <div className="w-52 flex-shrink-0 border-r border-slate-800/80 bg-[#0d1325]/60 overflow-y-auto">
          <StepRail currentStep={state.step} completedSteps={state.completedSteps} />
        </div>

        <main className="flex-1 overflow-y-auto px-8 py-6">
          {state.step === 1 && (
            <Step1
              state={state}
              loading={loading}
              onStart={() => call('/api/demo/cancel')}
              callApi={callApi}
            />
          )}
          {state.step === 2 && (
            <Step2 state={state} loading={loading} onSearch={() => call('/api/demo/search')} />
          )}
          {state.step === 3 && (
            <Step3
              state={state}
              loading={loading}
              onAsk={() => call('/api/demo/confirm')}
              callApi={callApi}
            />
          )}
          {state.step === 4 && (
            <Step4 state={state} loading={loading} onApprove={() => call('/api/demo/approve')} />
          )}
          {state.step === 5 && (
            <Step5
              state={state}
              loading={loading}
              onNext={() =>
                call('/api/demo/drafts', 'GET').then(() => call('/api/demo/drafts', 'POST'))
              }
            />
          )}
          {state.step === 6 && <Step6 state={state} />}
        </main>

        <div className="w-64 flex-shrink-0 border-l border-slate-800/80 bg-[#0d1325]/60 overflow-y-auto">
          <MemoryPanel state={state} />
        </div>
      </div>
    </div>
  );
}

// ── Shared content: connected memory overview ─────────────────────────────────
function OverviewContent({ state }: { state: DemoState }) {
  return (
    <>
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5 mb-5">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Connected memory</p>
        <div className="space-y-2">
          {[
            { label: 'Group chat exports', count: '18 messages', badge: 'SYNTHETIC_EVENT' as const },
            { label: 'Email threads', count: '9 emails', badge: 'SYNTHETIC_EVENT' as const },
            { label: 'Shared documents', count: '3 docs', badge: 'SYNTHETIC_EVENT' as const },
            { label: 'Call notes', count: '2 transcripts', badge: 'SYNTHETIC_EVENT' as const },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{s.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{s.count}</span>
                <ProvenanceBadge provenance={s.badge} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-slate-700/40 bg-slate-800/20 p-4 text-xs text-slate-400">
        <p className="font-semibold text-slate-300 mb-1">How TripRipple works</p>
        <p>Participants stay in email, Slack, or group chat. No TripRipple account needed. Only the organizer uses this workspace.</p>
      </div>
    </>
  );
}

// ── Step 1: Workspace ready ───────────────────────────────────────────────────
function Step1({
  state,
  loading,
  onStart,
  callApi,
}: {
  state: DemoState;
  loading: boolean;
  onStart: () => void;
  callApi: (url: string, body: object) => Promise<unknown>;
}) {
  type Tab = 'overview' | 'ask' | 'inject';
  const [tab, setTab] = useState<Tab>('overview');

  // Ask memory state
  const [question, setQuestion] = useState('');
  const [queryResult, setQueryResult] = useState<{
    answer: string;
    sources: SourceEvent[];
    mode: string;
  } | null>(null);
  const [queryWithoutMemory, setQueryWithoutMemory] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);

  // Inject event state
  const [injectText, setInjectText] = useState('');
  const [injectResult, setInjectResult] = useState<{
    eventId: string;
    classified: {
      type: string;
      subject: string;
      keyFact: string;
      affects: string[];
      confidence: number;
    };
  } | null>(null);
  const [injectLoading, setInjectLoading] = useState(false);

  const handleQuery = async () => {
    if (!question.trim()) return;
    setQueryLoading(true);
    setQueryWithoutMemory(null);
    setQueryResult(null);
    try {
      // Fetch both in parallel: without memory and with memory
      const [without, with_] = await Promise.all([
        callApi('/api/demo/query', { question, mode: 'without-memory' }),
        callApi('/api/demo/query', { question, mode: 'with-memory' }),
      ]);
      setQueryWithoutMemory((without as { answer: string }).answer);
      setQueryResult(with_ as typeof queryResult);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleInject = async () => {
    if (!injectText.trim()) return;
    setInjectLoading(true);
    try {
      const data = await callApi('/api/demo/inject', { text: injectText });
      setInjectResult(data as typeof injectResult);
      setInjectText('');
    } finally {
      setInjectLoading(false);
    }
  };

  const SAMPLE_QUESTIONS = [
    "Why was Harbor View chosen?",
    "What are Maya's requirements?",
    "What is the budget cap?",
  ];

  return (
    <div className="max-w-2xl animate-fade-in">
      <StepHeader step={1} title="San Diego Weekend" subtitle="STEP 1 OF 6" />

      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard
          icon={<MessageSquare size={16} className="text-teal-400" />}
          value={state.sourceEventCount}
          label="Source events"
          sub="Emails · Chats · Docs"
        />
        <StatCard
          icon={<Database size={16} className="text-blue-400" />}
          value={state.decisionCount}
          label="Decisions"
          sub={`${state.activeDecisionCount} active`}
        />
        <StatCard
          icon={<Users size={16} className="text-violet-400" />}
          value={state.personCount}
          label="Travelers"
          sub="Organizer + 7 participants"
        />
      </div>

      {INTERACTIVE ? (
        <>
          {/* Tab bar */}
          <div className="flex gap-1 mb-4 p-1 rounded-lg bg-slate-800/40 border border-slate-700/40">
            {([
              { id: 'overview', label: 'Overview', icon: null },
              { id: 'ask', label: 'Ask Memory', icon: <Search size={11} /> },
              { id: 'inject', label: 'Inject Event', icon: <Plus size={11} /> },
            ] as { id: Tab; label: string; icon: React.ReactNode }[]).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 flex-1 justify-center py-1.5 text-xs font-medium rounded-md transition-all ${
                  tab === t.id
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {tab === 'overview' && <OverviewContent state={state} />}

          {/* Ask Memory tab */}
          {tab === 'ask' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Query trip memory
                </p>
                <div className="flex gap-2">
                  <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                    placeholder="Why was Harbor View chosen? What does Maya need?"
                    className="flex-1 text-xs bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-600"
                  />
                  <button
                    onClick={handleQuery}
                    disabled={queryLoading || !question.trim()}
                    className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    {queryLoading ? (
                      <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Search size={12} />
                    )}
                    Ask
                  </button>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {SAMPLE_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuestion(q)}
                      className="text-[10px] text-slate-500 hover:text-teal-400 border border-slate-700/50 hover:border-teal-800 rounded px-2 py-0.5 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Before/After comparison — rubric requirement */}
              {(queryWithoutMemory || queryResult) && (
                <div className="space-y-2">
                  {queryWithoutMemory && (
                    <div className="rounded-xl border border-red-800/40 bg-red-950/10 p-3">
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1.5">
                        ✗ Without Memory
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed italic">{queryWithoutMemory}</p>
                    </div>
                  )}
                  {queryResult && (
                    <div className="rounded-xl border border-teal-700/40 bg-teal-950/20 p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Sparkles size={11} className="text-teal-400" />
                        <p className="text-[10px] font-bold text-teal-500 uppercase tracking-wider">
                          ✓ With Memory
                        </p>
                        {queryResult.mode === 'keyword' && (
                          <span className="ml-auto text-[10px] text-slate-600">(keyword fallback)</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{queryResult.answer}</p>
                      {queryResult.sources?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1 items-center">
                          <span className="text-[9px] text-slate-500">Sources:</span>
                          {queryResult.sources.map((s) => (
                            <span key={s.id} className="text-[9px] bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                              {s.id}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Inject Event tab */}
          {tab === 'inject' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Inject a new message
                </p>
                <p className="text-[10px] text-slate-500 mb-3">
                  Paste any email, chat, or note. TripRipple classifies it and adds it to memory.
                </p>
                <textarea
                  value={injectText}
                  onChange={(e) => setInjectText(e.target.value)}
                  placeholder={`e.g. "Just confirmed — the concert venue is 5 min walk from Mission Bay Suites!"`}
                  rows={3}
                  className="w-full text-xs bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-600 resize-none"
                />
                <button
                  onClick={handleInject}
                  disabled={injectLoading || !injectText.trim()}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  {injectLoading ? (
                    <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus size={12} />
                  )}
                  Inject Event
                </button>
              </div>

              {injectResult && (
                <div className="rounded-xl border border-violet-700/40 bg-violet-950/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={12} className="text-violet-400" />
                    <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">
                      Classified · {injectResult.eventId}
                    </p>
                    <span
                      className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        injectResult.classified.type === 'decision'
                          ? 'bg-blue-900/50 text-blue-300'
                          : injectResult.classified.type === 'constraint'
                          ? 'bg-red-900/50 text-red-300'
                          : injectResult.classified.type === 'dependency'
                          ? 'bg-amber-900/50 text-amber-300'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {injectResult.classified.type}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-200 mb-1">
                    {injectResult.classified.subject}
                  </p>
                  <p className="text-xs text-slate-400 mb-3">{injectResult.classified.keyFact}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {injectResult.classified.affects.map((a) => (
                      <span
                        key={a}
                        className="text-[10px] bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 rounded bg-slate-700">
                      <div
                        className="h-1 rounded bg-violet-500 transition-all"
                        style={{ width: `${(injectResult.classified.confidence * 100).toFixed(0)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {(injectResult.classified.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <OverviewContent state={state} />
      )}

      <div className="mt-6">
        <ActionButton onClick={onStart} loading={loading} icon={<Zap size={14} />}>
          Start live recovery
        </ActionButton>
      </div>
    </div>
  );
}

// ── Step 2: Cancellation detected ────────────────────────────────────────────
function Step2({
  state,
  loading,
  onSearch,
}: {
  state: DemoState;
  loading: boolean;
  onSearch: () => void;
}) {
  return (
    <div className="max-w-2xl animate-fade-in">
      <StepHeader step={2} title="Harbor View Cancellation" subtitle="STEP 2 OF 6" />

      <div className="rounded-xl border border-red-800/60 bg-red-950/20 p-4 mb-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-bold text-red-300">Incoming event</p>
              <ProvenanceBadge provenance="SYNTHETIC_EVENT" />
            </div>
            <p className="text-xs text-slate-300">
              Harbor View lost two rooms due to water damage. The group can no longer stay together.
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              Source: simulated hotel email · Conf HV-8842 · just now
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-teal-800/50 bg-teal-950/20 p-4 mb-5">
        <p className="text-[10px] font-bold text-teal-500 uppercase tracking-wider mb-2">
          Recovered decision
        </p>
        <p className="text-xs font-semibold text-slate-200 mb-1">Current hotel: Harbor View</p>
        <div className="space-y-1 mt-2">
          {[
            'Four rooms together — E-008',
            'Budget $230/room/night max — E-005',
            'Accessibility confirmed by Maya — E-007',
          ].map((r) => (
            <p key={r} className="text-xs text-slate-400 flex items-center gap-1.5">
              <CheckCircle size={10} className="text-teal-500" /> {r}
            </p>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 mt-2">
          Status will change only after organizer approval
        </p>
      </div>

      <ActionButton onClick={onSearch} loading={loading} icon={<ChevronRight size={14} />}>
        Find replacements
      </ActionButton>
    </div>
  );
}

// ── Step 3: Candidate screening ───────────────────────────────────────────────
function Step3({
  state,
  loading,
  onAsk,
  callApi,
}: {
  state: DemoState;
  loading: boolean;
  onAsk: () => void;
  callApi: (url: string, body: object) => Promise<unknown>;
}) {
  const viable = state.evaluations.find((e) => e.status === 'NEEDS_EVIDENCE');

  const [priceCap, setPriceCap] = useState(230);
  const [rooms, setRooms] = useState(4);
  const [customEvals, setCustomEvals] = useState<EvaluationResult[] | null>(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const handleReEvaluate = async () => {
    setEvalLoading(true);
    try {
      const data = await callApi('/api/demo/evaluate', { priceCap, rooms });
      const result = data as { evaluations: EvaluationResult[] };
      setCustomEvals(result.evaluations);
    } finally {
      setEvalLoading(false);
    }
  };

  const displayEvals = customEvals ?? state.evaluations;
  const rejectedCount = displayEvals.filter((e) => e.status === 'REJECTED').length;
  const needsEvidenceCount = displayEvals.filter((e) => e.status === 'NEEDS_EVIDENCE').length;
  const passCount = displayEvals.filter((e) => e.status === 'PASS').length;

  return (
    <div className="max-w-2xl animate-fade-in">
      <StepHeader step={3} title="Replacement Shortlist" subtitle="STEP 3 OF 6" />

      {/* Contacts sent — the WOW moment */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-xl border border-slate-700/50 bg-slate-800/30">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-black text-teal-400">0</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">Contacts sent</span>
        </div>
        <div className="w-px h-10 bg-slate-700" />
        <div className="text-xs text-slate-400">
          <span className="font-semibold text-red-400">{rejectedCount} properties rejected</span>{' '}
          before any outreach.
          <br />
          Agent checked memory first.
        </div>
        {state.candidates[0] && (
          <div className="ml-auto">
            <ProvenanceBadge provenance={state.candidates[0].provenance} />
          </div>
        )}
      </div>

      {/* Constraint editor — interactive only */}
      {INTERACTIVE && (
        <div className="mb-4">
          <button
            onClick={() => {
              setShowEditor(!showEditor);
              if (showEditor) setCustomEvals(null);
            }}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-400 transition-colors mb-2"
          >
            <RefreshCw size={11} />
            {showEditor ? 'Reset constraints' : 'Try different constraints'}
          </button>

          {showEditor && (
            <div className="rounded-xl border border-violet-700/30 bg-violet-950/10 p-4 mb-3">
              <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wider mb-3">
                Constraint editor — see which hotels flip
              </p>
              <div className="flex items-center gap-5 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400">Price cap</label>
                  <span className="text-xs font-mono font-bold text-violet-300">${priceCap}</span>
                  <input
                    type="range"
                    min={180}
                    max={300}
                    step={5}
                    value={priceCap}
                    onChange={(e) => {
                      setPriceCap(Number(e.target.value));
                      setCustomEvals(null);
                    }}
                    className="w-28 accent-violet-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400">Rooms required</label>
                  <select
                    value={rooms}
                    onChange={(e) => {
                      setRooms(Number(e.target.value));
                      setCustomEvals(null);
                    }}
                    className="text-xs bg-slate-900 border border-slate-600 text-slate-200 rounded px-2 py-1"
                  >
                    {[2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>{n} rooms</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleReEvaluate}
                  disabled={evalLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  {evalLoading ? (
                    <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <RefreshCw size={11} />
                  )}
                  Re-evaluate
                </button>
              </div>
              {customEvals && (
                <p className="text-[10px] text-violet-300 mt-2">
                  With ${priceCap} cap, {rooms} rooms:{' '}
                  <span className="text-red-400">{rejectedCount} rejected</span>
                  {needsEvidenceCount > 0 && <span className="text-amber-400"> · {needsEvidenceCount} need evidence</span>}
                  {passCount > 0 && <span className="text-green-400"> · {passCount} pass</span>}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Hotel cards */}
      <div className="space-y-3 mb-5">
        {state.candidates.map((candidate) => {
          const evaluation = displayEvals.find((e) => e.candidateId === candidate.id);
          if (!evaluation) return null;
          return (
            <HotelCard
              key={candidate.id}
              candidate={candidate}
              evaluation={evaluation as Parameters<typeof HotelCard>[0]['evaluation']}
            />
          );
        })}
      </div>

      {viable && (
        <ActionButton onClick={onAsk} loading={loading} icon={<MessageSquare size={14} />}>
          Ask one blocking question
        </ActionButton>
      )}
    </div>
  );
}

// ── Step 4: Evidence + approval ───────────────────────────────────────────────
function Step4({
  state,
  loading,
  onApprove,
}: {
  state: DemoState;
  loading: boolean;
  onApprove: () => void;
}) {
  const mbs = state.candidates.find((c) => c.id === 'mission-bay-suites');
  const mbsEval = state.evaluations.find((e) => e.candidateId === 'mission-bay-suites');

  return (
    <div className="max-w-2xl animate-fade-in">
      <StepHeader step={4} title="Resolve Missing Evidence" subtitle="STEP 4 OF 6" />

      <div className="rounded-xl border border-amber-700/50 bg-amber-950/20 p-4 mb-4">
        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-2">
          One inquiry only
        </p>
        <p className="text-xs text-slate-300 mb-1">
          <span className="text-slate-500">To:</span> Mission Bay Suites
        </p>
        <p className="text-xs text-slate-300">
          <span className="text-slate-500">Question:</span> Can one accessible room include a
          roll-in shower?
        </p>
      </div>

      <div className="rounded-xl border border-green-700/50 bg-green-950/20 p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle size={15} className="text-green-400" />
          <p className="text-xs font-bold text-green-300">Reply received</p>
          <ProvenanceBadge provenance="HUMAN_CONFIRMED" />
        </div>
        <p className="text-xs text-slate-300">
          "We confirm room 105 has a roll-in shower. Step-free south entrance and elevator are
          available."
        </p>
        <p className="text-[10px] text-slate-500 mt-1">
          — Mission Bay Suites (simulated confirmation)
        </p>
      </div>

      {mbs && mbsEval && (
        <div className="mb-5">
          <HotelCard
            candidate={mbs}
            evaluation={mbsEval as Parameters<typeof HotelCard>[0]['evaluation']}
          />
        </div>
      )}

      <div className="rounded-xl border border-teal-700/50 bg-teal-950/20 p-4 mb-5">
        <p className="text-[10px] font-bold text-teal-500 uppercase tracking-wider mb-2">
          Organizer checkpoint
        </p>
        <p className="text-xs text-slate-300 mb-3">
          All hard requirements now confirmed. Approve Mission Bay Suites as the new hotel?
        </p>
        <div className="space-y-1">
          {[
            'Four rooms available: ✓',
            '$205/night (under $230 cap): ✓',
            'Step-free entrance: ✓',
            'Elevator: ✓',
            'Roll-in shower (room 105): ✓ CONFIRMED',
          ].map((item) => (
            <p key={item} className="text-xs text-green-300 flex items-center gap-1.5">
              <CheckCircle size={10} className="text-green-500" /> {item}
            </p>
          ))}
        </div>
        <p className="text-[10px] text-amber-400 mt-2">
          ⚠ Harbor View remains the active decision until you approve
        </p>
      </div>

      <ActionButton
        onClick={onApprove}
        loading={loading}
        icon={<CheckCircle size={14} />}
        variant="success"
      >
        Approve change
      </ActionButton>
    </div>
  );
}

// ── Step 5: Ripple ────────────────────────────────────────────────────────────
function Step5({
  state,
  loading,
  onNext,
}: {
  state: DemoState;
  loading: boolean;
  onNext: () => void;
}) {
  const included = state.ripples.filter((r) => r.included);
  const excluded = state.ripples.filter((r) => !r.included);

  return (
    <div className="max-w-2xl animate-fade-in">
      <StepHeader step={5} title="What Changes Downstream?" subtitle="STEP 5 OF 6" />

      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 mb-5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
          Decision timeline
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-slate-600 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-xs text-slate-500 line-through">Harbor View</span>
              <span className="ml-2 text-[10px] text-slate-600 uppercase">
                Superseded · D-002A
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0 animate-pulse-slow" />
            <div className="flex-1">
              <span className="text-xs font-semibold text-teal-300">Mission Bay Suites</span>
              <span className="ml-2 text-[10px] text-teal-600 uppercase">Active · D-002B</span>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 mt-3">
          Rationale and evidence preserved. Harbor View traceable for audit.
        </p>
      </div>

      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
        Affected plans ({included.length}) · Excluded ({excluded.length})
      </p>
      <div className="space-y-2 mb-5">
        {included.map((r) => (
          <RippleCard key={r.id} ripple={r} />
        ))}
        {excluded.map((r) => (
          <RippleCard key={r.id} ripple={r} />
        ))}
      </div>

      <ActionButton onClick={onNext} loading={loading} icon={<MessageSquare size={14} />}>
        Prepare targeted updates
      </ActionButton>
    </div>
  );
}

// ── Step 6: Targeted updates + value ─────────────────────────────────────────
function Step6({ state }: { state: DemoState }) {
  return (
    <div className="max-w-2xl animate-fade-in">
      <StepHeader step={6} title="Ready to Communicate" subtitle="STEP 6 OF 6" />

      <div className="rounded-xl border border-teal-700/50 bg-teal-950/20 p-5 mb-5">
        <div className="flex items-center gap-4">
          <Clock size={24} className="text-teal-400 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-teal-400">{state.timeSavedMinutes}</span>
              <span className="text-sm text-teal-600">min estimated saved</span>
            </div>
            <div className="flex gap-4 mt-1 text-xs text-slate-500">
              <span>Manual: {state.manualMinutes} min</span>
              <span>·</span>
              <span>TripRipple: {state.triprippleMinutes} min</span>
            </div>
          </div>
          <ProvenanceBadge provenance="SYNTHETIC_EVENT" />
        </div>
        <p className="text-[10px] text-slate-500 mt-2">
          Synthetic estimate. Real product uses timestamps from organizer actions.
        </p>
      </div>

      <div className="space-y-3 mb-5">
        {state.drafts.map((draft) => (
          <DraftCard key={draft.id} draft={draft} />
        ))}
      </div>

      <div className="rounded-xl border border-slate-700/40 bg-slate-800/20 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={14} className="text-slate-400" />
          <p className="text-xs font-semibold text-slate-300">Enterprise-ready design</p>
        </div>
        <div className="text-xs text-slate-500 space-y-1">
          <p>• Participants receive only what they need — in channels they already use</p>
          <p>• Every fact carries provenance — no silent inferences</p>
          <p>• Organizer approval required before any decision activates</p>
          <p>• Audit trail preserved — superseded decisions remain traceable</p>
          <p>• Works for any domain: project meetings, procurement, scheduling, compliance</p>
        </div>
      </div>
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function StepHeader({
  step,
  title,
  subtitle,
}: {
  step: number;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-[10px] font-bold tracking-widest text-teal-600 uppercase mb-1">
        {subtitle}
      </p>
      <h1 className="text-xl font-bold text-slate-100">{title}</h1>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  sub,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-2xl font-black text-slate-100">{value}</p>
      <p className="text-xs font-semibold text-slate-300 mt-0.5">{label}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  loading,
  icon,
  variant = 'primary',
}: {
  children: React.ReactNode;
  onClick: () => void;
  loading: boolean;
  icon: React.ReactNode;
  variant?: 'primary' | 'success';
}) {
  const base =
    variant === 'success'
      ? 'bg-green-600 hover:bg-green-500 text-white border-green-500'
      : 'bg-teal-600 hover:bg-teal-500 text-white border-teal-500';

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all border disabled:opacity-50 disabled:cursor-not-allowed ${base}`}
    >
      {loading ? (
        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
