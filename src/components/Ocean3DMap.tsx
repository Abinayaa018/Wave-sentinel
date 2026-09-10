import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '../store/useSimulationStore';
import { COAST_GUARD_LAT, COAST_GUARD_LON } from '../simulation/MeshNetworkSimulator';

export const Ocean3DMap: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const {
    boats,
    selectedBoatId,
    setSelectedBoatId,
    meshLinks,
    activeRoute,
    activePacket,
    cgDispatch,
  } = useSimulationStore();

  // Helper map lat/lon to 3D world space (Center around 11.27, 74.80)
  const mapCoordsTo3D = (lat: number, lon: number) => {
    const originLat = 11.27;
    const originLon = 74.80;
    const scale = 400.0; // 3D units per degree
    const x = (lon - originLon) * scale;
    const z = -(lat - originLat) * scale;
    return { x, z };
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Three.js Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    scene.fog = new THREE.FogExp2(0x020617, 0.008);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 45, 65);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
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

    const pointLight = new THREE.PointLight(0x06b6d4, 2, 100);
    pointLight.position.set(0, 20, 0);
    scene.add(pointLight);

    // 5. Ocean Surface Plane
    const oceanGeo = new THREE.PlaneGeometry(300, 300, 64, 64);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x075985,
      roughness: 0.1,
      metalness: 0.8,
      wireframe: false,
      flatShading: true,
    });
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.rotation.x = -Math.PI / 2;
    scene.add(oceanMesh);

    // Grid Overlay
    const gridHelper = new THREE.GridHelper(300, 40, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = 0.1;
    scene.add(gridHelper);

    // Dynamic Objects Map
    const boatMeshesMap = new Map<string, THREE.Group>();
    const rangeCirclesMap = new Map<string, THREE.Mesh>();
    const linkLinesMap = new Map<string, THREE.Line>();

    // 6. Create Coast Guard Base Station Structure
    const cgPos = mapCoordsTo3D(COAST_GUARD_LAT, COAST_GUARD_LON);
    const cgGroup = new THREE.Group();
    cgGroup.position.set(cgPos.x, 0, cgPos.z);

    // HQ Base Island Platform
    const platformGeo = new THREE.CylinderGeometry(6, 7, 2, 16);
    const platformMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5 });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = 1;
    cgGroup.add(platform);

    // HQ Tower
    const towerGeo = new THREE.CylinderGeometry(1.5, 2.5, 10, 8);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.y = 7;
    cgGroup.add(tower);

    // Radar Dome
    const domeGeo = new THREE.SphereGeometry(2, 16, 16);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x7f1d1d });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 13;
    cgGroup.add(dome);

    scene.add(cgGroup);

    // 7. Create Fishing Boat Procedural 3D Model Generator
    const createBoatModel = (name: string, isDistressed: boolean) => {
      const group = new THREE.Group();

      // Hull
      const hullGeo = new THREE.ConeGeometry(1.8, 5, 4);
      const hullMat = new THREE.MeshStandardMaterial({
        color: isDistressed ? 0xef4444 : 0x0284c7,
        roughness: 0.3,
      });
      const hull = new THREE.Mesh(hullGeo, hullMat);
      hull.rotation.x = Math.PI / 2;
      hull.rotation.z = Math.PI / 4;
      hull.position.y = 0.5;
      group.add(hull);

      // Cabin / Wheelhouse
      const cabinGeo = new THREE.BoxGeometry(1.6, 1.4, 2);
      const cabinMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
      const cabin = new THREE.Mesh(cabinGeo, cabinMat);
      cabin.position.set(0, 1.5, -0.3);
      group.add(cabin);

      // Fishing Mast
      const mastGeo = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
      const mastMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
      const mast = new THREE.Mesh(mastGeo, mastMat);
      mast.position.set(0, 3, -0.5);
      group.add(mast);

      // Distress Beacon Indicator
      if (isDistressed) {
        const beaconGeo = new THREE.SphereGeometry(0.4, 8, 8);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(0, 5.2, -0.5);
        group.add(beacon);
      }

      return group;
    };

    // 8. Create SAR Rescue Vessel CG-07 Model
    const cgVesselGroup = new THREE.Group();
    const cgVesselHullGeo = new THREE.BoxGeometry(2.5, 1.2, 7);
    const cgVesselHullMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7 });
    const cgVesselHull = new THREE.Mesh(cgVesselHullGeo, cgVesselHullMat);
    cgVesselHull.position.y = 0.6;
    cgVesselGroup.add(cgVesselHull);
    scene.add(cgVesselGroup);

    // 9. Packet Particle Mesh
    const packetParticleGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const packetParticleMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const packetParticle = new THREE.Mesh(packetParticleGeo, packetParticleMat);
    scene.add(packetParticle);

    let animationFrameId: number;
    let clock = new THREE.Clock();

    // 10. Render Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Animate ocean waves (vertex displacement)
      const posAttr = oceanGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const u = posAttr.getX(i);
        const v = posAttr.getY(i);
        const z = Math.sin(u * 0.1 + elapsedTime * 2) * 0.4 + Math.cos(v * 0.1 + elapsedTime * 1.5) * 0.4;
        posAttr.setZ(i, z);
      }
      posAttr.needsUpdate = true;

      // Update Boats
      boats.forEach((b) => {
        const pos = mapCoordsTo3D(b.sensors.gps.latitude, b.sensors.gps.longitude);
        let boatGroup = boatMeshesMap.get(b.id);

        if (!boatGroup) {
          boatGroup = createBoatModel(b.name, b.isDistressed);
          scene.add(boatGroup);
          boatMeshesMap.set(b.id, boatGroup);

          // Range circle overlay
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

        // Position boat
        const waveBob = Math.sin(elapsedTime * 3 + pos.x) * 0.3;
        boatGroup.position.set(pos.x, waveBob, pos.z);

        // REAL GYROSCOPE ROTATION APPLIED DIRECTLY TO THE 3D BOAT MESH!
        const rollRad = (b.sensors.gyro.roll * Math.PI) / 180;
        const pitchRad = (b.sensors.gyro.pitch * Math.PI) / 180;
        const yawRad = (b.sensors.gyro.yaw * Math.PI) / 180;

        boatGroup.rotation.z = -rollRad; // Roll tilts side-to-side
        boatGroup.rotation.x = pitchRad; // Pitch tilts forward-back
        boatGroup.rotation.y = yawRad; // Yaw heading

        // Update range circle
        const circle = rangeCirclesMap.get(b.id);
        if (circle) {
          circle.position.set(pos.x, 0.2, pos.z);
        }
      });

      // Update Mesh Link Lines
      meshLinks.forEach((link) => {
        const linkKey = `${link.sourceId}-${link.targetId}`;
        let line = linkLinesMap.get(linkKey);

        const n1Pos = link.sourceId === 'CG-HQ' ? mapCoordsTo3D(COAST_GUARD_LAT, COAST_GUARD_LON) : mapCoordsTo3D(
          boats.find((b) => b.id === link.sourceId)?.sensors.gps.latitude || 11.27,
          boats.find((b) => b.id === link.sourceId)?.sensors.gps.longitude || 74.80
        );

        const n2Pos = link.targetId === 'CG-HQ' ? mapCoordsTo3D(COAST_GUARD_LAT, COAST_GUARD_LON) : mapCoordsTo3D(
          boats.find((b) => b.id === link.targetId)?.sensors.gps.latitude || 11.27,
          boats.find((b) => b.id === link.targetId)?.sensors.gps.longitude || 74.80
        );

        const isRouteLink = activeRoute.length >= 2 &&
          activeRoute.some((id, idx) => (id === link.sourceId && activeRoute[idx + 1] === link.targetId) || (id === link.targetId && activeRoute[idx + 1] === link.sourceId));

        if (!line) {
          const lineGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(n1Pos.x, 1, n1Pos.z),
            new THREE.Vector3(n2Pos.x, 1, n2Pos.z),
          ]);
          const lineMat = new THREE.LineBasicMaterial({
            color: isRouteLink ? 0xf59e0b : 0x0284c7,
            linewidth: isRouteLink ? 3 : 1,
            transparent: true,
            opacity: isRouteLink ? 0.9 : 0.4,
          });
          line = new THREE.Line(lineGeo, lineMat);
          scene.add(line);
          linkLinesMap.set(linkKey, line);
        } else {
          const posAttr = line.geometry.attributes.position;
          posAttr.setXYZ(0, n1Pos.x, 1, n1Pos.z);
          posAttr.setXYZ(1, n2Pos.x, 1, n2Pos.z);
          posAttr.needsUpdate = true;
          (line.material as THREE.LineBasicMaterial).color.setHex(isRouteLink ? 0xf59e0b : 0x0284c7);
        }
      });

      // Update Packet Animation Position along calculated path
      if (activePacket && activeRoute.length >= 2) {
        packetParticle.visible = true;
        const currentHop = Math.min(activeRoute.length - 1, activePacket.currentHopIndex);
        const fromIdx = Math.floor(currentHop);
        const toIdx = Math.min(activeRoute.length - 1, fromIdx + 1);
        const t = currentHop - fromIdx;

        const fromId = activeRoute[fromIdx];
        const toId = activeRoute[toIdx];

        const p1 = fromId === 'CG-HQ' ? mapCoordsTo3D(COAST_GUARD_LAT, COAST_GUARD_LON) : mapCoordsTo3D(
          boats.find((b) => b.id === fromId)?.sensors.gps.latitude || 11.27,
          boats.find((b) => b.id === fromId)?.sensors.gps.longitude || 74.80
        );

        const p2 = toId === 'CG-HQ' ? mapCoordsTo3D(COAST_GUARD_LAT, COAST_GUARD_LON) : mapCoordsTo3D(
          boats.find((b) => b.id === toId)?.sensors.gps.latitude || 11.27,
          boats.find((b) => b.id === toId)?.sensors.gps.longitude || 74.80
        );

        packetParticle.position.set(
          p1.x + (p2.x - p1.x) * t,
          2.5 + Math.sin(t * Math.PI) * 2,
          p1.z + (p2.z - p1.z) * t
        );
      } else {
        packetParticle.visible = false;
      }

      // Update CG Patrol Vessel CG-07 Position
      if (cgDispatch.status !== 'STANDBY') {
        cgVesselGroup.visible = true;
        const cgPos3D = mapCoordsTo3D(cgDispatch.currentLocation.latitude, cgDispatch.currentLocation.longitude);
        cgVesselGroup.position.set(cgPos3D.x, 0.4, cgPos3D.z);
      } else {
        cgVesselGroup.visible = false;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
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
  }, [boats, meshLinks, activeRoute, activePacket, cgDispatch]);

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden rounded-xl border border-cyan-500/20 hud-card">
      <div ref={mountRef} className="w-full h-full" />

      {/* Map HUD Overlay Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="hud-card px-4 py-2 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-hud text-xs tracking-wider text-cyan-400 uppercase">
            3D WebGL Maritime Tactical Ocean Radar
          </span>
        </div>
      </div>

      {/* Fleet Node Selection Selector */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between hud-card p-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {boats.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBoatId(b.id)}
              className={`px-3 py-1.5 rounded-md font-mono-code text-xs transition-all flex items-center gap-2 border ${
                selectedBoatId === b.id
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : b.isDistressed
                  ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
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
          <span>Active Nodes: {boats.length}</span>
          <span>LoRa Range: {useSimulationStore.getState().globalMeshRangeKm} km</span>
        </div>
      </div>
    </div>
  );
};
