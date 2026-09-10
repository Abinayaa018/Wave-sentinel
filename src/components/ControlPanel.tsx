import React from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { Play, Pause, RefreshCw, Volume2, VolumeX, AlertTriangle, ShieldAlert, Sparkles, Zap } from 'lucide-react';
import { ScenarioId } from '../types/simulation';

export const ControlPanel: React.FC = () => {
  const {
    activeScenario,
    triggerScenario,
    globalMeshRangeKm,
    setGlobalMeshRangeKm,
    isDemoMode,
    startFullEmergencySimulation,
    stopDemoMode,
    isPaused,
    togglePause,
    isMuted,
    toggleMute,
    resetSimulation,
  } = useSimulationStore();

  const scenarios: { id: ScenarioId; label: string; desc: string }[] = [
    { id: 'NORMAL', label: '1. Normal Sailing', desc: 'Flawless ocean conditions' },
    { id: 'ROUGH_SEA', label: '2. Rough Sea Waves', desc: 'Heavy rocking (No false alarm)' },
    { id: 'MAN_OVERBOARD', label: '3. Abnormal Motion', desc: 'Stationary + Motion anomaly' },
    { id: 'CAPSIZING', label: '4. Severe Tilt', desc: '48.5° roll tilt + AI trigger' },
    { id: 'MANUAL_SOS', label: '5. Manual SOS', desc: 'Hardware SOS button press' },
    { id: 'FULL_EMERGENCY', label: '6. Full Emergency', desc: 'Multi-sensor catastrophic event' },
  ];

  return (
    <div className="hud-card p-5 flex flex-col gap-5 w-full">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
        <h3 className="font-hud text-sm text-cyan-400 uppercase tracking-wider flex items-center gap-2 font-bold">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Tactical Scenario & Simulation Controls
        </h3>

        <div className="flex items-center gap-3 font-mono-code text-xs">
          {/* Audio Mute/Unmute Toggle */}
          <button
            onClick={toggleMute}
            className="p-2 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title={isMuted ? 'Unmute Alarms' : 'Mute Alarms'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Pause / Resume */}
          <button
            onClick={togglePause}
            className="px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer font-bold"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
            {isPaused ? 'RESUME' : 'PAUSE'}
          </button>

          {/* Reset */}
          <button
            onClick={resetSimulation}
            className="px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
            RESET
          </button>
        </div>
      </div>

      {/* 1-Click Guided Demo Primary CTA */}
      <div className="hud-card-amber p-4 flex items-center justify-between">
        <div>
          <h4 className="font-hud text-sm text-amber-400 uppercase font-bold flex items-center gap-2">
            <Zap className="w-4 h-4" />
            SIMULATE EMERGENCY DISTRESS STORY
          </h4>
          <p className="text-xs font-mono-code text-slate-300">
            Executes complete end-to-end maritime emergency, mesh packet transmission, and Coast Guard SAR dispatch story.
          </p>
        </div>
        <button
          onClick={isDemoMode ? stopDemoMode : startFullEmergencySimulation}
          className={`px-6 py-3 rounded-xl font-hud text-xs font-extrabold uppercase transition-all shadow-lg cursor-pointer flex items-center gap-2 ${
            isDemoMode
              ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
              : 'bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          {isDemoMode ? 'STOP DEMO' : 'START DEMO NOW'}
        </button>
      </div>

      {/* Manual Scenario Selector Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono-code text-xs">
        {scenarios.map((sc) => (
          <button
            key={sc.id}
            onClick={() => triggerScenario(sc.id)}
            className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
              activeScenario === sc.id
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] font-bold'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="font-bold text-xs">{sc.label}</span>
            <span className="text-[10px] text-slate-500">{sc.desc}</span>
          </button>
        ))}
      </div>

      {/* LoRa Range Config Slider */}
      <div className="flex flex-col gap-2 font-mono-code text-xs">
        <div className="flex justify-between items-center text-slate-300 font-bold">
          <span>LoRa Transceiver Mesh Coverage Radius</span>
          <span className="text-cyan-400">{globalMeshRangeKm} km</span>
        </div>
        <input
          type="range"
          min="4"
          max="18"
          step="0.5"
          value={globalMeshRangeKm}
          onChange={(e) => setGlobalMeshRangeKm(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
      </div>
    </div>
  );
};
