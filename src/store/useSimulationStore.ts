import { create } from 'zustand';
import {
  BoatState,
  MeshLink,
  DistressPacket,
  CoastGuardDispatch,
  EmergencyEventLog,
  ScenarioId,
  PacketStatus,
  SARStatus,
} from '../types/simulation';
import { DistressDetectionEngine } from '../simulation/DistressDetectionEngine';
import { MeshNetworkSimulator, COAST_GUARD_NODE_ID, COAST_GUARD_LAT, COAST_GUARD_LON } from '../simulation/MeshNetworkSimulator';
import { CoastGuardSimulation } from '../simulation/CoastGuardSimulation';
import { soundEffects } from '../audio/SoundEffects';

export interface SimulationStore {
  // Fleet state
  boats: BoatState[];
  selectedBoatId: string;
  
  // Mesh Network state
  meshLinks: MeshLink[];
  activeRoute: string[];
  globalMeshRangeKm: number;
  
  // Packet Transmission state
  activePacket: DistressPacket | null;
  
  // Coast Guard SAR state
  cgDispatch: CoastGuardDispatch;
  
  // Timeline log
  eventLogs: EmergencyEventLog[];
  
  // Scenario & Demo
  activeScenario: ScenarioId;
  isDemoMode: boolean;
  demoStep: number; // 0 to 7
  demoStepName: string;
  
  // Controls
  isPaused: boolean;
  isMuted: boolean;

  // Actions
  setSelectedBoatId: (id: string) => void;
  setGlobalMeshRangeKm: (range: number) => void;
  triggerScenario: (scenario: ScenarioId) => void;
  toggleManualSOS: (boatId: string) => void;
  startDemoMode: () => void;
  stopDemoMode: () => void;
  togglePause: () => void;
  toggleMute: () => void;
  resetSimulation: () => void;
  dispatchCoastGuard: (targetBoatId: string) => void;
  updateSimulationTick: (deltaTimeSec: number) => void;
}

