import React from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { EmergencyProgressionStep } from '../types/simulation';

export const DemoProgressBar: React.FC = () => {
  const { isDemoMode, currentStep, currentStepDescription, demoProgress } = useSimulationStore();

  if (!isDemoMode) return null;

  const steps: { key: EmergencyProgressionStep; label: string }[] = [
    { key: 'NORMAL', label: '1. Normal' },
    { key: 'SHAKING', label: '2. Shaking' },
    { key: 'SENSOR_DETECTION', label: '3. Sensors' },
    { key: 'AI_THINKING', label: '4. AI Fusion' },
    { key: 'DISTRESS_CONFIRMED', label: '5. Confirmed' },
    { key: 'SEARCHING_NEARBY', label: '6. Range Search' },
    { key: 'LORA_LINK_FOUND', label: '7. Mesh Route' },
    { key: 'PACKET_RELAY', label: '8. Packet Relay' },
    { key: 'COAST_GUARD_ALERT', label: '9. CG Alert' },
    { key: 'SAR_DISPATCH', label: '10. Dispatch' },
    { key: 'RESCUE_COMPLETED', label: '11. Rescued' },
  ];

  const currentStepIdx = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur border-b border-amber-500/40 p-3 px-6 flex flex-col md:flex-row items-center justify-between gap-3 font-mono-code text-xs z-50">
      <div className="flex items-center gap-2 text-amber-400 font-bold">
        <Sparkles className="w-4 h-4 animate-spin" />
        <span>EMERGENCY STORY STEPPER ({demoProgress}%): {currentStepDescription}</span>
      </div>

      {/* Stepper Badges */}
      <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
        {steps.map((st, idx) => {
          const isComplete = idx < currentStepIdx;
          const isCurrent = idx === currentStepIdx;

          return (
            <div
              key={st.key}
              className={`px-2.5 py-1 rounded text-[11px] flex items-center gap-1 transition-all whitespace-nowrap ${
                isCurrent
                  ? 'bg-amber-500 text-slate-950 font-bold animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                  : isComplete
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {isComplete && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              <span>{st.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
