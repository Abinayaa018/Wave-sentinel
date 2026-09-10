import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { mutablePhysicsState, useSimulationStore } from '../store/useSimulationStore';

interface HeroBoatSceneProps {
  onSimulateDistress?: () => void;
}

export const HeroBoatScene: React.FC<HeroBoatSceneProps> = ({ onSimulateDistress }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { currentStep, currentStepDescription, startFullEmergencySimulation, isDemoMode } = useSimulationStore();

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);
    scene.fog = new THREE.FogExp2(0x030712, 0.006);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 8, 22);
    camera.lookAt(0, 2, 0);

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xf59e0b, 1.5);
    sunLight.position.set(40, 60, -30);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const rimLight = new THREE.PointLight(0x06b6d4, 3, 50);
    rimLight.position.set(-10, 10, 10);
    scene.add(rimLight);

    // 5. Ocean Surface Plane
    const oceanGeo = new THREE.PlaneGeometry(250, 250, 48, 48);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x075985,
      roughness: 0.1,
      metalness: 0.8,
      flatShading: true,
    });
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.rotation.x = -Math.PI / 2;
    scene.add(oceanMesh);

    // Grid accent lines on ocean surface
    const gridHelper = new THREE.GridHelper(250, 30, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = 0.05;
    scene.add(gridHelper);

    // 6. High-Tech Small Fishing Boat 3D Model Construction
    const boatGroup = new THREE.Group();

    // Hull (V-shaped wooden/fiberglass hull)
    const hullShape = new THREE.Shape();
    hullShape.moveTo(0, -3.5);
    hullShape.quadraticCurveTo(1.8, -1.0, 1.6, 2.5);
    hullShape.lineTo(-1.6, 2.5);
    hullShape.quadraticCurveTo(-1.8, -1.0, 0, -3.5);

    const extrudeSettings = { depth: 1.4, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.2, bevelThickness: 0.2 };
    const hullGeo = new THREE.ExtrudeGeometry(hullShape, extrudeSettings);
    const hullMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.5 });
    const hullMesh = new THREE.Mesh(hullGeo, hullMat);
    hullMesh.rotation.x = Math.PI / 2;
    hullMesh.position.y = 0.7;
    boatGroup.add(hullMesh);

    // Deck Platform
    const deckGeo = new THREE.BoxGeometry(3.0, 0.2, 5.8);
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const deckMesh = new THREE.Mesh(deckGeo, deckMat);
    deckMesh.position.set(0, 1.3, 0);
    boatGroup.add(deckMesh);

    // Wheelhouse / Cabin
    const cabinGeo = new THREE.BoxGeometry(2.2, 1.8, 2.2);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
    cabinMesh.position.set(0, 2.3, -0.6);
    boatGroup.add(cabinMesh);

    // Cabin Windows
    const windowGeo = new THREE.BoxGeometry(2.0, 0.6, 0.1);
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, roughness: 0.1 });
    const windowMesh = new THREE.Mesh(windowGeo, windowMat);
    windowMesh.position.set(0, 2.6, 0.51);
    boatGroup.add(windowMesh);

    // Fishing Mast & Boom Rigging
    const mastGeo = new THREE.CylinderGeometry(0.08, 0.1, 4.5, 8);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
    const mastMesh = new THREE.Mesh(mastGeo, mastMat);
    mastMesh.position.set(0, 3.8, -0.8);
    boatGroup.add(mastMesh);

    // LoRa Antenna Dome (Transceiver)
    const loraDomeGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const loraDomeMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0284c7 });
    const loraDome = new THREE.Mesh(loraDomeGeo, loraDomeMat);
    loraDome.position.set(0, 6.1, -0.8);
    boatGroup.add(loraDome);

    // 7. Modeled Sailor / Fisherman Character (Standing on deck near wheelhouse)
    const sailorGroup = new THREE.Group();

    // Sailor Body / Torso (Yellow oilskin jacket)
    const torsoGeo = new THREE.CylinderGeometry(0.35, 0.3, 1.1, 8);
    const torsoMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.5 });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 2.05;
    sailorGroup.add(torso);

    // Sailor Head / Cap (Dark blue cap)
    const headGeo = new THREE.SphereGeometry(0.22, 12, 12);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.75;
    sailorGroup.add(head);

    // Cap Brim
    const capBrimGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 12);
    const capBrim = new THREE.Mesh(capBrimGeo, headMat);
    capBrim.position.set(0, 2.82, 0.1);
    sailorGroup.add(capBrim);

    sailorGroup.position.set(0.6, 0.4, 0.8); // Position sailor on deck
    boatGroup.add(sailorGroup);

    scene.add(boatGroup);

    // 8. LoRa Radio Range Rings (Visual signal indicator)
    const loraRangeGeo = new THREE.RingGeometry(8.8, 9.0, 48);
    const loraRangeMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const loraRangeCircle = new THREE.Mesh(loraRangeGeo, loraRangeMat);
    loraRangeCircle.rotation.x = Math.PI / 2;
    loraRangeCircle.position.y = 0.1;
    scene.add(loraRangeCircle);

    // 9. High-Performance 60 FPS Render Loop
    let animFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Animate ocean wave vertices
      const posAttr = oceanGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const u = posAttr.getX(i);
        const v = posAttr.getY(i);
        const waveZ = Math.sin(u * 0.08 + elapsedTime * 2.2) * 0.45 + Math.cos(v * 0.08 + elapsedTime * 1.8) * 0.45;
        posAttr.setZ(i, waveZ);
      }
      posAttr.needsUpdate = true;

      // Read target boat 'BOAT-07' telemetry directly from mutablePhysicsState
      const targetBoat = mutablePhysicsState.boats.find((b) => b.id === 'BOAT-07') || mutablePhysicsState.boats[0];

      // Convert roll, pitch, yaw from degrees to radians
      const rollRad = (targetBoat.sensors.gyro.roll * Math.PI) / 180;
      const pitchRad = (targetBoat.sensors.gyro.pitch * Math.PI) / 180;
      const yawRad = (targetBoat.sensors.gyro.yaw * Math.PI) / 180;

      // Apply ACTUAL gyroscope rotations directly to the 3D boat model
      const waveBob = Math.sin(elapsedTime * 3.5) * 0.25;
      boatGroup.position.set(0, waveBob + 0.2, 0);
      boatGroup.rotation.z = -rollRad;
      boatGroup.rotation.x = pitchRad;
      boatGroup.rotation.y = yawRad;

      // Natural subtle sailor idle movement
      sailorGroup.rotation.z = Math.sin(elapsedTime * 2.0) * 0.05;

      // Update LoRa Range Indicator color if in emergency
      if (targetBoat.isDistressed) {
        loraRangeMat.color.setHex(0xef4444);
        loraDomeMat.color.setHex(0xef4444);
        loraDomeMat.emissive.setHex(0x7f1d1d);
      } else {
        loraRangeMat.color.setHex(0x06b6d4);
        loraDomeMat.color.setHex(0x06b6d4);
        loraDomeMat.emissive.setHex(0x0284c7);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Listener
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
      cancelAnimationFrame(animFrameId);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-cyan-500/30 hud-card">
      <div ref={mountRef} className="w-full h-full" />

      {/* Hero Overlay Overlay Banner */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-2 max-w-xl">
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/80 border border-cyan-500/40 rounded-full backdrop-blur-md w-fit">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-hud text-xs text-cyan-300 uppercase tracking-widest font-bold">
            Interactive 3D WebGL Maritime Telemetry Digital Twin
          </span>
        </div>

        <h1 className="font-hud text-4xl lg:text-5xl font-extrabold text-white tracking-wide drop-shadow-md">
          MARITIME DISTRESS <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            MANAGEMENT
          </span>
        </h1>

        <p className="text-sm font-mono-code text-slate-300 leading-relaxed drop-shadow">
          Offline Intelligence & LoRa Mesh Emergency Communication for Small-Scale Fisherfolk along the Arabian Sea.
        </p>

        {/* Live Step Progression Status Display */}
        <div className="mt-2 p-3 bg-slate-950/90 border border-slate-700/80 rounded-xl backdrop-blur-md font-mono-code text-xs flex flex-col gap-1 text-slate-200">
          <span className="text-amber-400 font-bold uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            SIMULATION STEP: {currentStep}
          </span>
          <p className="text-slate-300 text-[11px] leading-snug">{currentStepDescription}</p>
        </div>
      </div>

      {/* Main Primary CTA Button: SIMULATE DISTRESS */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3">
        <button
          onClick={() => {
            if (onSimulateDistress) onSimulateDistress();
            startFullEmergencySimulation();
          }}
          className={`px-8 py-4 rounded-2xl font-hud text-lg font-extrabold uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(239,68,68,0.5)] cursor-pointer flex items-center gap-3 border ${
            isDemoMode
              ? 'bg-red-600 border-red-400 text-white animate-pulse'
              : 'bg-gradient-to-r from-red-600 via-amber-500 to-red-600 hover:scale-105 border-red-400 text-white'
          }`}
        >
          <span className="w-3.5 h-3.5 rounded-full bg-white animate-ping" />
          {isDemoMode ? 'RE-SIMULATE DISTRESS' : 'SIMULATE DISTRESS'}
        </button>
        <span className="font-mono-code text-xs text-slate-300 bg-slate-950/80 px-3 py-1 rounded-md border border-slate-800 backdrop-blur">
          Triggers physical vessel rocking ➔ sensor spikes ➔ AI classification ➔ LoRa relay ➔ SAR dispatch
        </span>
      </div>
    </div>
  );
};