// Default 6 fishing boat fleet initial positions (offshore Malabar coast / Arabian sea coordinates)
const INITIAL_BOATS: BoatState[] = [
  {
    id: 'BOAT-01',
    name: 'MATSYA-01',
    isDistressed: false,
    meshRangeKm: 9.0,
    isOnline: true,
    sensors: {
      gyro: { roll: 2.1, pitch: 1.4, yaw: 110, yawRate: 1.2 },
      accel: { x: 0.05, y: 0.02, z: 0.98, total: 1.0 },
      motion: { status: 'NORMAL', intensity: 14 },
      gps: { latitude: 11.2680, longitude: 74.7750, speed: 7.2, heading: 110, satellites: 11, fixStatus: 'LOCKED' },
      waterLevel: 5,
      engineStatus: 'RUNNING',
      batteryLevel: 94,
      temperature: 28.5,
      sosButtonActive: false,
    },
    aiAnalysis: { score: 4, confidence: 95, classification: 'NORMAL', reasons: ['All sensors nominal'], history: [4, 4, 4] },
  },
  {
    id: 'BOAT-02',
    name: 'SAGAR-02',
    isDistressed: false,
    meshRangeKm: 9.0,
    isOnline: true,
    sensors: {
      gyro: { roll: 3.5, pitch: 2.1, yaw: 135, yawRate: 1.8 },
      accel: { x: 0.08, y: 0.04, z: 0.97, total: 1.02 },
      motion: { status: 'NORMAL', intensity: 22 },
      gps: { latitude: 11.2790, longitude: 74.7950, speed: 6.8, heading: 135, satellites: 10, fixStatus: 'LOCKED' },
      waterLevel: 8,
      engineStatus: 'RUNNING',
      batteryLevel: 89,
      temperature: 29.1,
      sosButtonActive: false,
    },
    aiAnalysis: { score: 6, confidence: 95, classification: 'NORMAL', reasons: ['All sensors nominal'], history: [5, 6, 6] },
  },
  {
    id: 'BOAT-03', // Main target boat for emergency simulation demo
    name: 'KADAL-03',
    isDistressed: false,
    meshRangeKm: 9.0,
    isOnline: true,
    sensors: {
      gyro: { roll: 4.8, pitch: 3.1, yaw: 142, yawRate: 2.4 },
      accel: { x: 0.12, y: 0.06, z: 0.96, total: 1.05 },
      motion: { status: 'NORMAL', intensity: 30 },
      gps: { latitude: 11.2940, longitude: 74.8210, speed: 7.4, heading: 142, satellites: 12, fixStatus: 'LOCKED' },
      waterLevel: 12,
      engineStatus: 'RUNNING',
      batteryLevel: 86,
      temperature: 28.8,
      sosButtonActive: false,
    },
    aiAnalysis: { score: 8, confidence: 94, classification: 'NORMAL', reasons: ['All sensors nominal'], history: [8, 8, 8] },
  },
  {
    id: 'BOAT-04',
    name: 'OCEAN-04',
    isDistressed: false,
    meshRangeKm: 9.0,
    isOnline: true,
    sensors: {
      gyro: { roll: 1.8, pitch: 1.1, yaw: 95, yawRate: 0.9 },
      accel: { x: 0.04, y: 0.02, z: 0.99, total: 0.99 },
      motion: { status: 'NORMAL', intensity: 10 },
      gps: { latitude: 11.3120, longitude: 74.8450, speed: 8.1, heading: 95, satellites: 9, fixStatus: 'LOCKED' },
      waterLevel: 4,
      engineStatus: 'RUNNING',
      batteryLevel: 91,
      temperature: 27.9,
      sosButtonActive: false,
    },
    aiAnalysis: { score: 3, confidence: 96, classification: 'NORMAL', reasons: ['All sensors nominal'], history: [3, 3, 3] },
  },
  {
    id: 'BOAT-05',
    name: 'VARUNA-05',
    isDistressed: false,
    meshRangeKm: 9.0,
    isOnline: true,
    sensors: {
      gyro: { roll: 2.9, pitch: 1.8, yaw: 160, yawRate: 1.4 },
      accel: { x: 0.06, y: 0.03, z: 0.98, total: 1.01 },
      motion: { status: 'NORMAL', intensity: 18 },
      gps: { latitude: 11.2550, longitude: 74.8100, speed: 5.9, heading: 160, satellites: 11, fixStatus: 'LOCKED' },
      waterLevel: 7,
      engineStatus: 'RUNNING',
      batteryLevel: 93,
      temperature: 28.2,
      sosButtonActive: false,
    },
    aiAnalysis: { score: 5, confidence: 95, classification: 'NORMAL', reasons: ['All sensors nominal'], history: [5, 5, 5] },
  },
  {
    id: 'BOAT-06',
    name: 'SAMUDRA-06',
    isDistressed: false,
    meshRangeKm: 9.0,
    isOnline: true,
    sensors: {
      gyro: { roll: 3.1, pitch: 2.2, yaw: 180, yawRate: 1.6 },
      accel: { x: 0.07, y: 0.04, z: 0.97, total: 1.02 },
      motion: { status: 'NORMAL', intensity: 20 },
      gps: { latitude: 11.2380, longitude: 74.8350, speed: 6.2, heading: 180, satellites: 10, fixStatus: 'LOCKED' },
      waterLevel: 6,
      engineStatus: 'RUNNING',
      batteryLevel: 88,
      temperature: 28.7,
      sosButtonActive: false,
    },
    aiAnalysis: { score: 5, confidence: 95, classification: 'NORMAL', reasons: ['All sensors nominal'], history: [5, 5, 5] },
  },
];

