import React from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { Cpu, AlertTriangle, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';

export const AIDetectionProcessPanel: React.FC = () => {
  const { boats, selectedBoatId, currentStep } = useSimulationStore();
  const boat = boats.find((b) => b.id === selectedBoatId) || boats[0];

  const detectionSteps = [
    { title: '1. Sensor Anomaly Detected', desc: 'Raw IMU telemetry stream flagged irregular dynamics', done: currentStep !== 'NORMAL' },
    { title: '2. Gyroscope Roll/Pitch Tilt', desc: `Roll: +${boat.sensors.gyro.roll}° (>30° threshold)`, done: Math.abs(boat.sensors.gyro.roll) > 15 },
    { title: '3. IMU Acceleration Spike', desc: `Total G-Force: ${boat.sensors.accel.total.toFixed(2)} g`, done: boat.sensors.accel.total > 1.2 },
    { title: '4. Motion Anomaly Detector', desc: `Intensity: ${boat.sensors.motion.intensity}% (${boat.sensors.motion.status})`, done: boat.sensors.motion.intensity > 40 },
    { title: '5. Multi-Feature AI Correlation', desc: 'Fusing 8 sensor parameters into neural distress classifier', done: boat.aiAnalysis.score > 40 },
    { title: '6. AI Risk Score Elevation', desc: `Calculated Score: ${boat.aiAnalysis.score}% (Confidence: ${boat.aiAnalysis.confidence}%)`, done: boat.aiAnalysis.score >= 70 },
    { title: '7. 🚨 Distress Confirmed', desc: 'Offline Emergency Protocol Initiated via LoRa Mesh', done: boat.isDistressed },
  ];

  return (
    <div className="hud-card p-5 flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
        <h3 className="font-hud text-sm text-cyan-400 uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          Offline AI Distress Classifier Process
        </h3>
        <span
          className={`font-mono-code text-xs px-2.5 py-1 rounded font-bold ${
            boat.isDistressed ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'
          }`}
        >
          {boat.aiAnalysis.classification}
        </span>
      </div>

      {/* Thinking Sequence List */}
      <div className="flex flex-col gap-2 font-mono-code text-xs">
        {detectionSteps.map((st, idx) => (
          <div
            key={idx}
            className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
              st.done
                ? 'bg-slate-900/90 border-cyan-500/40 text-cyan-200'
                : 'bg-slate-950/60 border-slate-800 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-3">
              {st.done ? (
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              ) : (
                <Loader2 className="w-4 h-4 text-slate-600 animate-spin shrink-0" />
              )}
              <div>
                <span className="font-bold block text-xs">{st.title}</span>
                <span className="text-[11px] text-slate-400">{st.desc}</span>
              </div>
            </div>
            {st.done && <span className="text-[10px] text-emerald-400 font-bold">VERIFIED</span>}
          </div>
        ))}
      </div>

      {/* Explainable AI Reasons */}
      <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 font-mono-code text-xs">
        <span className="text-[10px] text-slate-400 uppercase block mb-1">Explainable Diagnostics:</span>
        <ul className="space-y-1 text-slate-300">
          {boat.aiAnalysis.reasons.map((r, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <span className={boat.isDistressed ? 'text-red-400' : 'text-cyan-400'}>►</span>
              {r}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
