import React from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export const DemoProgressBar: React.FC = () => {
  const { isDemoMode, demoStep, demoStepName } = useSimulationStore();

  if (!isDemoMode) return null;

  const steps = [
    'Normal Sailing',
    'Rough Sea',
    'Anomaly',
    'Distress Tilt',
    'AI Confirm',
    'Mesh Relay',
    'Coast Guard',
    'Rescued',
  ];

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur border-b border-amber-500/40 p-3 px-6 flex flex-col md:flex-row items-center justify-between gap-3 font-mono-code text-xs z-50">
      <div className="flex items-center gap-2 text-amber-400 font-bold">
        <Sparkles className="w-4 h-4 animate-spin" />
        <span>DEMO MODE ACTIVE: {demoStepName}</span>
      </div>

      {/* Stepper Progress Badges */}
      <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
        {steps.map((st, idx) => {
          const isComplete = idx < demoStep;
          const isCurrent = idx === demoStep;

          return (
            <div
              key={st}
              className={`px-2.5 py-1 rounded text-[11px] flex items-center gap-1 transition-all whitespace-nowrap ${
                isCurrent
                  ? 'bg-amber-500 text-slate-950 font-bold animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                  : isComplete
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {isComplete && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              <span>{st}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
