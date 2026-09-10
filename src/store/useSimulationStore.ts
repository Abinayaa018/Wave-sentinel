import { create } from 'zustand';
import {
  BoatState,
  MeshLink,
  DistressPacket,
  CoastGuardDispatch,
  EmergencyEventLog,
  ScenarioId,
  EmergencyProgressionStep,
} from '../types/simulation';
import { DistressDetectionEngine } from '../simulation/DistressDetectionEngine';
import { MeshNetworkSimulator, COAST_GUARD_NODE_ID } from '../simulation/MeshNetworkSimulator';
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

  // Scenario & Workflow Progression
  currentStep: EmergencyProgressionStep;
  currentStepDescription: string;
  activeScenario: ScenarioId;
  isDemoMode: boolean;
  demoProgress: number; // 0 to 100%

  // Controls
  isPaused: boolean;
  isMuted: boolean;

  // Actions
  setSelectedBoatId: (id: string) => void;
  setGlobalMeshRangeKm: (range: number) => void;
  triggerScenario: (scenario: ScenarioId) => void;
  startFullEmergencySimulation: () => void;
  toggleManualSOS: (boatId: string) => void;
  stopDemoMode: () => void;
  togglePause: () => void;
  toggleMute: () => void;
  resetSimulation: () => void;
  dispatchCoastGuard: (targetBoatId: string) => void;
  updateSimulationTick: (deltaTimeSec: number) => void;
}

// Initial fleet of 6 fishing boats off the Malabar coast
const INITIAL_BOATS: BoatState[] = [
  {
    id: 'BOAT-07', // Primary Distressed Boat
    name: 'KADAL-07',
    isDistressed: false,
    meshRangeKm: 9.0,
    isOnline: true,
    sensors: {
      gyro: { roll: 2.4, pitch: 1.2, yaw: 135, yawRate: 1.1 },
      accel: { x: 0.05, y: 0.03, z: 0.98, total: 1.0 },
      motion: { status: 'NORMAL', intensity: 12 },
      gps: { latitude: 11.2940, longitude: 74.8350, speed: 7.4, heading: 135, satellites: 12, fixStatus: 'LOCKED' },
      waterLevel: 8,
      engineStatus: 'RUNNING',
      batteryLevel: 92,
      temperature: 28.4,
      sosButtonActive: false,
    },
    aiAnalysis: { score: 5, confidence: 95, classification: 'NORMAL', reasons: ['All sensors nominal'], history: [5, 5, 5] },
  },
  {
    id: 'BOAT-05',
    name: 'SAMUDRA-05',
    isDistressed: false,
    meshRangeKm: 9.0,
    isOnline: true,
    sensors: {
      gyro: { roll: 1.8, pitch: 1.0, yaw: 140, yawRate: 0.9 },
      accel: { x: 0.04, y: 0.02, z: 0.99, total: 0.99 },
      motion: { status: 'NORMAL', intensity: 15 },
      gps: { latitude: 11.2820, longitude: 74.8150, speed: 6.8, heading: 140, satellites: 11, fixStatus: 'LOCKED' },
      waterLevel: 6,
      engineStatus: 'RUNNING',
      batteryLevel: 90,
      temperature: 28.1,
      sosButtonActive: false,
    },
    aiAnalysis: { score: 4, confidence: 96, classification: 'NORMAL', reasons: ['All sensors nominal'], history: [4, 4, 4] },
  },
  {
    id: 'BOAT-02',
    name: 'SAGAR-02',
    isDistressed: false,
    meshRangeKm: 9.0,
    isOnline: true,
    sensors: {
      gyro: { roll: 3.1, pitch: 2.0, yaw: 125, yawRate: 1.4 },
      accel: { x: 0.06, y: 0.04, z: 0.97, total: 1.01 },
      motion: { status: 'NORMAL', intensity: 18 },
      gps: { latitude: 11.2710, longitude: 74.7950, speed: 7.0, heading: 125, satellites: 10, fixStatus: 'LOCKED' },
      waterLevel: 7,
      engineStatus: 'RUNNING',
      batteryLevel: 88,
      temperature: 28.7,
      sosButtonActive: false,
    },
    aiAnalysis: { score: 6, confidence: 95, classification: 'NORMAL', reasons: ['All sensors nominal'], history: [6, 6, 6] },
  },
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
      gps: { latitude: 11.2610, longitude: 74.7750, speed: 7.2, heading: 110, satellites: 11, fixStatus: 'LOCKED' },
      waterLevel: 5,
      engineStatus: 'RUNNING',
      batteryLevel: 94,
      temperature: 28.5,
      sosButtonActive: false,
    },
    aiAnalysis: { score: 4, confidence: 95, classification: 'NORMAL', reasons: ['All sensors nominal'], history: [4, 4, 4] },
  },
  {
    id: 'BOAT-03',
    name: 'VARUNA-03',
    isDistressed: false,
    meshRangeKm: 9.0,
    isOnline: true,
    sensors: {
      gyro: { roll: 2.9, pitch: 1.8, yaw: 160, yawRate: 1.4 },
      accel: { x: 0.06, y: 0.03, z: 0.98, total: 1.01 },
      motion: { status: 'NORMAL', intensity: 18 },
      gps: { latitude: 11.3120, longitude: 74.8450, speed: 8.1, heading: 160, satellites: 9, fixStatus: 'LOCKED' },
      waterLevel: 7,
      engineStatus: 'RUNNING',
      batteryLevel: 93,
      temperature: 28.2,
      sosButtonActive: false,
    },
    aiAnalysis: { score: 5, confidence: 95, classification: 'NORMAL', reasons: ['All sensors nominal'], history: [5, 5, 5] },
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
      gps: { latitude: 11.2380, longitude: 74.8350, speed: 6.2, heading: 95, satellites: 10, fixStatus: 'LOCKED' },
      waterLevel: 4,
      engineStatus: 'RUNNING',
      batteryLevel: 91,
      temperature: 27.9,
      sosButtonActive: false,
    },
    aiAnalysis: { score: 3, confidence: 96, classification: 'NORMAL', reasons: ['All sensors nominal'], history: [3, 3, 3] },
  },
];

