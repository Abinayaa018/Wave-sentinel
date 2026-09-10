import React from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { ShieldAlert, Navigation, Radio, CheckCircle2, Clock, AlertTriangle, Ship } from 'lucide-react';

export const CoastGuardPanel: React.FC = () => {
  const { boats, activePacket, cgDispatch, dispatchCoastGuard, currentStep } = useSimulationStore();

  const distressedBoat = boats.find((b) => b.isDistressed || b.id === 'BOAT-07');
  const isEmergencyActive = currentStep !== 'NORMAL';

  return (
    <div className="hud-card p-6 flex flex-col gap-6 w-full h-full">
      {/* Coast Guard Command Header */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-[0_0_15px_rgba(2,132,199,0.3)]">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-hud text-xl text-sky-400 font-bold uppercase tracking-wider">
              INDIAN COAST GUARD MARITIME COMMAND CENTER (HQ)
            </h2>
            <p className="text-xs text-slate-400 font-mono-code">
              Offline LoRa 868MHz Shore Gateway Receiver // Malabar Coast Station
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-mono-code text-xs text-emerald-400 font-bold">SHORE GATEWAY ONLINE</span>
        </div>
      </div>

      {/* Emergency Alert Receiver Display */}
      {isEmergencyActive && distressedBoat ? (
        <div className="hud-card-red p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-red-500/40 pb-3">
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 bg-red-600 text-white font-hud text-xs font-extrabold rounded-md animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]">
                🚨 CRITICAL EMERGENCY DISTRESS ALERT
              </span>
              <span className="text-xs font-mono-code text-red-300 font-bold">
                RECEIVED VIA OFFLINE LORA MESH
              </span>
            </div>
            <span className="font-mono-code text-xs text-red-400 font-bold">
              AI CONFIDENCE: 98%
            </span>
          </div>

          {/* Distress Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono-code text-xs">
            <div className="bg-slate-900/90 p-3.5 rounded-lg border border-red-900/60">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">DISTRESSED VESSEL</span>
              <span className="text-red-400 text-base font-extrabold">{distressedBoat.id} ({distressedBoat.name})</span>
            </div>
            <div className="bg-slate-900/90 p-3.5 rounded-lg border border-red-900/60">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">GPS LOCATION</span>
              <span className="text-cyan-400 text-sm font-extrabold">
                {distressedBoat.sensors.gps.latitude.toFixed(4)}°N, {distressedBoat.sensors.gps.longitude.toFixed(4)}°E
              </span>
            </div>
            <div className="bg-slate-900/90 p-3.5 rounded-lg border border-red-900/60">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">DISTRESS PROBABILITY</span>
              <span className="text-red-400 text-base font-extrabold">{distressedBoat.aiAnalysis.score}% (CRITICAL)</span>
            </div>
            <div className="bg-slate-900/90 p-3.5 rounded-lg border border-red-900/60">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">LORA MESH ROUTE</span>
              <span className="text-amber-400 text-xs font-extrabold">{activePacket?.route.join(' ➔ ') || 'BOAT-07 ➔ BOAT-05 ➔ BOAT-02 ➔ BOAT-01 ➔ CG'}</span>
            </div>
          </div>

          {/* Explainable Diagnostics */}
          <div className="bg-slate-950/90 p-3.5 rounded-lg border border-red-900/50 font-mono-code text-xs">
            <span className="text-xs font-hud text-red-400 font-bold block mb-1.5">CORRELATED DIAGNOSTIC REASONS:</span>
            <ul className="space-y-1 text-slate-200">
              {distressedBoat.aiAnalysis.reasons.map((r, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="text-red-400">►</span> {r}
                </li>
              ))}
            </ul>
          </div>

          {/* Rescue Action Dispatch Control */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-red-900/40">
            <div className="text-xs font-mono-code text-slate-300">
              <strong>COMMAND PROTOCOL:</strong> ALERT VERIFIED ➔ IMMEDIATE SAR RESCUE VESSEL DISPATCH
            </div>
            <button
              onClick={() => dispatchCoastGuard(distressedBoat.id)}
              disabled={cgDispatch.status !== 'STANDBY'}
              className={`px-6 py-3 rounded-xl font-hud text-xs font-extrabold uppercase transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                cgDispatch.status === 'STANDBY'
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                  : 'bg-emerald-600 text-white cursor-default'
              }`}
            >
              <Navigation className="w-4 h-4" />
              {cgDispatch.status === 'STANDBY' ? 'DISPATCH PATROL VESSEL CG-07 NOW' : 'RESCUE PATROL DISPATCHED'}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-10 text-center bg-slate-900/40 rounded-xl border border-slate-800 flex flex-col items-center gap-3">
          <CheckCircle2 className="w-14 h-14 text-emerald-400 opacity-70" />
          <h3 className="font-hud text-lg text-slate-300 font-bold">ALL MARITIME SECTORS NOMINAL</h3>
          <p className="text-xs text-slate-400 font-mono-code max-w-md">
            Coast Guard Shore Gateway receiving normal heartbeats from 6 fishing fleet nodes. LoRa Mesh active.
          </p>
        </div>
      )}

      {/* Coast Guard Patrol Vessel Live Dispatch Status Tracker */}
      <div className="hud-card p-5 flex flex-col gap-4">
        <h3 className="font-hud text-sm text-sky-400 uppercase tracking-wider flex items-center gap-2 font-bold">
          <Ship className="w-5 h-5 text-sky-400" />
          Search & Rescue (SAR) Patrol Vessel Real-Time Tactical Status
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono-code text-xs">
          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">PATROL VESSEL</span>
            <span className="text-sky-400 font-bold text-sm">{cgDispatch.vesselId}</span>
          </div>
          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">CURRENT STATUS</span>
            <span className={`font-bold text-sm ${cgDispatch.status === 'AT_SCENE' ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`}>
              {cgDispatch.status}
            </span>
          </div>
          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">DISTANCE TO TARGET</span>
            <span className="text-cyan-400 font-bold text-sm">{cgDispatch.distanceNM} NM</span>
          </div>
          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">ESTIMATED TIME (ETA)</span>
            <span className="text-amber-400 font-bold text-sm flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {cgDispatch.etaMinutes} MIN
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
