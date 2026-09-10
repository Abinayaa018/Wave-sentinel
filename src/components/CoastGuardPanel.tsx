import React from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { ShieldAlert, Navigation, Radio, CheckCircle2, Clock } from 'lucide-react';

export const CoastGuardPanel: React.FC = () => {
  const { boats, activePacket, cgDispatch, dispatchCoastGuard } = useSimulationStore();

  const distressedBoat = boats.find((b) => b.isDistressed);

  return (
    <div className="hud-card p-6 flex flex-col gap-6 w-full h-full">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/40">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-hud text-xl text-sky-400 uppercase tracking-wider">
              COAST GUARD MARITIME COMMAND CENTER (HQ)
            </h2>
            <p className="text-xs text-slate-400 font-mono-code">
              Regional Incident Monitoring // LoRa 868MHz Mesh Gateway Receiver
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-mono-code text-xs text-emerald-400 font-bold">GATEWAY ONLINE</span>
        </div>
      </div>

      {/* Emergency Alert Receiver Display */}
      {distressedBoat ? (
        <div className="hud-card-red p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-red-500/40 pb-3">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-red-500 text-white font-hud text-xs font-bold rounded animate-pulse">
                🚨 CRITICAL MARITIME DISTRESS ALERT
              </span>
              <span className="text-xs font-mono-code text-red-300">
                RECEIVED VIA OFFLINE LORA MESH
              </span>
            </div>
            <span className="font-mono-code text-xs text-red-400">
              Confidence: {distressedBoat.aiAnalysis.confidence}%
            </span>
          </div>

          {/* Distress Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono-code text-xs">
            <div className="bg-slate-900/80 p-3 rounded border border-red-900/60">
              <span className="text-slate-400 block text-[10px]">VESSEL ID</span>
              <span className="text-red-400 text-base font-bold">{distressedBoat.id} ({distressedBoat.name})</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded border border-red-900/60">
              <span className="text-slate-400 block text-[10px]">GPS LOCATION</span>
              <span className="text-cyan-400 font-bold">
                {distressedBoat.sensors.gps.latitude.toFixed(4)}°N, {distressedBoat.sensors.gps.longitude.toFixed(4)}°E
              </span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded border border-red-900/60">
              <span className="text-slate-400 block text-[10px]">DISTRESS PROBABILITY</span>
              <span className="text-red-400 text-base font-bold">{distressedBoat.aiAnalysis.score}%</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded border border-red-900/60">
              <span className="text-slate-400 block text-[10px]">ROUTING PATH</span>
              <span className="text-amber-400 font-bold">{activePacket?.route.join(' ➔ ') || 'DIRECT'}</span>
            </div>
          </div>

          {/* AI Explainable Detection Reasons */}
          <div className="bg-slate-950/80 p-3 rounded border border-red-900/40">
            <span className="text-xs font-hud text-red-400 block mb-1">DETECTION ANOMALY REASONS:</span>
            <ul className="text-xs font-mono-code text-slate-300 space-y-1">
              {distressedBoat.aiAnalysis.reasons.map((r, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="text-red-400">►</span> {r}
                </li>
              ))}
            </ul>
          </div>

          {/* Action Dispatch Button */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs font-mono-code text-slate-400">
              Recommended Protocol: Immediate SAR Vessel Dispatch
            </div>
            <button
              onClick={() => dispatchCoastGuard(distressedBoat.id)}
              disabled={cgDispatch.status !== 'STANDBY'}
              className={`px-6 py-2.5 rounded-lg font-hud text-sm font-bold uppercase transition-all flex items-center gap-2 ${
                cgDispatch.status === 'STANDBY'
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] cursor-pointer'
                  : 'bg-emerald-600 text-white cursor-default'
              }`}
            >
              <Navigation className="w-4 h-4" />
              {cgDispatch.status === 'STANDBY' ? 'DISPATCH PATROL VESSEL CG-07' : 'RESCUE UNIT DISPATCHED'}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 flex flex-col items-center gap-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 opacity-60" />
          <h3 className="font-hud text-lg text-slate-300">NO ACTIVE MARITIME DISTRESS ALERTS</h3>
          <p className="text-xs text-slate-500 font-mono-code max-w-md">
            All 6 fishing fleet vessels operating within safe operational parameters. LoRa mesh listener active.
          </p>
        </div>
      )}

      {/* Coast Guard Dispatch Tracker */}
      <div className="hud-card p-4 flex flex-col gap-3">
        <h3 className="font-hud text-sm text-sky-400 uppercase tracking-wider flex items-center gap-2">
          <Radio className="w-4 h-4" />
          Search & Rescue (SAR) Tactical Patrol Vessel Status
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono-code text-xs">
          <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
            <span className="text-slate-400 block text-[10px]">RESCUE UNIT</span>
            <span className="text-sky-400 font-bold text-sm">{cgDispatch.vesselId}</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
            <span className="text-slate-400 block text-[10px]">SAR STATUS</span>
            <span className={`font-bold text-sm ${cgDispatch.status === 'AT_SCENE' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {cgDispatch.status}
            </span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
            <span className="text-slate-400 block text-[10px]">DISTANCE TO SCENE</span>
            <span className="text-cyan-400 font-bold text-sm">{cgDispatch.distanceNM} NM</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
            <span className="text-slate-400 block text-[10px]">ESTIMATED TIME (ETA)</span>
            <span className="text-amber-400 font-bold text-sm flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {cgDispatch.etaMinutes} MIN
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
