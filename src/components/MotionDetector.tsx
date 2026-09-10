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
        <h3 className="font-hud text-sm text-cyan-400 uppercase tracking-wider flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isAbnormal ? 'bg-amber-400 animate-ping' : 'bg-cyan-400'}`} />
          Motion & Pattern Detector
        </h3>
        <span
          className={`font-mono-code text-xs px-2 py-0.5 rounded font-bold ${
            isAbnormal ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-400'
          }`}
        >
          {data.status}
        </span>
      </div>

      {/* Radar Pulse Sweep Display */}
      <div className="relative w-full h-32 rounded-lg bg-slate-950/80 overflow-hidden flex items-center justify-center border border-slate-800">
        <div className="absolute inset-0 radar-grid opacity-50" />
        
        {/* Pulsing Concentric Radar Rings */}
        <div
          className={`absolute rounded-full border ${
            isAbnormal ? 'border-amber-500/40 animate-ping' : 'border-cyan-500/30'
          }`}
          style={{ width: `${Math.min(100, data.intensity * 1.2)}%`, height: `${Math.min(100, data.intensity * 1.2)}%` }}
        />
        <div
          className={`absolute rounded-full border ${
            isAbnormal ? 'border-red-500/60 animate-pulse' : 'border-cyan-500/20'
          }`}
          style={{ width: `${Math.min(100, data.intensity * 0.8)}%`, height: `${Math.min(100, data.intensity * 0.8)}%` }}
        />

        {/* Center Vessel Radar Spot */}
        <div className={`w-4 h-4 rounded-full ${isAbnormal ? 'bg-amber-400 animate-bounce' : 'bg-cyan-400'}`} />
      </div>

      {/* Motion Intensity Progress Meter */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs font-mono-code">
          <span className="text-slate-400">Motion Anomaly Intensity</span>
          <span className={`font-bold ${isAbnormal ? 'text-amber-400' : 'text-cyan-400'}`}>
            {data.intensity.toFixed(0)}%
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
