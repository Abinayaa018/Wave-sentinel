import React, { useEffect, useState } from 'react';
import { useSimulationStore } from './store/useSimulationStore';
import { LandingPage } from './components/LandingPage';
import { Ocean3DMap } from './components/Ocean3DMap';
import { ControlPanel } from './components/ControlPanel';
import { Gyroscope3D } from './components/Gyroscope3D';
import { Accelerometer3D } from './components/Accelerometer3D';
import { MotionDetector } from './components/MotionDetector';
import { AIDetectionProcessPanel } from './components/AIDetectionProcessPanel';
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
  Clock,
  Cpu,
  Wifi,
  Home,
  Ship,
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeNav, setActiveNav] = useState<'HOME' | 'LIVE_SIMULATION' | 'BOAT_TELEMETRY' | 'LORA_MESH' | 'COAST_GUARD' | 'TIMELINE'>('HOME');
  const [currentTime, setCurrentTime] = useState<string>('');

  const {
    boats,
    selectedBoatId,
    updateSimulationTick,
    isMuted,
    toggleMute,
    toggleManualSOS,
    activePacket,
    cgDispatch,
    startFullEmergencySimulation,
    isDemoMode,
  } = useSimulationStore();

  // Central simulation tick interval (10 Hz for logic, while WebGL renders at 60 FPS)
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

  // Real-time Clock
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
  const distressedBoat = boats.find((b) => b.isDistressed || b.id === 'BOAT-07');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden">
      {/* Automated Stepper Demo Banner */}
      <DemoProgressBar />

      {/* Primary Lightweight Top Navigation Bar */}
      <header className="bg-slate-900/90 border-b border-cyan-500/30 px-6 py-3 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md sticky top-0 z-40">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-cyan-300">
            <Anchor className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-hud text-xl font-extrabold tracking-wider text-cyan-400">
                WAVE-SENTINEL
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                Offline AI Digital Twin
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono-code">
              Offline Intelligence & LoRa Mesh Emergency Communication for Small-Scale Fisherfolk
            </p>
          </div>
        </div>

        {/* Lightweight Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 font-hud text-xs">
          <button
            onClick={() => setActiveNav('HOME')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer font-bold ${
              activeNav === 'HOME'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Home className="w-4 h-4" />
            HOME
          </button>

          <button
            onClick={() => setActiveNav('LIVE_SIMULATION')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer font-bold ${
              activeNav === 'LIVE_SIMULATION'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            LIVE SIMULATION
            {isDemoMode && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
          </button>

          <button
            onClick={() => setActiveNav('BOAT_TELEMETRY')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer font-bold ${
              activeNav === 'BOAT_TELEMETRY'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Ship className="w-4 h-4" />
            BOAT TELEMETRY
          </button>

          <button
            onClick={() => setActiveNav('LORA_MESH')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer font-bold ${
              activeNav === 'LORA_MESH'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Radio className="w-4 h-4" />
            LORA MESH NETWORK
            {activePacket && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
          </button>

          <button
            onClick={() => setActiveNav('COAST_GUARD')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer font-bold ${
              activeNav === 'COAST_GUARD'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            COAST GUARD HQ
            {distressedBoat?.isDistressed && <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-bounce" />}
          </button>

          <button
            onClick={() => setActiveNav('TIMELINE')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer font-bold ${
              activeNav === 'TIMELINE'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            INCIDENT HISTORY
          </button>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4 font-mono-code text-xs">
          <div className="hidden lg:flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-cyan-300 font-bold">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>{currentTime || '11:04:17'}</span>
          </div>

          <button
            onClick={toggleMute}
            className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 transition-all cursor-pointer"
            title={isMuted ? 'Unmute Audio Alarms' : 'Mute Audio Alarms'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Main Workspace Views */}
      <main className="flex-1 p-6 flex flex-col gap-6 max-w-[1920px] w-full mx-auto">
        {/* Banner Alert when Distress is Confirmed */}
        {distressedBoat?.isDistressed && (
          <div className="hud-card-red p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-600 text-white rounded-xl beacon-red">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-hud text-base font-bold text-red-400 uppercase tracking-wider">
                  CRITICAL MARITIME DISTRESS DETECTED ON VESSEL {distressedBoat.id} ({distressedBoat.name})
                </h3>
                <p className="text-xs font-mono-code text-red-200">
                  Roll: +{distressedBoat.sensors.gyro.roll}° | AI Score: {distressedBoat.aiAnalysis.score}% | Lat: {distressedBoat.sensors.gps.latitude.toFixed(4)}°N, Lon: {distressedBoat.sensors.gps.longitude.toFixed(4)}°E | Route: {activePacket?.route.join(' ➔ ') || 'BOAT-07 ➔ BOAT-05 ➔ BOAT-02 ➔ BOAT-01 ➔ CG'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveNav('COAST_GUARD')}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-hud text-xs font-extrabold uppercase rounded-lg shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              VIEW COAST GUARD SAR DISPATCH
            </button>
          </div>
        )}

        {/* 1. HOME LANDING PAGE */}
        {activeNav === 'HOME' && (
          <LandingPage
            onStartSimulation={() => {
              startFullEmergencySimulation();
              setActiveNav('LIVE_SIMULATION');
            }}
          />
        )}

        {/* 2. LIVE SIMULATION MARITIME COMMAND CENTER */}
        {activeNav === 'LIVE_SIMULATION' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
            {/* Left 7 Columns: 3D Ocean Tactical Radar & Scenario Controls */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="h-[520px] w-full">
                <Ocean3DMap />
              </div>
              <ControlPanel />
            </div>

            {/* Right 5 Columns: Selected Vessel Real-Time Telemetry & AI Process */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              {/* Vessel Selector & Hardware SOS Trigger */}
              <div className="hud-card p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedBoat.isDistressed ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                      <Navigation className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-hud text-lg text-cyan-400 uppercase tracking-wider font-bold">
                        NODE: {selectedBoat.id} ({selectedBoat.name})
                      </h3>
                      <p className="text-xs text-slate-400 font-mono-code">
                        GPS: {selectedBoat.sensors.gps.latitude.toFixed(4)}°N, {selectedBoat.sensors.gps.longitude.toFixed(4)}°E | Speed: {selectedBoat.sensors.gps.speed} kn
                      </p>
                    </div>
                  </div>

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

                <AIDetectionProcessPanel />
                <Gyroscope3D data={selectedBoat.sensors.gyro} />
                <Accelerometer3D data={selectedBoat.sensors.accel} />
                <MotionDetector data={selectedBoat.sensors.motion} />
              </div>
            </div>
          </div>
        )}

        {/* 3. BOAT TELEMETRY VIEW */}
        {activeNav === 'BOAT_TELEMETRY' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
            <Gyroscope3D data={selectedBoat.sensors.gyro} />
            <Accelerometer3D data={selectedBoat.sensors.accel} />
            <MotionDetector data={selectedBoat.sensors.motion} />
            <AIDetectionProcessPanel />
          </div>
        )}

        {/* 4. LORA MESH TOPOLOGY */}
        {activeNav === 'LORA_MESH' && (
          <div className="flex flex-col gap-6 flex-1">
            <div className="h-[600px] w-full">
              <NetworkTopologyGraph />
            </div>
          </div>
        )}

        {/* 5. COAST GUARD HQ COMMAND */}
        {activeNav === 'COAST_GUARD' && (
          <div className="flex flex-col gap-6 flex-1">
            <CoastGuardPanel />
          </div>
        )}

        {/* 6. INCIDENT HISTORY TIMELINE */}
        {activeNav === 'TIMELINE' && (
          <div className="flex flex-col gap-6 flex-1">
            <EmergencyTimeline />
          </div>
        )}
      </main>

      {/* Global Bottom Footer Bar */}
      <footer className="bg-slate-900/90 border-t border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between text-xs font-mono-code text-slate-400 gap-4">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            LoRa 868MHz Gateway: ACTIVE
          </span>
          <span className="flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            Mesh Fleet: {boats.length} Nodes + 1 Coast Guard HQ
          </span>
        </div>
        <div className="flex items-center gap-6">
          <span>AI Engine: Offline Sensor Fusion (98% Confidence)</span>
          <span className="text-cyan-400 font-bold">SAR Vessel CG-07 Status: {cgDispatch.status}</span>
        </div>
      </footer>
    </div>
  );
};
