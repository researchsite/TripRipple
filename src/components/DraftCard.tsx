import { MessageSquare, Check } from 'lucide-react';
import type { Draft } from '@/types';

interface DraftCardProps {
  draft: Draft;
}

export function DraftCard({ draft }: DraftCardProps) {
  const isApproved = draft.status === 'approved';

  return (
    <div className={`rounded-xl border p-4 animate-fade-in transition-all
      ${isApproved ? 'border-green-700/50 bg-green-950/20' : 'border-slate-700/50 bg-slate-800/30'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className={isApproved ? 'text-green-400' : 'text-teal-400'} />
          <div>
            <span className="text-xs font-bold text-slate-200">To: {draft.recipient}</span>
            <p className="text-[10px] text-slate-500 mt-0.5">{draft.channel}</p>
          </div>
        </div>
        {isApproved && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 uppercase tracking-wide">
            <Check size={11} /> Approved
          </span>
        )}
      </div>

      {/* Subject */}
      <p className="text-xs font-semibold text-slate-300 mb-2">{draft.subject}</p>

      {/* Body preview */}
      <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/40">
        <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">{draft.body}</p>
      </div>

      {/* Evidence */}
      <div className="flex gap-1 mt-2 flex-wrap">
        {draft.evidenceIds.map((id) => (
          <span key={id} className="text-[9px] font-mono bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded">{id}</span>
        ))}
      </div>
    </div>
  );
}
