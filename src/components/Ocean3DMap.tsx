import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { mutablePhysicsState, useSimulationStore } from '../store/useSimulationStore';
import { COAST_GUARD_LAT, COAST_GUARD_LON } from '../simulation/MeshNetworkSimulator';

export const Ocean3DMap: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { setSelectedBoatId, selectedBoatId, globalMeshRangeKm } = useSimulationStore();

  const mapCoordsTo3D = (lat: number, lon: number) => {
    const originLat = 11.27;
    const originLon = 74.80;
    const scale = 400.0;
    return {
      x: (lon - originLon) * scale,
      z: -(lat - originLat) * scale,
    };
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    scene.fog = new THREE.FogExp2(0x020617, 0.008);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 50, 70);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(50, 80, 30);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 5. Ocean Surface Plane
    const oceanGeo = new THREE.PlaneGeometry(320, 320, 64, 64);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x075985,
      roughness: 0.1,
      metalness: 0.8,
      flatShading: true,
    });
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.rotation.x = -Math.PI / 2;
    scene.add(oceanMesh);

    // Grid Overlay
    const gridHelper = new THREE.GridHelper(320, 40, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = 0.1;
    scene.add(gridHelper);

    // 6. Coast Guard Base Island Platform
    const cgPos = mapCoordsTo3D(COAST_GUARD_LAT, COAST_GUARD_LON);
    const cgGroup = new THREE.Group();
    cgGroup.position.set(cgPos.x, 0, cgPos.z);

    const platformGeo = new THREE.CylinderGeometry(7, 8, 2, 16);
    const platformMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = 1;
    cgGroup.add(platform);

    const towerGeo = new THREE.CylinderGeometry(1.8, 2.8, 12, 8);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.y = 8;
    cgGroup.add(tower);

    const domeGeo = new THREE.SphereGeometry(2.2, 16, 16);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x7f1d1d });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 15;
    cgGroup.add(dome);

    scene.add(cgGroup);

    // 7. Dynamic Objects Map Pools
    const boatMeshesMap = new Map<string, THREE.Group>();
    const rangeCirclesMap = new Map<string, THREE.Mesh>();
    const linkLinesMap = new Map<string, THREE.Line>();

    const createBoatMesh = (id: string) => {
      const group = new THREE.Group();

      const hullGeo = new THREE.ConeGeometry(1.8, 5, 4);
      const hullMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });
      const hull = new THREE.Mesh(hullGeo, hullMat);
      hull.rotation.x = Math.PI / 2;
      hull.rotation.z = Math.PI / 4;
      hull.position.y = 0.5;
      group.add(hull);

      const cabinGeo = new THREE.BoxGeometry(1.6, 1.4, 2);
      const cabinMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
      const cabin = new THREE.Mesh(cabinGeo, cabinMat);
      cabin.position.set(0, 1.5, -0.3);
      group.add(cabin);

      const mastGeo = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
      const mastMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
      const mast = new THREE.Mesh(mastGeo, mastMat);
      mast.position.set(0, 3, -0.5);
      group.add(mast);

      return group;
    };

    // SAR Vessel CG-07 Model
    const cgVesselGroup = new THREE.Group();
    const cgVesselHullGeo = new THREE.BoxGeometry(2.8, 1.4, 7.5);
    const cgVesselHullMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8 });
    const cgVesselHull = new THREE.Mesh(cgVesselHullGeo, cgVesselHullMat);
    cgVesselHull.position.y = 0.7;
    cgVesselGroup.add(cgVesselHull);
    scene.add(cgVesselGroup);

    // Data Packet Particle Mesh
    const packetParticleGeo = new THREE.SphereGeometry(0.9, 16, 16);
    const packetParticleMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const packetParticle = new THREE.Mesh(packetParticleGeo, packetParticleMat);
    scene.add(packetParticle);

    // 8. High-Performance Render Loop (Reads from mutablePhysicsState at 60 FPS)
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Animate ocean surface wave displacement
      const posAttr = oceanGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const u = posAttr.getX(i);
        const v = posAttr.getY(i);
        const z = Math.sin(u * 0.1 + elapsedTime * 2) * 0.45 + Math.cos(v * 0.1 + elapsedTime * 1.5) * 0.45;
        posAttr.setZ(i, z);
      }
      posAttr.needsUpdate = true;

      // Update Boats 3D positions & direct Gyroscope rotations
      const currentBoats = mutablePhysicsState.boats;
      currentBoats.forEach((b) => {
        const pos = mapCoordsTo3D(b.sensors.gps.latitude, b.sensors.gps.longitude);
        let boatGroup = boatMeshesMap.get(b.id);

        if (!boatGroup) {
          boatGroup = createBoatMesh(b.id);
          scene.add(boatGroup);
          boatMeshesMap.set(b.id, boatGroup);

          const rangeGeo = new THREE.RingGeometry(b.meshRangeKm * 3.5 - 0.2, b.meshRangeKm * 3.5, 32);
          const rangeMat = new THREE.MeshBasicMaterial({
            color: b.isDistressed ? 0xef4444 : 0x06b6d4,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.35,
          });
          const rangeCircle = new THREE.Mesh(rangeGeo, rangeMat);
          rangeCircle.rotation.x = Math.PI / 2;
          scene.add(rangeCircle);
          rangeCirclesMap.set(b.id, rangeCircle);
        }

        const waveBob = Math.sin(elapsedTime * 3 + pos.x) * 0.3;
        boatGroup.position.set(pos.x, waveBob, pos.z);

        // Apply physical gyroscope values directly to 3D boat mesh
        const rollRad = (b.sensors.gyro.roll * Math.PI) / 180;
        const pitchRad = (b.sensors.gyro.pitch * Math.PI) / 180;
        const yawRad = (b.sensors.gyro.yaw * Math.PI) / 180;

        boatGroup.rotation.z = -rollRad;
        boatGroup.rotation.x = pitchRad;
        boatGroup.rotation.y = yawRad;

        const circle = rangeCirclesMap.get(b.id);
        if (circle) {
          circle.position.set(pos.x, 0.2, pos.z);
          (circle.material as THREE.MeshBasicMaterial).color.setHex(b.isDistressed ? 0xef4444 : 0x06b6d4);
        }
      });

      // Update Packet particle along multi-hop path
      const packet = mutablePhysicsState.activePacket;
      const route = mutablePhysicsState.activeRoute;

      if (packet && route.length >= 2) {
        packetParticle.visible = true;
        const currentHop = Math.min(route.length - 1, packet.currentHopIndex);
        const fromIdx = Math.floor(currentHop);
        const toIdx = Math.min(route.length - 1, fromIdx + 1);
        const t = currentHop - fromIdx;

        const fromId = route[fromIdx];
        const toId = route[toIdx];

        const p1 = fromId === 'CG-HQ' ? mapCoordsTo3D(COAST_GUARD_LAT, COAST_GUARD_LON) : mapCoordsTo3D(
          currentBoats.find((b) => b.id === fromId)?.sensors.gps.latitude || 11.27,
          currentBoats.find((b) => b.id === fromId)?.sensors.gps.longitude || 74.80
        );

        const p2 = toId === 'CG-HQ' ? mapCoordsTo3D(COAST_GUARD_LAT, COAST_GUARD_LON) : mapCoordsTo3D(
          currentBoats.find((b) => b.id === toId)?.sensors.gps.latitude || 11.27,
          currentBoats.find((b) => b.id === toId)?.sensors.gps.longitude || 74.80
        );

        packetParticle.position.set(
          p1.x + (p2.x - p1.x) * t,
          2.5 + Math.sin(t * Math.PI) * 2,
          p1.z + (p2.z - p1.z) * t
        );
      } else {
        packetParticle.visible = false;
      }

      // Update CG Patrol Vessel position
      const cg = mutablePhysicsState.cgDispatch;
      if (cg.status !== 'STANDBY') {
        cgVesselGroup.visible = true;
        const cgPos3D = mapCoordsTo3D(cg.currentLocation.latitude, cg.currentLocation.longitude);
        cgVesselGroup.position.set(cgPos3D.x, 0.4, cgPos3D.z);
      } else {
        cgVesselGroup.visible = false;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  const boatsList = useSimulationStore((state) => state.boats);

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden rounded-xl border border-cyan-500/20 hud-card">
      <div ref={mountRef} className="w-full h-full" />

      {/* Map HUD Overlay Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="hud-card px-4 py-2 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-hud text-xs tracking-wider text-cyan-400 uppercase font-bold">
            3D WebGL Maritime Tactical Ocean Radar (60 FPS)
          </span>
        </div>
      </div>

      {/* Fleet Node Selector Selector */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between hud-card p-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {boatsList.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBoatId(b.id)}
              className={`px-3 py-1.5 rounded-md font-mono-code text-xs transition-all flex items-center gap-2 border cursor-pointer ${
                selectedBoatId === b.id
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)] font-bold'
                  : b.isDistressed
                  ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse font-bold'
                  : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${b.isDistressed ? 'bg-red-500' : 'bg-emerald-400'}`} />
              {b.id} ({b.name})
              {b.isDistressed && <span className="text-[10px] text-red-400 font-bold">SOS</span>}
            </button>
          ))}
        </div>
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono-code text-slate-400">
          <span>Active Fleet: {boatsList.length} Nodes</span>
          <span>LoRa Range: {globalMeshRangeKm} km</span>
        </div>
      </div>
    </div>
  );
};