const cgSim = new CoastGuardSimulation();

// Mutable physics reference accessible to 60 FPS Three.js renders without triggering Zustand dispatches
export const mutablePhysicsState = {
  boats: JSON.parse(JSON.stringify(INITIAL_BOATS)) as BoatState[],
  cgDispatch: cgSim.getDispatchState(),
  activePacket: null as DistressPacket | null,
  activeRoute: [] as string[],
};

let stepTimer = 0;

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  boats: INITIAL_BOATS,
  selectedBoatId: 'BOAT-07',
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
      message: 'Offline Maritime LoRa Mesh Network Online. 6 Nodes Connected.',
    },
  ],
  currentStep: 'NORMAL',
  currentStepDescription: 'All vessels sailing normally in sea conditions.',
  activeScenario: 'NORMAL',
  isDemoMode: false,
  demoProgress: 0,
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
    let updatedBoats = state.boats.map((b) => ({ ...b }));
    let logs = [...state.eventLogs];

    const targetIdx = updatedBoats.findIndex((b) => b.id === 'BOAT-07');
    if (targetIdx !== -1) {
      const target = updatedBoats[targetIdx];
      switch (scenario) {
        case 'NORMAL':
          target.sensors.gyro = { roll: 2.4, pitch: 1.2, yaw: 135, yawRate: 1.1 };
          target.sensors.accel = { x: 0.05, y: 0.03, z: 0.98, total: 1.0 };
          target.sensors.motion = { status: 'NORMAL', intensity: 12 };
          target.sensors.engineStatus = 'RUNNING';
          target.sensors.waterLevel = 8;
          target.sensors.sosButtonActive = false;
          target.isDistressed = false;
          break;

        case 'ROUGH_SEA':
          target.sensors.gyro = { roll: 22.4, pitch: 14.8, yaw: 135, yawRate: 18.5 };
          target.sensors.accel = { x: 0.85, y: 0.62, z: 0.88, total: 1.35 };
          target.sensors.motion = { status: 'NORMAL', intensity: 58 };
          break;

        case 'MAN_OVERBOARD':
          target.sensors.gyro = { roll: 14.0, pitch: 9.0, yaw: 135, yawRate: 6.0 };
          target.sensors.accel = { x: 0.3, y: 0.2, z: 0.98, total: 1.05 };
          target.sensors.motion = { status: 'ABNORMAL', intensity: 88 };
          target.sensors.engineStatus = 'STOPPED';
          target.sensors.gps.speed = 0.2;
          break;

        case 'CAPSIZING':
          target.sensors.gyro = { roll: 48.5, pitch: 31.2, yaw: 135, yawRate: 72.0 };
          target.sensors.accel = { x: 2.8, y: 1.9, z: 0.4, total: 3.4 };
          target.sensors.motion = { status: 'ABNORMAL', intensity: 95 };
          target.sensors.engineStatus = 'STOPPED';
          target.sensors.waterLevel = 68;
          target.isDistressed = true;
          soundEffects.playEmergencyAlarm();
          break;

        case 'MANUAL_SOS':
          target.sensors.sosButtonActive = true;
          target.isDistressed = true;
          soundEffects.playEmergencyAlarm();
          break;

        case 'FULL_EMERGENCY':
          target.sensors.gyro = { roll: 54.2, pitch: 36.8, yaw: 135, yawRate: 85.0 };
          target.sensors.accel = { x: 3.2, y: 2.4, z: 0.3, total: 4.0 };
          target.sensors.motion = { status: 'ABNORMAL', intensity: 99 };
          target.sensors.engineStatus = 'FAULT';
          target.sensors.waterLevel = 82;
          target.sensors.sosButtonActive = true;
          target.isDistressed = true;
          soundEffects.playEmergencyAlarm();
          break;
      }
    }

    set({
      activeScenario: scenario,
      boats: updatedBoats,
    });
  },

  startFullEmergencySimulation: () => {
    stepTimer = 0;
    cgSim.reset();
    set({
      isDemoMode: true,
      currentStep: 'SHAKING',
      currentStepDescription: '🚨 Emergency Triggered! Vessel BOAT-07 encounters heavy physical wave instability.',
      demoProgress: 10,
      activeScenario: 'CAPSIZING',
      selectedBoatId: 'BOAT-07',
    });

    soundEffects.playEmergencyAlarm();

    const now = new Date().toLocaleTimeString();
    const logs = [...get().eventLogs];
    logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: now,
      boatId: 'BOAT-07',
      type: 'DISTRESS',
      message: '🚨 CRITICAL DISTRESS SCENARIO INITIATED ON BOAT-07 (KADAL-07).',
    });
    set({ eventLogs: logs.slice(0, 40) });
  },

  stopDemoMode: () => set({ isDemoMode: false, demoProgress: 0 }),

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
      message: `🚢 SAR Rescue Patrol Vessel CG-07 (INS SAMUDRA) dispatched to ${targetBoatId} position.`,
    });

    set({
      cgDispatch: cgSim.getDispatchState(),
      eventLogs: logs.slice(0, 40),
    });
  },

  resetSimulation: () => {
    cgSim.reset();
    stepTimer = 0;
    set({
      boats: INITIAL_BOATS,
      selectedBoatId: 'BOAT-07',
      meshLinks: [],
      activeRoute: [],
      activePacket: null,
      cgDispatch: cgSim.getDispatchState(),
      activeScenario: 'NORMAL',
      currentStep: 'NORMAL',
      currentStepDescription: 'All vessels sailing normally.',
      isDemoMode: false,
      demoProgress: 0,
      eventLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          boatId: 'SYSTEM',
          type: 'INFO',
          message: 'Simulation reset to default operational state.',
        },
      ],
    });
  },

  /**
   * Main Controlled Simulation Physics & State Engine Tick
   */
  updateSimulationTick: (deltaTimeSec: number) => {
    const state = get();
    if (state.isPaused) return;

    // 1. Physical Sensor Dynamics & Wave Oscillations for BOAT-07 and fleet
    const updatedBoats = state.boats.map((boat) => {
      const s = boat.sensors;
      const isTarget = boat.id === 'BOAT-07';

      let roll = s.gyro.roll;
      let pitch = s.gyro.pitch;
      let yawRate = s.gyro.yawRate;
      let accelTotal = s.accel.total;
      let motionIntensity = s.motion.intensity;

      if (isTarget && (state.currentStep === 'SHAKING' || state.currentStep === 'SENSOR_DETECTION' || state.currentStep === 'AI_THINKING' || state.currentStep === 'DISTRESS_CONFIRMED')) {
        // Physical boat shaking progression (0° to 48.5° roll)
        const pulse = Math.sin(Date.now() / 250);
        roll = Number((38.4 + pulse * 10.0).toFixed(1));
        pitch = Number((21.7 + pulse * 6.0).toFixed(1));
        yawRate = Number((42.0 + Math.abs(pulse) * 30.0).toFixed(1));
        accelTotal = Number((2.85 + Math.abs(pulse) * 0.8).toFixed(2));
        motionIntensity = Number((87 + Math.abs(pulse) * 12).toFixed(0));
      } else if (!isTarget) {
        const normPulse = Math.sin((Date.now() + boat.id.charCodeAt(5) * 100) / 400);
        roll = Number((2.0 + normPulse * 1.5).toFixed(1));
        pitch = Number((1.2 + normPulse * 1.0).toFixed(1));
      }

      const motionStatus: 'NORMAL' | 'ABNORMAL' = motionIntensity > 50 ? 'ABNORMAL' : 'NORMAL';

      const newSensors = {
        ...s,
        gyro: { ...s.gyro, roll, pitch, yawRate },
        accel: { ...s.accel, total: accelTotal, x: Number((accelTotal * 0.6).toFixed(2)), y: Number((accelTotal * 0.3).toFixed(2)), z: Number((accelTotal * 0.7).toFixed(2)) },
        motion: { ...s.motion, status: motionStatus, intensity: motionIntensity },
      };


      // AI Distress Analysis Evaluation
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

    // 3. Shortest Route Discovery using Dijkstra algorithm
    let route: string[] = [];
    const distressedBoat = updatedBoats.find((b) => b.isDistressed || b.id === 'BOAT-07');

    if (distressedBoat && (state.currentStep === 'LORA_LINK_FOUND' || state.currentStep === 'PACKET_RELAY' || state.currentStep === 'COAST_GUARD_ALERT' || state.currentStep === 'SAR_DISPATCH' || state.currentStep === 'RESCUE_IN_PROGRESS')) {
      route = MeshNetworkSimulator.findShortestPath('BOAT-07', COAST_GUARD_NODE_ID, links, updatedBoats);
      if (route.length === 0) {
        route = ['BOAT-07', 'BOAT-05', 'BOAT-02', 'BOAT-01', COAST_GUARD_NODE_ID];
      }
    }

    // 4. Update Packet Transmission Progression
    let currentPacket = state.activePacket;

    if (state.currentStep === 'PACKET_RELAY' && route.length >= 2) {
      if (!currentPacket) {
        currentPacket = {
          id: `DM-${Math.floor(1000 + Math.random() * 9000)}`,
          sourceBoatId: 'BOAT-07',
          destNodeId: COAST_GUARD_NODE_ID,
          route,
          currentHopIndex: 0,
          ttl: 10,
          hopsCount: route.length - 1,
          latencyMs: (route.length - 1) * 350,
          packetLossPercent: 1.2,
          status: 'CREATED',
          timestamp: new Date().toLocaleTimeString(),
          distressScore: 96,
          gpsLocation: { latitude: 11.2940, longitude: 74.8350 },
        };
      } else {
        const nextHop = currentPacket.currentHopIndex + deltaTimeSec * 0.8;
        if (nextHop >= route.length - 1) {
          currentPacket.currentHopIndex = route.length - 1;
          currentPacket.status = 'DELIVERED';
        } else {
          currentPacket.currentHopIndex = nextHop;
          currentPacket.status = 'HOP_FORWARDING';
        }
      }
    }

    // 5. Update Coast Guard Rescue Patrol Vessel Navigation
    cgSim.update(deltaTimeSec);
    const updatedCg = cgSim.getDispatchState();

    // 6. Handle Automated 19-Step Demo Progression Timer
    let nextStep = state.currentStep;
    let nextDesc = state.currentStepDescription;
    let demoProgress = state.demoProgress;

    if (state.isDemoMode) {
      stepTimer += deltaTimeSec;

      if (stepTimer >= 3.0) {
        stepTimer = 0;
        switch (state.currentStep) {
          case 'SHAKING':
            nextStep = 'SENSOR_DETECTION';
            nextDesc = '📊 Sensors reacting: Gyro roll +38.4°, Acceleration spike 2.85g, Motion Anomaly 87%.';
            demoProgress = 25;
            soundEffects.playEmergencyAlarm();
            break;
          case 'SENSOR_DETECTION':
            nextStep = 'AI_THINKING';
            nextDesc = '🧠 Multi-feature AI model evaluating sensor fusion parameters...';
            demoProgress = 40;
            break;
          case 'AI_THINKING':
            nextStep = 'DISTRESS_CONFIRMED';
            nextDesc = '🚨 AI Distress Analysis confirmed CRITICAL DISTRESS (Score: 96%, Confidence: 98%).';
            demoProgress = 55;
            soundEffects.playEmergencyAlarm();
            break;
          case 'DISTRESS_CONFIRMED':
            nextStep = 'SEARCHING_NEARBY';
            nextDesc = '📡 Searching for nearby fishing fleet nodes within LoRa 868MHz coverage radius...';
            demoProgress = 65;
            break;
          case 'SEARCHING_NEARBY':
            nextStep = 'LORA_LINK_FOUND';
            nextDesc = '🔗 LoRa Link established! Shortest Dijkstra multi-hop route: BOAT-07 ➔ BOAT-05 ➔ BOAT-02 ➔ BOAT-01 ➔ COAST GUARD HQ.';
            demoProgress = 75;
            soundEffects.playHopForwardPing();
            break;
          case 'LORA_LINK_FOUND':
            nextStep = 'PACKET_RELAY';
            nextDesc = '⚡ Emergency Distress Packet [DM-2026] transmitting across multi-hop mesh network...';
            demoProgress = 85;
            break;
          case 'PACKET_RELAY':
            nextStep = 'COAST_GUARD_ALERT';
            nextDesc = '🚨 COAST GUARD HQ RECEIVED EMERGENCY DISTRESS ALERT VIA LORA MESH!';
            demoProgress = 92;
            soundEffects.playCoastGuardReceived();
            cgSim.dispatchRescue('BOAT-07', 11.2940, 74.8350);
            break;
          case 'COAST_GUARD_ALERT':
            nextStep = 'SAR_DISPATCH';
            nextDesc = '🚢 Coast Guard Patrol Vessel CG-07 (INS SAMUDRA) dispatched to BOAT-07 coordinates.';
            demoProgress = 96;
            break;
          case 'SAR_DISPATCH':
            nextStep = 'RESCUE_COMPLETED';
            nextDesc = '✅ SAR Patrol Vessel CG-07 arrived at scene. Crew rescued and incident resolved!';
            demoProgress = 100;
            break;
        }
      }
    }

    // Keep mutable physics state synced for 60 FPS Three.js renders
    mutablePhysicsState.boats = updatedBoats;
    mutablePhysicsState.cgDispatch = updatedCg;
    mutablePhysicsState.activePacket = currentPacket;
    mutablePhysicsState.activeRoute = route;

    set({
      boats: updatedBoats,
      meshLinks: links,
      activeRoute: route,
      activePacket: currentPacket,
      cgDispatch: updatedCg,
      currentStep: nextStep,
      currentStepDescription: nextDesc,
      demoProgress,
    });
  },
}));
