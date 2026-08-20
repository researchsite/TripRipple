import { CheckCircle, XCircle, AlertCircle, Wifi, Car, Accessibility } from 'lucide-react';
import { ProvenanceBadge } from './ProvenanceBadge';
import type { HotelCandidate, EvaluationResult } from '@/types';

const STATUS_CONFIG = {
  REJECTED: {
    border: 'border-red-800/60',
    bg: 'bg-red-950/30',
    badge: 'bg-red-900/60 text-red-300 border border-red-700/50',
    icon: <XCircle size={18} className="text-red-400" />,
    label: 'REJECTED',
    labelClass: 'text-red-400',
  },
  NEEDS_EVIDENCE: {
    border: 'border-amber-700/60',
    bg: 'bg-amber-950/20',
    badge: 'bg-amber-900/60 text-amber-300 border border-amber-700/50',
    icon: <AlertCircle size={18} className="text-amber-400" />,
    label: 'NEEDS EVIDENCE',
    labelClass: 'text-amber-400',
  },
  PASS: {
    border: 'border-green-700/60',
    bg: 'bg-green-950/20',
    badge: 'bg-green-900/60 text-green-300 border border-green-700/50',
    icon: <CheckCircle size={18} className="text-green-400" />,
    label: 'PASS',
    labelClass: 'text-green-400',
  },
};

function TriState({ value, label }: { value: boolean | null; label: string }) {
  if (value === true) return (
    <span className="flex items-center gap-1 text-green-400 text-xs">
      <CheckCircle size={11} /> {label}
    </span>
  );
  if (value === false) return (
    <span className="flex items-center gap-1 text-red-400 text-xs">
      <XCircle size={11} /> {label}
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-amber-400 text-xs">
      <AlertCircle size={11} /> {label}: Unknown
    </span>
  );
}

interface HotelCardProps {
  candidate: HotelCandidate;
  evaluation: EvaluationResult & { failureLabels?: string[]; unknownLabels?: string[] };
}

export function HotelCard({ candidate, evaluation }: HotelCardProps) {
  const cfg = STATUS_CONFIG[evaluation.status];

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 animate-fade-in`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {cfg.icon}
          <div>
            <h3 className="text-sm font-bold text-slate-100">{candidate.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{candidate.address}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs font-bold uppercase tracking-wide ${cfg.labelClass}`}>{cfg.label}</span>
          <ProvenanceBadge provenance={candidate.provenance} />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs text-slate-300">
        <span className={`font-bold ${candidate.nightlyPrice > 230 ? 'text-red-400' : 'text-slate-200'}`}>
          ${candidate.nightlyPrice}/night
        </span>
        <span>{candidate.roomsAvailable} rooms</span>
        {candidate.parkingCostPerNight !== null && (
          <span className="flex items-center gap-1">
            <Car size={11} className="text-slate-500" />
            {candidate.parkingCostPerNight === 0 ? 'Free parking' : `$${candidate.parkingCostPerNight}/night parking`}
          </span>
        )}
      </div>

      {/* Accessibility checks */}
      <div className="flex flex-wrap gap-3 mb-3">
        <TriState value={candidate.wheelchairAccessibleEntrance} label="Step-free entrance" />
        <TriState value={candidate.elevator} label="Elevator" />
        <TriState value={candidate.rollInShower} label="Roll-in shower" />
      </div>

      {/* Rejection reasons */}
      {evaluation.status === 'REJECTED' && evaluation.failureLabels && evaluation.failureLabels.length > 0 && (
        <div className="mt-2 p-2.5 rounded-lg bg-red-900/20 border border-red-800/40">
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Hard constraint failures</p>
          {evaluation.failureLabels.map((label) => (
            <p key={label} className="text-xs text-red-300 flex items-center gap-1.5">
              <XCircle size={10} /> {label}
            </p>
          ))}
          <p className="text-[10px] text-red-500 mt-1.5">Contacts sent: 0</p>
        </div>
      )}

      {/* Needs evidence */}
      {evaluation.status === 'NEEDS_EVIDENCE' && evaluation.unknownLabels && evaluation.unknownLabels.length > 0 && (
        <div className="mt-2 p-2.5 rounded-lg bg-amber-900/20 border border-amber-800/40">
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Blocking unknown</p>
          {evaluation.unknownLabels.map((label) => (
            <p key={label} className="text-xs text-amber-300 flex items-center gap-1.5">
              <AlertCircle size={10} /> {label}
            </p>
          ))}
        </div>
      )}

      {/* Pass */}
      {evaluation.status === 'PASS' && (
        <div className="mt-2 p-2.5 rounded-lg bg-green-900/20 border border-green-800/40">
          <p className="text-xs text-green-300 flex items-center gap-1.5">
            <CheckCircle size={11} /> All hard requirements satisfied
          </p>
        </div>
      )}
    </div>
  );
}
