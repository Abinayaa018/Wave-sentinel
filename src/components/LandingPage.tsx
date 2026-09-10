import React from 'react';
import { HeroBoatScene } from './HeroBoatScene';
import { Radio, ShieldAlert, Cpu, Compass, Navigation, ArrowRight, Zap } from 'lucide-react';

interface LandingPageProps {
  onStartSimulation: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartSimulation }) => {
  return (
    <div className="flex flex-col gap-10 w-full max-w-[1720px] mx-auto">
      {/* 3D WebGL Cinematic Hero Scene */}
      <HeroBoatScene onSimulateDistress={onStartSimulation} />

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-mono-code text-xs">
        <div className="hud-card p-5 flex flex-col gap-3">
          <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 w-fit">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="font-hud text-base font-bold text-cyan-400 uppercase">
            1. Physical Motion & Sensors
          </h3>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Real-time 3D Gyroscope attitude tracking (Roll, Pitch, Yaw), 3-Axis IMU Accelerometer vectors, and Motion Anomaly intensity monitoring.
          </p>
        </div>

        <div className="hud-card p-5 flex flex-col gap-3">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 w-fit">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="font-hud text-base font-bold text-amber-400 uppercase">
            2. Offline AI Analysis
          </h3>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Multi-feature sensor fusion classifier evaluating 8 parameters with explainable diagnostics, suppressing false wave rocking alarms.
          </p>
        </div>

        <div className="hud-card p-5 flex flex-col gap-3">
          <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/40 w-fit">
            <Radio className="w-6 h-6" />
          </div>
          <h3 className="font-hud text-base font-bold text-blue-400 uppercase">
            3. LoRa Mesh Routing
          </h3>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Dijkstra shortest path multi-hop relay between offshore fishing vessels when cellular and satellite networks are unavailable.
          </p>
        </div>

        <div className="hud-card p-5 flex flex-col gap-3">
          <div className="p-3 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 w-fit">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="font-hud text-base font-bold text-red-400 uppercase">
            4. Coast Guard SAR Dispatch
          </h3>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Shore gateway incident command receiver triggering immediate Fast Patrol Vessel CG-07 rescue dispatch with distance NM and ETA tracking.
          </p>
        </div>
      </div>
    </div>
  );
};
