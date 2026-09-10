import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GyroscopeData } from '../types/simulation';

interface Gyroscope3DProps {
  data: GyroscopeData;
}

export const Gyroscope3D: React.FC<Gyroscope3DProps> = ({ data }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const boatMeshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x06b6d4, 2, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Outer Gimbal Ring (Yaw)
    const yawRingGeo = new THREE.TorusGeometry(3.6, 0.08, 16, 64);
    const yawRingMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
    const yawRing = new THREE.Mesh(yawRingGeo, yawRingMat);
    scene.add(yawRing);

    // Inner Gimbal Ring (Pitch)
    const pitchRingGeo = new THREE.TorusGeometry(2.8, 0.08, 16, 64);
    const pitchRingMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
    const pitchRing = new THREE.Mesh(pitchRingGeo, pitchRingMat);
    scene.add(pitchRing);

    // Center 3D Orientation Boat Cube
    const cubeGeo = new THREE.BoxGeometry(2.2, 0.6, 3.2);
    const cubeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8 });
    const boatCube = new THREE.Mesh(cubeGeo, cubeMat);
    scene.add(boatCube);
    boatMeshRef.current = boatCube;

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (boatMeshRef.current) {
        // Convert Gyro Roll, Pitch, Yaw to Radians
        const rollRad = (data.roll * Math.PI) / 180;
        const pitchRad = (data.pitch * Math.PI) / 180;
        const yawRad = (data.yaw * Math.PI) / 180;

        boatMeshRef.current.rotation.z = -rollRad;
        boatMeshRef.current.rotation.x = pitchRad;
        boatMeshRef.current.rotation.y = yawRad;

        pitchRing.rotation.x = pitchRad;
        yawRing.rotation.y = yawRad;
      }
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [data]);

  return (
    <div className="hud-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
        <h3 className="font-hud text-sm text-cyan-400 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          3D Gyroscope & Attitude Indicator
        </h3>
        <span className="font-mono-code text-xs text-slate-400">Rate: {data.yawRate.toFixed(1)}°/s</span>
      </div>

      {/* 3D WebGL Gimbal View */}
      <div ref={mountRef} className="w-full h-44 rounded-lg bg-slate-900/60 overflow-hidden relative" />

      {/* Artificial Horizon Pitch Tape Representation */}
      <div className="grid grid-cols-3 gap-2 text-center font-mono-code text-xs">
        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px]">ROLL</span>
          <span className={`text-base font-bold ${Math.abs(data.roll) > 30 ? 'text-red-400' : 'text-cyan-400'}`}>
            {data.roll > 0 ? `+${data.roll.toFixed(1)}` : data.roll.toFixed(1)}°
          </span>
        </div>
        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px]">PITCH</span>
          <span className={`text-base font-bold ${Math.abs(data.pitch) > 20 ? 'text-amber-400' : 'text-cyan-400'}`}>
            {data.pitch > 0 ? `+${data.pitch.toFixed(1)}` : data.pitch.toFixed(1)}°
          </span>
        </div>
        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px]">YAW</span>
          <span className="text-base font-bold text-cyan-400">{data.yaw.toFixed(1)}°</span>
        </div>
      </div>
    </div>
  );
};
