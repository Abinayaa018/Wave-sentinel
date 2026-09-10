export type EngineStatus = 'RUNNING' | 'STOPPED' | 'FAULT';
export type DistressClassification = 'NORMAL' | 'ELEVATED_RISK' | 'DISTRESS_WARNING' | 'CRITICAL_DISTRESS';
export type PacketStatus = 'CREATED' | 'TRANSMITTING' | 'HOP_FORWARDING' | 'DELIVERED' | 'FAILED';
export type SARStatus = 'STANDBY' | 'DISPATCHED' | 'EN_ROUTE' | 'AT_SCENE' | 'RESCUING' | 'RESOLVED';
export type ScenarioId = 'NORMAL' | 'ROUGH_SEA' | 'MAN_OVERBOARD' | 'CAPSIZING' | 'MANUAL_SOS' | 'FULL_EMERGENCY';

export type EmergencyProgressionStep =
  | 'NORMAL'
  | 'SHAKING'
  | 'SENSOR_DETECTION'
  | 'AI_THINKING'
  | 'DISTRESS_CONFIRMED'
  | 'SEARCHING_NEARBY'
  | 'LORA_LINK_FOUND'
  | 'PACKET_RELAY'
  | 'COAST_GUARD_ALERT'
  | 'SAR_DISPATCH'
  | 'RESCUE_IN_PROGRESS'
  | 'RESCUE_COMPLETED';

export interface GyroscopeData {
  roll: number; // degrees (-90 to +90)
  pitch: number; // degrees (-90 to +90)
  yaw: number; // degrees (0 to 360)
  yawRate: number; // deg/s
}

export interface AccelerometerData {
  x: number; // g
  y: number; // g
  z: number; // g
  total: number; // g
}

export interface MotionData {
  status: 'NORMAL' | 'ABNORMAL';
  intensity: number; // 0 to 100%
}

export interface GPSData {
  latitude: number;
  longitude: number;
  speed: number; // knots
  heading: number; // degrees
  satellites: number;
  fixStatus: 'LOCKED' | 'SEARCHING' | 'LOST';
}

export interface BoatSensors {
  gyro: GyroscopeData;
  accel: AccelerometerData;
  motion: MotionData;
  gps: GPSData;
  waterLevel: number; // 0-100%
  engineStatus: EngineStatus;
  batteryLevel: number; // 0-100%
  temperature: number; // °C
  sosButtonActive: boolean;
}

export interface AIAnalysisResult {
  score: number; // 0 to 100%
  confidence: number; // 0 to 100%
  classification: DistressClassification;
  reasons: string[]; // Explainable AI reasons
  history: number[]; // Trend over last N ticks
  thinkingStep?: string; // Current AI process status message
}

export interface BoatState {
  id: string; // e.g. 'BOAT-07'
  name: string;
  isDistressed: boolean;
  sensors: BoatSensors;
  aiAnalysis: AIAnalysisResult;
  meshRangeKm: number; // e.g. 9 km
  isOnline: boolean;
}

export interface MeshLink {
  sourceId: string;
  targetId: string;
  distanceKm: number;
  rssiDbm: number;
  snrDb: number;
  isActive: boolean;
}

export interface DistressPacket {
  id: string;
  sourceBoatId: string;
  destNodeId: string; // 'CG-HQ'
  route: string[]; // e.g. ['BOAT-07', 'BOAT-05', 'BOAT-02', 'BOAT-01', 'CG-HQ']
  currentHopIndex: number;
  ttl: number;
  hopsCount: number;
  latencyMs: number;
  packetLossPercent: number;
  status: PacketStatus;
  timestamp: string;
  distressScore: number;
  gpsLocation: { latitude: number; longitude: number };
}

export interface CoastGuardDispatch {
  vesselId: string; // 'CG-07 (INS SAMUDRA)'
  status: SARStatus;
  targetBoatId: string | null;
  targetLocation: { latitude: number; longitude: number } | null;
  currentLocation: { latitude: number; longitude: number };
  distanceNM: number;
  etaMinutes: number;
  dispatchTimestamp: string | null;
}

export interface EmergencyEventLog {
  id: string;
  timestamp: string;
  boatId: string;
  type: 'INFO' | 'WARNING' | 'ANOMALY' | 'DISTRESS' | 'PACKET' | 'DISPATCH' | 'RESOLVED';
  message: string;
}

export interface ScenarioDefinition {
  id: ScenarioId;
  name: string;
  description: string;
  targetBoatId: string;
}
