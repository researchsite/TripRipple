import type { WorkflowTraceEntry } from '@/types';

const ALL_STEPS: { id: string; label: string }[] = [
  { id: 'load-trip-memory', label: 'Load Trip Memory' },
  { id: 'search-and-evaluate', label: 'Search & Evaluate Hotels' },
  { id: 'resolve-evidence', label: 'Resolve Evidence' },
  { id: 'organizer-approval', label: 'Organizer Approval' },
  { id: 'activate-decision', label: 'Activate Decision' },
  { id: 'retrieve-ripple', label: 'Retrieve Ripples' },
  { id: 'draft-updates', label: 'Draft Updates' },
];

const STATUS_STYLE: Record<string, { dot: string; label: string; bg: string }> = {
  pending:   { dot: 'bg-slate-600',  label: 'text-slate-600',  bg: '' },
  running:   { dot: 'bg-blue-400 animate-pulse',  label: 'text-blue-400',  bg: 'bg-blue-950/20' },
  suspended: { dot: 'bg-amber-400 animate-pulse', label: 'text-amber-400', bg: 'bg-amber-950/20' },
  complete:  { dot: 'bg-teal-500',   label: 'text-teal-400',   bg: 'bg-teal-950/10' },
  error:     { dot: 'bg-red-500',    label: 'text-red-400',    bg: 'bg-red-950/20' },
};

export function TracePanel({ trace }: { trace: WorkflowTraceEntry[] }) {
  const traceMap = new Map(trace.map((t) => [t.stepId, t]));
  const hasStarted = trace.length > 0;

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-1.5 h-1.5 rounded-full ${hasStarted ? 'bg-teal-400 animate-pulse' : 'bg-slate-600'}`} />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Mastra Workflow Trace
        </p>
      </div>

      {!hasStarted && (
        <p className="text-[10px] text-slate-600 italic">Trace will appear when workflow starts</p>
      )}

      <div className="space-y-1.5">
        {ALL_STEPS.map((step, i) => {
          const entry = traceMap.get(step.id);
          const status = entry?.status ?? 'pending';
          const style = STATUS_STYLE[status];

          return (
            <div key={step.id} className={`rounded-lg p-2 ${style.bg}`}>
              <div className="flex items-start gap-2">
                <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                  {i < ALL_STEPS.length - 1 && (
                    <div className={`w-px flex-1 mt-0.5 ${entry?.status === 'complete' ? 'bg-teal-800/60' : 'bg-slate-700/40'}`} style={{ height: '12px' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-semibold ${entry ? style.label : 'text-slate-700'}`}>
                      {step.label}
                    </span>
                    {status === 'suspended' && (
                      <span className="text-[8px] bg-amber-900/40 text-amber-400 px-1 rounded">⏸ SUSPENDED</span>
                    )}
                    {status === 'complete' && (
                      <span className="text-[8px] text-teal-600">✓</span>
                    )}
                  </div>
                  {entry?.detail && (
                    <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">{entry.detail}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {trace.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800/60">
          <p className="text-[9px] text-slate-600">
            {trace.filter((t) => t.status === 'complete').length}/{ALL_STEPS.length} steps complete
            {trace.some((t) => t.status === 'suspended') && ' · awaiting input'}
          </p>
        </div>
      )}
    </div>
  );
}
