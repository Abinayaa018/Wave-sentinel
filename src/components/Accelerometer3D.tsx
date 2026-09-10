import React, { useEffect, useState } from 'react';
import { AccelerometerData } from '../types/simulation';

interface Accelerometer3DProps {
  data: AccelerometerData;
}

export const Accelerometer3D: React.FC<Accelerometer3DProps> = ({ data }) => {
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    setHistory((prev) => [...prev.slice(-30), data.total]);
  }, [data]);

  const points = history
    .map((val, idx) => {
      const x = (idx / 29) * 280;
      const y = 60 - Math.min(50, Math.max(0, (val - 0.5) * 20));
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="hud-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
        <h3 className="font-hud text-sm text-cyan-400 uppercase tracking-wider flex items-center gap-2 font-bold">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          ACCELEROMETER / IMU (3-AXIS)
        </h3>
        <span className="font-mono-code text-xs text-slate-400 font-bold">TOTAL: {data.total.toFixed(2)} g</span>
      </div>

      {/* 3-Axis Vector Indicators */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* X Axis */}
        <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 flex flex-col gap-1">
          <div className="flex justify-between text-xs font-mono-code">
            <span className="text-red-400 font-bold">X (LATERAL)</span>
            <span className="text-slate-200">{data.x >= 0 ? `+${data.x.toFixed(2)}` : data.x.toFixed(2)} g</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-400 transition-all duration-150"
              style={{ width: `${Math.min(100, Math.abs(data.x) * 35)}%` }}
            />
          </div>
        </div>

        {/* Y Axis */}
        <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 flex flex-col gap-1">
          <div className="flex justify-between text-xs font-mono-code">
            <span className="text-emerald-400 font-bold">Y (LONG)</span>
            <span className="text-slate-200">{data.y >= 0 ? `+${data.y.toFixed(2)}` : data.y.toFixed(2)} g</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-150"
              style={{ width: `${Math.min(100, Math.abs(data.y) * 35)}%` }}
            />
          </div>
        </div>

        {/* Z Axis */}
        <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 flex flex-col gap-1">
          <div className="flex justify-between text-xs font-mono-code">
            <span className="text-blue-400 font-bold">Z (VERT)</span>
            <span className="text-slate-200">{data.z >= 0 ? `+${data.z.toFixed(2)}` : data.z.toFixed(2)} g</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-400 transition-all duration-150"
              style={{ width: `${Math.min(100, Math.abs(data.z) * 35)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Acceleration vs Time Wave Plot */}
      <div className="bg-slate-900/90 p-3 rounded border border-slate-800 relative">
        <div className="flex justify-between items-center text-[10px] font-mono-code text-slate-400 mb-1 font-bold">
          <span>ACCELERATION WAVEFORM STREAM</span>
          <span className={data.total > 2.0 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}>
            {data.total > 2.0 ? '🚨 SEVERE IMPACT SPIKE' : 'NOMINAL DYNAMICS'}
          </span>
        </div>
        <svg className="w-full h-14 overflow-visible">
          <polyline
            fill="none"
            stroke={data.total > 2.0 ? '#ef4444' : '#06b6d4'}
            strokeWidth="2"
            points={points}
          />
        </svg>
      </div>
    </div>
  );
};
