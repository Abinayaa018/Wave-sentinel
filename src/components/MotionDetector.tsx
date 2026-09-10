import React from 'react';
import { MotionData } from '../types/simulation';

interface MotionDetectorProps {
  data: MotionData;
}

export const MotionDetector: React.FC<MotionDetectorProps> = ({ data }) => {
  const isAbnormal = data.status === 'ABNORMAL';

  return (
    <div className={`hud-card p-4 flex flex-col gap-3 ${isAbnormal ? 'hud-card-amber' : ''}`}>
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
        <h3 className="font-hud text-sm text-cyan-400 uppercase tracking-wider flex items-center gap-2 font-bold">
          <span className={`w-2 h-2 rounded-full ${isAbnormal ? 'bg-amber-400 animate-ping' : 'bg-cyan-400'}`} />
          MOTION DETECTOR
        </h3>
        <span
          className={`font-mono-code text-xs px-2.5 py-0.5 rounded font-bold uppercase ${
            isAbnormal ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'
          }`}
        >
          MOTION {data.status}
        </span>
      </div>

      {/* Pulsing Radar Display */}
      <div className="relative w-full h-28 rounded-lg bg-slate-950/80 overflow-hidden flex items-center justify-center border border-slate-800">
        <div className="absolute inset-0 radar-grid opacity-50" />

        <div
          className={`absolute rounded-full border transition-all duration-300 ${
            isAbnormal ? 'border-amber-500/50 animate-ping' : 'border-cyan-500/30'
          }`}
          style={{ width: `${Math.min(100, data.intensity * 1.1)}%`, height: `${Math.min(100, data.intensity * 1.1)}%` }}
        />

        <div
          className={`absolute rounded-full border transition-all duration-300 ${
            isAbnormal ? 'border-red-500/70 animate-pulse' : 'border-cyan-500/20'
          }`}
          style={{ width: `${Math.min(100, data.intensity * 0.7)}%`, height: `${Math.min(100, data.intensity * 0.7)}%` }}
        />

        <div className={`w-4 h-4 rounded-full ${isAbnormal ? 'bg-amber-400 animate-bounce' : 'bg-cyan-400'}`} />
      </div>

      {/* Motion Intensity Progress Bar */}
      <div className="flex flex-col gap-1 font-mono-code text-xs">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-bold">MOTION INTENSITY</span>
          <span className={`font-extrabold ${isAbnormal ? 'text-amber-400' : 'text-cyan-400'}`}>
            {data.intensity.toFixed(0)}% {data.intensity > 85 ? '(CRITICAL)' : ''}
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-300 ${
              isAbnormal ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
            }`}
            style={{ width: `${data.intensity}%` }}
          />
        </div>
      </div>
    </div>
  );
};
