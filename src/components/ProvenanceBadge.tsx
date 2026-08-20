import type { Provenance } from '@/types';

const BADGE_CONFIG: Record<Provenance, { label: string; className: string }> = {
  LIVE_API: { label: 'LIVE API', className: 'bg-blue-900/60 text-blue-300 border border-blue-700/50' },
  CACHED_API_RESPONSE: { label: 'CACHED API', className: 'bg-slate-700/60 text-slate-300 border border-slate-600/50' },
  SYNTHETIC_EVENT: { label: 'SYNTHETIC', className: 'bg-violet-900/60 text-violet-300 border border-violet-700/50' },
  INFERRED: { label: 'INFERRED', className: 'bg-amber-900/40 text-amber-300 border border-amber-700/50' },
  HUMAN_CONFIRMED: { label: 'CONFIRMED', className: 'bg-green-900/50 text-green-300 border border-green-700/50' },
};

export function ProvenanceBadge({ provenance, className = '' }: { provenance: Provenance; className?: string }) {
  const cfg = BADGE_CONFIG[provenance];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${cfg.className} ${className}`}>
      {cfg.label}
    </span>
  );
}