const cgSim = new CoastGuardSimulation();

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  boats: INITIAL_BOATS,
  selectedBoatId: 'BOAT-03',
  meshLinks: [],
  activeRoute: [],
  globalMeshRangeKm: 9.0,
  activePacket: null,
  cgDispatch: cgSim.getDispatchState(),
  eventLogs: [
    {
      id: 'log-init',
      timestamp: new Date().toLocaleTimeString(),
      boatId: 'SYSTEM',
      type: 'INFO',
      message: 'Offline Maritime LoRa Mesh Network online. 6 Fishing Nodes connected.',
    },
  ],
  activeScenario: 'NORMAL',
  isDemoMode: false,
  demoStep: 0,
  demoStepName: 'Normal Sailing',
  isPaused: false,
  isMuted: false,

  setSelectedBoatId: (id: string) => set({ selectedBoatId: id }),

  setGlobalMeshRangeKm: (range: number) => {
    set((state) => ({
      globalMeshRangeKm: range,
      boats: state.boats.map((b) => ({ ...b, meshRangeKm: range })),
    }));
  },

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

  toggleMute: () => {
    const nextMuted = !get().isMuted;
    soundEffects.setMuted(nextMuted);
    set({ isMuted: nextMuted });
  },

  toggleManualSOS: (boatId: string) => {
    set((state) => ({
      boats: state.boats.map((b) =>
        b.id === boatId
          ? {
              ...b,
              sensors: {
                ...b.sensors,
                sosButtonActive: !b.sensors.sosButtonActive,
              },
            }
          : b
      ),
    }));
  },

  triggerScenario: (scenario: ScenarioId) => {
    const state = get();
    const now = new Date().toLocaleTimeString();

    let logs = [...state.eventLogs];
    let updatedBoats = state.boats.map((b) => ({ ...b }));

    // Apply scenario changes to target boat 'BOAT-03'
    const targetIdx = updatedBoats.findIndex((b) => b.id === 'BOAT-03');
    if (targetIdx !== -1) {
      const target = updatedBoats[targetIdx];
      switch (scenario) {
        case 'NORMAL':
          target.sensors.gyro = { roll: 4.8, pitch: 3.1, yaw: 142, yawRate: 2.4 };
          target.sensors.accel = { x: 0.12, y: 0.06, z: 0.96, total: 1.05 };
          target.sensors.motion = { status: 'NORMAL', intensity: 25 };
          target.sensors.engineStatus = 'RUNNING';
          target.sensors.waterLevel = 12;
          target.sensors.sosButtonActive = false;
          target.isDistressed = false;
          logs.unshift({ id: `log-${Date.now()}`, timestamp: now, boatId: 'BOAT-03', type: 'INFO', message: 'Scenario set to NORMAL SAILING.' });
          break;

        case 'ROUGH_SEA':
          target.sensors.gyro = { roll: 22.4, pitch: 14.8, yaw: 142, yawRate: 18.5 };
          target.sensors.accel = { x: 0.85, y: 0.62, z: 0.88, total: 1.35 };
          target.sensors.motion = { status: 'NORMAL', intensity: 58 };
          logs.unshift({ id: `log-${Date.now()}`, timestamp: now, boatId: 'BOAT-03', type: 'WARNING', message: 'Rough Sea scenario triggered. Heavy wave movement.' });
          break;

        case 'MAN_OVERBOARD':
          target.sensors.gyro = { roll: 12.0, pitch: 8.0, yaw: 142, yawRate: 5.0 };
          target.sensors.accel = { x: 0.2, y: 0.1, z: 0.98, total: 1.02 };
          target.sensors.motion = { status: 'ABNORMAL', intensity: 88 };
          target.sensors.engineStatus = 'STOPPED';
          target.sensors.gps.speed = 0.2; // stationary drift
          logs.unshift({ id: `log-${Date.now()}`, timestamp: now, boatId: 'BOAT-03', type: 'ANOMALY', message: 'Person Overboard / Abnormal motion anomaly detected.' });
          break;

        case 'CAPSIZING':
          target.sensors.gyro = { roll: 48.5, pitch: 31.2, yaw: 142, yawRate: 72.0 };
          target.sensors.accel = { x: 2.8, y: 1.9, z: 0.4, total: 3.4 };
          target.sensors.motion = { status: 'ABNORMAL', intensity: 95 };
          target.sensors.engineStatus = 'STOPPED';
          target.sensors.waterLevel = 68;
          target.isDistressed = true;
          logs.unshift({ id: `log-${Date.now()}`, timestamp: now, boatId: 'BOAT-03', type: 'DISTRESS', message: 'CRITICAL CAPSIZING TILT DETECTED (48.5° Roll).' });
          soundEffects.playEmergencyAlarm();
          break;

        case 'MANUAL_SOS':
          target.sensors.sosButtonActive = true;
          target.isDistressed = true;
          logs.unshift({ id: `log-${Date.now()}`, timestamp: now, boatId: 'BOAT-03', type: 'DISTRESS', message: 'MANUAL SOS BUTTON PRESSED BY CREW.' });
          soundEffects.playEmergencyAlarm();
          break;

        case 'FULL_EMERGENCY':
          target.sensors.gyro = { roll: 54.2, pitch: 36.8, yaw: 142, yawRate: 85.0 };
          target.sensors.accel = { x: 3.2, y: 2.4, z: 0.3, total: 4.0 };
          target.sensors.motion = { status: 'ABNORMAL', intensity: 99 };
          target.sensors.engineStatus = 'FAULT';
          target.sensors.waterLevel = 82;
          target.sensors.sosButtonActive = true;
          target.isDistressed = true;
          logs.unshift({ id: `log-${Date.now()}`, timestamp: now, boatId: 'BOAT-03', type: 'DISTRESS', message: 'FULL COMBINED MARITIME EMERGENCY INITIATED.' });
          soundEffects.playEmergencyAlarm();
          break;
      }
    }

    set({
      activeScenario: scenario,
      boats: updatedBoats,
      eventLogs: logs.slice(0, 40),
    });
  },

  dispatchCoastGuard: (targetBoatId: string) => {
    const state = get();
    const boat = state.boats.find((b) => b.id === targetBoatId);
    if (!boat) return;

    cgSim.dispatchRescue(targetBoatId, boat.sensors.gps.latitude, boat.sensors.gps.longitude);

    const now = new Date().toLocaleTimeString();
    const logs = [...state.eventLogs];
    logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: now,
      boatId: 'CG-HQ',
      type: 'DISPATCH',
      message: `Coast Guard Patrol CG-07 (INS SAMUDRA) dispatched to ${targetBoatId} position (${boat.sensors.gps.latitude.toFixed(4)}°N, ${boat.sensors.gps.longitude.toFixed(4)}°E).`,
    });

    set({
      cgDispatch: cgSim.getDispatchState(),
      eventLogs: logs.slice(0, 40),
    });
  },

  resetSimulation: () => {
    cgSim.reset();
    set({
      boats: INITIAL_BOATS,
      selectedBoatId: 'BOAT-03',
      meshLinks: [],
      activeRoute: [],
      activePacket: null,
      cgDispatch: cgSim.getDispatchState(),
      activeScenario: 'NORMAL',
      isDemoMode: false,
      demoStep: 0,
      demoStepName: 'Normal Sailing',
      eventLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          boatId: 'SYSTEM',
          type: 'INFO',
          message: 'Simulation reset to default state.',
        },
      ],
    });
  },

  startDemoMode: () => {
    set({ isDemoMode: true, demoStep: 0, demoStepName: '1. Normal Sailing' });
    get().triggerScenario('NORMAL');
  },

  stopDemoMode: () => set({ isDemoMode: false }),

  /**
   * Main High-Frequency Simulation Loop Tick (e.g. 10 Hz)
   */
  updateSimulationTick: (deltaTimeSec: number) => {
    const state = get();
    if (state.isPaused) return;

    // 1. Update boat sensors with realistic controlled noise & physics drift
    const updatedBoats = state.boats.map((boat) => {
      const s = boat.sensors;
      const isTarget = boat.id === 'BOAT-03';

      // Base noise
      let rollNoise = (Math.random() - 0.5) * 0.8;
      let pitchNoise = (Math.random() - 0.5) * 0.5;

      // If in rough sea or emergency, add more dynamic oscillation
      if (isTarget && state.activeScenario === 'ROUGH_SEA') {
        rollNoise = Math.sin(Date.now() / 400) * 8.0;
        pitchNoise = Math.cos(Date.now() / 500) * 4.0;
      } else if (isTarget && (state.activeScenario === 'CAPSIZING' || state.activeScenario === 'FULL_EMERGENCY')) {
        rollNoise = Math.sin(Date.now() / 300) * 4.0;
      }

      const newRoll = Number((s.gyro.roll + rollNoise * 0.2).toFixed(1));
      const newPitch = Number((s.gyro.pitch + pitchNoise * 0.2).toFixed(1));

      // Slow GPS position drift while sailing
      let newLat = s.gps.latitude;
      let newLon = s.gps.longitude;

      if (s.engineStatus === 'RUNNING') {
        const speedMultiplier = s.gps.speed / 100000;
        const rad = (s.gps.heading * Math.PI) / 180;
        newLat += Math.cos(rad) * speedMultiplier * deltaTimeSec;
        newLon += Math.sin(rad) * speedMultiplier * deltaTimeSec;
      }

      const newSensors = {
        ...s,
        gyro: { ...s.gyro, roll: newRoll, pitch: newPitch },
        gps: { ...s.gps, latitude: Number(newLat.toFixed(6)), longitude: Number(newLon.toFixed(6)) },
      };

      // Run AI Distress Evaluation
      const aiResult = DistressDetectionEngine.evaluate(newSensors, boat.aiAnalysis.history);
      const isDistressed = aiResult.classification === 'CRITICAL_DISTRESS';

      return {
        ...boat,
        sensors: newSensors,
        aiAnalysis: aiResult,
        isDistressed,
      };
    });

    // 2. Build LoRa Mesh Links
    const links = MeshNetworkSimulator.buildMeshLinks(updatedBoats);

    // 3. Check for distressed boats and calculate multi-hop route
    let route: string[] = [];
    const distressedBoat = updatedBoats.find((b) => b.isDistressed);

    if (distressedBoat) {
      route = MeshNetworkSimulator.findShortestPath(distressedBoat.id, COAST_GUARD_NODE_ID, links, updatedBoats);
    }

    // 4. Update Packet Transmission lifecycle
    let currentPacket = state.activePacket;

    if (distressedBoat && route.length >= 2) {
      if (!currentPacket || currentPacket.sourceBoatId !== distressedBoat.id) {
        // Create new emergency distress packet
        currentPacket = {
          id: `DST-2026-${Math.floor(100 + Math.random() * 900)}`,
          sourceBoatId: distressedBoat.id,
          destNodeId: COAST_GUARD_NODE_ID,
          route,
          currentHopIndex: 0,
          ttl: 32,
          hopsCount: route.length - 1,
          latencyMs: (route.length - 1) * 450,
          packetLossPercent: 1.8,
          status: 'CREATED',
          timestamp: new Date().toLocaleTimeString(),
          distressScore: distressedBoat.aiAnalysis.score,
          gpsLocation: {
            latitude: distressedBoat.sensors.gps.latitude,
            longitude: distressedBoat.sensors.gps.longitude,
          },
        };

        const now = new Date().toLocaleTimeString();
        state.eventLogs.unshift({
          id: `log-${Date.now()}`,
          timestamp: now,
          boatId: distressedBoat.id,
          type: 'PACKET',
          message: `🚨 Emergency Distress Packet [${currentPacket.id}] generated by ${distressedBoat.name}. Multi-hop route calculated: ${route.join(' -> ')}`,
        });
      } else if (currentPacket.status === 'CREATED' || currentPacket.status === 'TRANSMITTING' || currentPacket.status === 'HOP_FORWARDING') {
        // Step hop progression over time
        const nextHopIdx = currentPacket.currentHopIndex + deltaTimeSec * 0.8; // ~1.2s per hop
        if (nextHopIdx >= route.length - 1) {
          // Packet arrived at Coast Guard HQ!
          currentPacket.currentHopIndex = route.length - 1;
          currentPacket.status = 'DELIVERED';

          const now = new Date().toLocaleTimeString();
          state.eventLogs.unshift({
            id: `log-${Date.now()}`,
            timestamp: now,
            boatId: 'CG-HQ',
            type: 'DISTRESS',
            message: `✅ Emergency Alert RECEIVED by Coast Guard HQ from ${distressedBoat.name} via ${currentPacket.hopsCount}-hop LoRa Mesh!`,
          });

          soundEffects.playCoastGuardReceived();

          // Auto dispatch rescue if in Demo mode or standby
          if (cgSim.getDispatchState().status === 'STANDBY') {
            cgSim.dispatchRescue(distressedBoat.id, distressedBoat.sensors.gps.latitude, distressedBoat.sensors.gps.longitude);
          }
        } else {
          const intHop = Math.floor(nextHopIdx);
          if (intHop !== currentPacket.currentHopIndex) {
            soundEffects.playHopForwardPing();
            const fromNode = route[currentPacket.currentHopIndex];
            const toNode = route[intHop];
            state.eventLogs.unshift({
              id: `log-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              boatId: fromNode,
              type: 'PACKET',
              message: `📡 Packet [${currentPacket.id}] forwarded from ${fromNode} to ${toNode}.`,
            });
          }
          currentPacket.currentHopIndex = nextHopIdx;
          currentPacket.status = 'HOP_FORWARDING';
        }
      }
    }

    // 5. Update Coast Guard Vessel Position
    cgSim.update(deltaTimeSec);
    const updatedCg = cgSim.getDispatchState();

    if (updatedCg.status === 'AT_SCENE' && state.cgDispatch.status !== 'AT_SCENE') {
      state.eventLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        boatId: 'CG-07',
        type: 'DISPATCH',
        message: `🚢 SAR Rescue Vessel CG-07 arrived at scene of ${distressedBoat?.name || 'target vessel'}. Rescue active.`,
      });
    }

    // 6. Handle Automated Demo Mode Stepper progression
    let demoStep = state.demoStep;
    let demoStepName = state.demoStepName;
    let isDemoMode = state.isDemoMode;

    if (isDemoMode) {
      const stepTimer = (Date.now() / 4000) % 8; // Change step every ~4 seconds
      const newStep = Math.floor(stepTimer);

      if (newStep !== demoStep) {
        demoStep = newStep;
        switch (demoStep) {
          case 0:
            demoStepName = '1. Fleet Sailing Normally';
            get().triggerScenario('NORMAL');
            break;
          case 1:
            demoStepName = '2. Rough Sea Waves & Motion';
            get().triggerScenario('ROUGH_SEA');
            break;
          case 2:
            demoStepName = '3. Person Overboard / Motion Anomaly';
            get().triggerScenario('MAN_OVERBOARD');
            break;
          case 3:
            demoStepName = '4. Severe Tilt & Capsizing';
            get().triggerScenario('CAPSIZING');
            break;
          case 4:
            demoStepName = '5. AI Distress Confirmation';
            // AI confirm
            break;
          case 5:
            demoStepName = '6. LoRa Mesh Multi-Hop Transmission';
            // Packet travel
            break;
          case 6:
            demoStepName = '7. Coast Guard Command Alert & Dispatch';
            if (distressedBoat && cgSim.getDispatchState().status === 'STANDBY') {
              cgSim.dispatchRescue(distressedBoat.id, distressedBoat.sensors.gps.latitude, distressedBoat.sensors.gps.longitude);
            }
            break;
          case 7:
            demoStepName = '8. Rescue Operation Active';
            break;
        }
      }
    }

    set({
      boats: updatedBoats,
      meshLinks: links,
      activeRoute: route,
      activePacket: currentPacket,
      cgDispatch: updatedCg,
      demoStep,
      demoStepName,
      isDemoMode,
      eventLogs: state.eventLogs.slice(0, 40),
    });
  },
}));
