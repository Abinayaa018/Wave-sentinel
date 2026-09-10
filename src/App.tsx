import React, { useEffect, useState } from 'react';
import { useSimulationStore } from './store/useSimulationStore';
import { Ocean3DMap } from './components/Ocean3DMap';
import { ControlPanel } from './components/ControlPanel';
import { Gyroscope3D } from './components/Gyroscope3D';
import { Accelerometer3D } from './components/Accelerometer3D';
import { MotionDetector } from './components/MotionDetector';
import { NetworkTopologyGraph } from './components/NetworkTopologyGraph';
import { CoastGuardPanel } from './components/CoastGuardPanel';
import { EmergencyTimeline } from './components/EmergencyTimeline';
import { DemoProgressBar } from './components/DemoProgressBar';
import {
  Anchor,
  ShieldAlert,
  Radio,
  Activity,
  Compass,
  Volume2,
  VolumeX,
  Zap,
  Navigation,
  AlertTriangle,
  Layers,
  Clock,
  Cpu,
  Wifi,
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'TACTICAL' | 'MESH' | 'COAST_GUARD' | 'TIMELINE'>('TACTICAL');
  const [currentTime, setCurrentTime] = useState<string>('');

  const {
    boats,
    selectedBoatId,
    setSelectedBoatId,
    updateSimulationTick,
    isPaused,
    isMuted,
    toggleMute,
    toggleManualSOS,
    activePacket,
    cgDispatch,
  } = useSimulationStore();

  // High-frequency simulation loop (~10 Hz tick rate)
  useEffect(() => {
    let lastTime = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;
      updateSimulationTick(deltaSec);
    }, 100);

    return () => clearInterval(timer);
  }, [updateSimulationTick]);

  // Real-time HUD Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const selectedBoat = boats.find((b) => b.id === selectedBoatId) || boats[0];
  const distressedBoat = boats.find((b) => b.isDistressed);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* 1-Click Guided Demo Mode Banner */}
      <DemoProgressBar />

      {/* Main Tactical Top Navigation Bar */}
      <header className="bg-slate-900/90 border-b border-cyan-500/30 px-6 py-3 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md sticky top-0 z-40">
        {/* Brand & Project Identity */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-cyan-300">
            <Anchor className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-hud text-xl font-bold tracking-wider text-cyan-400">
                WAVE-SENTINEL
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                Offline AI Digital Twin
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono-code">
              LoRa Mesh Emergency Communication & Explainable AI Distress Protocol for Fisherfolk
            </p>
          </div>
        </div>

        {/* Tactical Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 font-hud text-xs">
          <button
            onClick={() => setActiveTab('TACTICAL')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'TACTICAL'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            3D OCEAN RADAR & TELEMETRY
          </button>
          <button
            onClick={() => setActiveTab('MESH')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'MESH'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Radio className="w-4 h-4" />
            LORA MESH TOPOLOGY
            {activePacket && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
          </button>
          <button
            onClick={() => setActiveTab('COAST_GUARD')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'COAST_GUARD'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            COAST GUARD HQ COMMAND
            {distressedBoat && <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-bounce" />}
          </button>
          <button
            onClick={() => setActiveTab('TIMELINE')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'TIMELINE'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            TELEMETRY TIMELINE LOG
          </button>
        </div>

        {/* Global Controls & Status */}
        <div className="flex items-center gap-4 font-mono-code text-xs">
          {/* Live UTC/Local Maritime Clock */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-cyan-300">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>{currentTime || '10:47:33'}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleMute}
            className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 transition-all cursor-pointer"
            title={isMuted ? 'Unmute Audio Alarms' : 'Mute Audio Alarms'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Primary Workspace View Switcher */}
      <main className="flex-1 p-6 flex flex-col gap-6 max-w-[1920px] w-full mx-auto">
        {/* Banner Alert for Active Critical Emergency */}
        {distressedBoat && (
          <div className="hud-card-red p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-600 text-white rounded-xl beacon-red">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-hud text-base font-bold text-red-400 uppercase tracking-wider">
                  CRITICAL DISTRESS ALERT DETECTED ON VESSEL {distressedBoat.id} ({distressedBoat.name})
                </h3>
                <p className="text-xs font-mono-code text-red-200">
                  AI Distress Score: {distressedBoat.aiAnalysis.score}% | Lat: {distressedBoat.sensors.gps.latitude}°N, Lon: {distressedBoat.sensors.gps.longitude}°E | Route: {activePacket?.route.join(' ➔ ') || 'Calculating LoRa path...'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('COAST_GUARD')}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-hud text-xs font-bold uppercase rounded-lg shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              VIEW COAST GUARD SAR DISPATCH
            </button>
          </div>
        )}

        {/* TAB 1: TACTICAL 3D OCEAN RADAR & SENSOR HUD */}
        {activeTab === 'TACTICAL' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
            {/* Left 7 Columns: 3D Ocean Radar & Scenario Controller */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* 3D WebGL Ocean Radar Canvas */}
              <div className="h-[520px] w-full">
                <Ocean3DMap />
              </div>

              {/* Scenario Controller */}
              <ControlPanel />
            </div>

            {/* Right 5 Columns: Selected Boat Real-Time Sensor Telemetry */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              {/* Selected Boat Status & Manual SOS Trigger Card */}
              <div className="hud-card p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedBoat.isDistressed ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                      <Navigation className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-hud text-lg text-cyan-400 uppercase tracking-wider">
                        NODE: {selectedBoat.id} ({selectedBoat.name})
                      </h3>
                      <p className="text-xs text-slate-400 font-mono-code">
                        GPS Fix: {selectedBoat.sensors.gps.latitude.toFixed(4)}°N, {selectedBoat.sensors.gps.longitude.toFixed(4)}°E | Speed: {selectedBoat.sensors.gps.speed} kn
                      </p>
                    </div>
                  </div>

                  {/* Manual Physical SOS Hardware Button Simulation */}
                  <button
                    onClick={() => toggleManualSOS(selectedBoat.id)}
                    className={`px-4 py-2 rounded-lg font-hud text-xs font-bold uppercase transition-all flex items-center gap-2 cursor-pointer ${
                      selectedBoat.sensors.sosButtonActive
                        ? 'bg-red-600 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.6)]'
                        : 'bg-slate-900 border border-red-500/40 text-red-400 hover:bg-red-950/40'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    {selectedBoat.sensors.sosButtonActive ? 'SOS ACTIVE' : 'PRESS HARDWARE SOS'}
                  </button>
                </div>

                {/* AI Explainable Distress Risk Gauge */}
                <div className={`p-4 rounded-xl border flex flex-col gap-3 font-mono-code text-xs ${
                  selectedBoat.aiAnalysis.score >= 70
                    ? 'bg-red-950/40 border-red-500/50 text-red-200'
                    : selectedBoat.aiAnalysis.score >= 45
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="font-hud text-xs font-bold uppercase flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      AI Distress Classifier Score
                    </span>
                    <span className="text-sm font-bold">
                      {selectedBoat.aiAnalysis.score}% ({selectedBoat.aiAnalysis.classification})
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        selectedBoat.aiAnalysis.score >= 70
                          ? 'bg-gradient-to-r from-amber-500 to-red-500'
                          : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                      }`}
                      style={{ width: `${selectedBoat.aiAnalysis.score}%` }}
                    />
                  </div>

                  {/* Explainable AI Reasons List */}
                  <div className="mt-1">
                    <span className="text-[10px] text-slate-400 uppercase block mb-1">Explainable Diagnostics:</span>
                    <ul className="space-y-1 text-[11px]">
                      {selectedBoat.aiAnalysis.reasons.map((r, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className={selectedBoat.isDistressed ? 'text-red-400' : 'text-cyan-400'}>►</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 3D attitude indicator (Gyroscope) */}
                <Gyroscope3D data={selectedBoat.sensors.gyro} />

                {/* 3D G-Force accelerometer graph */}
                <Accelerometer3D data={selectedBoat.sensors.accel} />

                {/* Motion Anomaly Detector */}
                <MotionDetector data={selectedBoat.sensors.motion} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LORA MESH TOPOLOGY GRAPH */}
        {activeTab === 'MESH' && (
          <div className="flex flex-col gap-6 flex-1">
            <div className="h-[600px] w-full">
              <NetworkTopologyGraph />
            </div>
          </div>
        )}

        {/* TAB 3: COAST GUARD HQ COMMAND CENTER */}
        {activeTab === 'COAST_GUARD' && (
          <div className="flex flex-col gap-6 flex-1">
            <CoastGuardPanel />
          </div>
        )}

        {/* TAB 4: TELEMETRY TIMELINE LOG */}
        {activeTab === 'TIMELINE' && (
          <div className="flex flex-col gap-6 flex-1">
            <EmergencyTimeline />
          </div>
        )}
      </main>

      {/* Bottom Global Status Bar */}
      <footer className="bg-slate-900/90 border-t border-slate-800 px-6 py-2 flex flex-wrap items-center justify-between text-xs font-mono-code text-slate-400 gap-4">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            LoRa 868MHz Gateway: ACTIVE
          </span>
          <span className="flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            Mesh Nodes: {boats.length} Fleet Boats + 1 Coast Guard HQ
          </span>
        </div>
        <div className="flex items-center gap-6">
          <span>AI Engine: Offline Sensor Fusion (98.4% Confidence)</span>
          <span className="text-cyan-400">SAR Vessel CG-07 Status: {cgDispatch.status}</span>
        </div>
      </footer>
    </div>
  );
};
