'use client';

import { useState } from 'react';
import { Database, FileText, User } from 'lucide-react';
import { ProvenanceBadge } from './ProvenanceBadge';
import { TracePanel } from './TracePanel';
import type { DemoState } from '@/types';

export function MemoryPanel({ state }: { state: DemoState }) {
  const [tab, setTab] = useState<'memory' | 'trace'>('memory');
  const recentLog = [...state.actionLog].reverse().slice(0, 6);

  return (
    <aside className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-slate-800/80 flex-shrink-0">
        {(['memory', 'trace'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              tab === t
                ? 'text-teal-400 border-b-2 border-teal-500'
                : 'text-slate-600 hover:text-slate-400'
            }`}
          >
            {t === 'memory' ? 'Memory' : 'Agent Trace'}
            {t === 'trace' && state.workflowTrace.length > 0 && (
              <span className="ml-1 bg-teal-700/50 text-teal-300 px-1 rounded">
                {state.workflowTrace.filter((e) => e.status === 'complete').length}/{7}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'memory' ? (
          <div className="flex flex-col gap-4 py-5 px-4">
            {/* Memory stats */}
            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-3">
                Agent Memory
              </p>
              <div className="space-y-2">
                <MemoryStat icon={<FileText size={11} />} label="Source events" value={state.sourceEventCount} />
                <MemoryStat icon={<Database size={11} />} label="Decisions" value={state.decisionCount} sub={`${state.activeDecisionCount} active`} />
                <MemoryStat icon={<User size={11} />} label="People" value={state.personCount} />
                <MemoryStat icon={<Database size={11} />} label="Dependencies" value={state.dependencyCount} sub="relevant" />
              </div>
            </div>

            {/* Active decision */}
            {state.step >= 2 && (
              <div className="rounded-lg border border-teal-800/50 bg-teal-950/20 p-3">
                <p className="text-[10px] font-bold text-teal-500 uppercase tracking-wider mb-2">
                  Active Hotel Decision
                </p>
                {state.changeApproved ? (
                  <>
                    <p className="text-xs font-semibold text-teal-300">Mission Bay Suites</p>
                    <p className="text-[10px] text-teal-600 mt-1">D-002B — Active</p>
                    <p className="text-[10px] text-slate-500 mt-2 line-through">Harbor View (D-002A) — Superseded</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-slate-300">Harbor View</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      D-002A — {state.cancellationTriggered ? 'Under review' : 'Active'}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1">Conf: HV-8842</p>
                  </>
                )}
              </div>
            )}

            {/* Hard constraints */}
            {state.step >= 2 && (
              <div>
                <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-2">
                  Hard Constraints
                </p>
                <div className="space-y-1.5">
                  {[
                    { label: '4 rooms together', src: 'E-005' },
                    { label: '≤ $230/room/night', src: 'E-005' },
                    { label: 'Step-free entrance', src: 'E-003' },
                    { label: 'Elevator required', src: 'E-003' },
                    { label: 'Roll-in shower (Maya)', src: 'E-003' },
                  ].map((c) => (
                    <div key={c.label} className="flex items-center justify-between">
                      <p className="text-[10px] text-slate-400">{c.label}</p>
                      <span className="text-[9px] font-mono text-slate-600">{c.src}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action log */}
            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-2">
                Action Log
              </p>
              {recentLog.length === 0 ? (
                <p className="text-[10px] text-slate-600 italic">No actions yet</p>
              ) : (
                <div className="space-y-2">
                  {recentLog.map((entry, i) => (
                    <div key={i} className="border-l-2 border-slate-700 pl-2">
                      <div className="flex items-center gap-1 mb-0.5">
                        <ProvenanceBadge provenance={entry.provenance} />
                      </div>
                      <p className="text-[10px] font-semibold text-slate-300">{entry.action}</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed">{entry.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <TracePanel trace={state.workflowTrace} />
        )}
      </div>
    </aside>
  );
}

function MemoryStat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-slate-500">
        {icon}
        <span className="text-[11px]">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs font-bold text-slate-300">{value}</span>
        {sub && <span className="text-[10px] text-slate-600">({sub})</span>}
      </div>
    </div>
  );
}
