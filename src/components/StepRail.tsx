import { Check } from 'lucide-react';
import type { DemoStep } from '@/types';

const STEPS: { id: DemoStep; label: string; subtitle: string }[] = [
  { id: 1, label: 'Workspace Ready', subtitle: 'Memory loaded' },
  { id: 2, label: 'Change Detected', subtitle: 'Cancellation event' },
  { id: 3, label: 'Candidate Screening', subtitle: 'Replacement search' },
  { id: 4, label: 'Missing Evidence', subtitle: 'One inquiry + approval' },
  { id: 5, label: 'Decision Ripple', subtitle: 'Downstream impacts' },
  { id: 6, label: 'Targeted Updates', subtitle: 'Ready to communicate' },
];

interface StepRailProps {
  currentStep: DemoStep;
  completedSteps: DemoStep[];
}

export function StepRail({ currentStep, completedSteps }: StepRailProps) {
  return (
    <nav className="flex flex-col gap-1 py-6 px-3">
      <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase px-3 mb-3">Recovery Steps</p>
      {STEPS.map((step, i) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = currentStep === step.id;
        const isPending = !isCompleted && !isCurrent;

        return (
          <div key={step.id} className="relative flex items-start gap-3 px-3 py-2.5 rounded-lg group"
            style={{ background: isCurrent ? 'rgba(20,184,166,0.08)' : 'transparent' }}>
            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div className={`absolute left-[22px] top-10 w-[2px] h-6 ${isCompleted ? 'bg-teal-600' : 'bg-slate-700'}`} />
            )}

            {/* Step indicator */}
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 transition-all
              ${isCompleted ? 'bg-teal-600 text-white' : isCurrent ? 'bg-teal-500 text-white ring-2 ring-teal-400/40' : 'bg-slate-700 text-slate-400'}`}>
              {isCompleted ? <Check size={12} strokeWidth={3} /> : step.id}
            </div>

            {/* Step text */}
            <div>
              <p className={`text-xs font-semibold leading-tight ${isCurrent ? 'text-teal-300' : isCompleted ? 'text-slate-300' : 'text-slate-500'}`}>
                {step.label}
              </p>
              <p className={`text-[10px] mt-0.5 ${isCurrent ? 'text-teal-400/70' : 'text-slate-600'}`}>
                {step.subtitle}
              </p>
            </div>

            {/* Current indicator */}
            {isCurrent && (
              <div className="ml-auto flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
