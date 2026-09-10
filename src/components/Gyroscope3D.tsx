import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GyroscopeData } from '../types/simulation';

interface Gyroscope3DProps {
  data: GyroscopeData;
}

export const Gyroscope3D: React.FC<Gyroscope3DProps> = ({ data }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const boatMeshRef = useRef<THREE.Mesh | null>(null);
  const pitchRingRef = useRef<THREE.Mesh | null>(null);
  const yawRingRef = useRef<THREE.Mesh | null>(null);
  const gyroDataRef = useRef<GyroscopeData>(data);

  useEffect(() => {
    gyroDataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x06b6d4, 2, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Yaw Ring
    const yawRingGeo = new THREE.TorusGeometry(3.6, 0.08, 16, 64);
    const yawRingMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
    const yawRing = new THREE.Mesh(yawRingGeo, yawRingMat);
    scene.add(yawRing);
    yawRingRef.current = yawRing;

    // Pitch Ring
    const pitchRingGeo = new THREE.TorusGeometry(2.8, 0.08, 16, 64);
    const pitchRingMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
    const pitchRing = new THREE.Mesh(pitchRingGeo, pitchRingMat);
    scene.add(pitchRing);
    pitchRingRef.current = pitchRing;

    // Center Boat 3D Cube Orientation Object
    const cubeGeo = new THREE.BoxGeometry(2.4, 0.6, 3.4);
    const cubeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8 });
    const boatCube = new THREE.Mesh(cubeGeo, cubeMat);
    scene.add(boatCube);
    boatMeshRef.current = boatCube;

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const curr = gyroDataRef.current;
      if (boatMeshRef.current && pitchRingRef.current && yawRingRef.current) {
        const rollRad = (curr.roll * Math.PI) / 180;
        const pitchRad = (curr.pitch * Math.PI) / 180;
        const yawRad = (curr.yaw * Math.PI) / 180;

        boatMeshRef.current.rotation.z = -rollRad;
        boatMeshRef.current.rotation.x = pitchRad;
        boatMeshRef.current.rotation.y = yawRad;

        pitchRingRef.current.rotation.x = pitchRad;
        yawRingRef.current.rotation.y = yawRad;
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
  }, []);

  return (
    <div className="hud-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
        <h3 className="font-hud text-sm text-cyan-400 uppercase tracking-wider flex items-center gap-2 font-bold">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          GYROSCOPE & ORIENTATION
        </h3>
        <span className="font-mono-code text-xs text-slate-400 font-bold">ANGULAR VELOCITY: {data.yawRate.toFixed(1)} °/s</span>
      </div>

      {/* 3D WebGL Gimbal Horizon Canvas */}
      <div ref={mountRef} className="w-full h-44 rounded-lg bg-slate-900/60 overflow-hidden relative border border-slate-800" />

      {/* Numerical Data Tape Display */}
      <div className="grid grid-cols-3 gap-2 text-center font-mono-code text-xs">
        <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">ROLL</span>
          <span className={`text-base font-extrabold ${Math.abs(data.roll) > 30 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>
            {data.roll > 0 ? `+${data.roll.toFixed(1)}` : data.roll.toFixed(1)}°
          </span>
        </div>
        <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">PITCH</span>
          <span className={`text-base font-extrabold ${Math.abs(data.pitch) > 20 ? 'text-amber-400' : 'text-cyan-400'}`}>
            {data.pitch > 0 ? `+${data.pitch.toFixed(1)}` : data.pitch.toFixed(1)}°
          </span>
        </div>
        <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">YAW</span>
          <span className="text-base font-extrabold text-cyan-400">{data.yaw.toFixed(1)}°</span>
        </div>
      </div>
    </div>
  );
};
