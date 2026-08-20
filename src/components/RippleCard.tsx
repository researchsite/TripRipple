import { CheckCircle, MinusCircle } from 'lucide-react';
import type { Ripple } from '@/types';

interface RippleCardProps {
  ripple: Ripple;
}

export function RippleCard({ ripple }: RippleCardProps) {
  if (!ripple.included) {
    return (
      <div className="rounded-xl border border-slate-700/40 bg-slate-800/20 p-3 opacity-50">
        <div className="flex items-center gap-2 mb-1">
          <MinusCircle size={14} className="text-slate-500" />
          <span className="text-xs font-semibold text-slate-500 line-through">{ripple.plan}</span>
          <span className="ml-auto text-[10px] text-slate-600 uppercase tracking-wide">Excluded</span>
        </div>
        <p className="text-[10px] text-slate-600 ml-5">{ripple.excludedReason}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-teal-800/50 bg-teal-950/20 p-4 animate-fade-in">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <CheckCircle size={15} className="text-teal-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-teal-300">{ripple.recipient}</span>
            <span className="text-slate-500 text-xs mx-1.5">·</span>
            <span className="text-xs text-slate-400">{ripple.plan}</span>
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {ripple.evidenceIds.slice(0, 3).map((id) => (
            <span key={id} className="text-[9px] font-mono bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded">{id}</span>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-300 ml-5 mb-2">{ripple.impact}</p>
      <div className="ml-5 p-2 rounded-lg bg-teal-900/20 border border-teal-800/30">
        <p className="text-[10px] font-bold text-teal-500 uppercase tracking-wider mb-0.5">Required action</p>
        <p className="text-xs text-teal-200">{ripple.requiredAction}</p>
      </div>
    </div>
  );
}
