import React from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { Activity, ShieldAlert, Radio, CheckCircle } from 'lucide-react';

export const EmergencyTimeline: React.FC = () => {
  const { eventLogs } = useSimulationStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'DISTRESS':
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'PACKET':
        return <Radio className="w-4 h-4 text-amber-400" />;
      case 'DISPATCH':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      default:
        return <Activity className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="hud-card p-6 flex flex-col gap-4 w-full h-full">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
        <h2 className="font-hud text-lg text-cyan-400 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          Emergency Telemetry Timeline Log
        </h2>
        <span className="font-mono-code text-xs text-slate-400">Total Log Entries: {eventLogs.length}</span>
      </div>

      {/* Timeline Stream List */}
      <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px] pr-2">
        {eventLogs.map((log) => (
          <div
            key={log.id}
            className={`p-3 rounded-lg border flex items-start gap-3 transition-all font-mono-code text-xs ${
              log.type === 'DISTRESS'
                ? 'bg-red-950/40 border-red-500/40 text-red-200'
                : log.type === 'PACKET'
                ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                : log.type === 'DISPATCH'
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                : 'bg-slate-900/60 border-slate-800 text-slate-300'
            }`}
          >
            <div className="p-1.5 rounded bg-slate-900 border border-slate-700">{getIcon(log.type)}</div>
            <div className="flex flex-col gap-0.5 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-400">{log.boatId}</span>
                <span className="text-slate-400 text-[10px]">{log.timestamp}</span>
              </div>
              <p className="leading-relaxed">{log.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
