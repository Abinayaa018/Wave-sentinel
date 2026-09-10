import { BoatSensors, AIAnalysisResult, DistressClassification } from '../types/simulation';

export class DistressDetectionEngine {
  /**
   * Evaluates sensor metrics to compute multi-feature explainable distress scores
   */
  public static evaluate(sensors: BoatSensors, previousHistory: number[] = []): AIAnalysisResult {
    let score = 0;
    const reasons: string[] = [];

    // 1. Manual SOS check
    if (sensors.sosButtonActive) {
      score += 50;
      reasons.push('🚨 MANUAL SOS ACTIVATION SIGNAL');
    }

    // 2. Roll severity evaluation
    const absRoll = Math.abs(sensors.gyro.roll);
    if (absRoll > 45) {
      score += 45;
      reasons.push(`✓ Severe vessel roll detected (${absRoll.toFixed(1)}° > 45° threshold)`);
    } else if (absRoll > 30) {
      score += 30;
      reasons.push(`✓ Abnormal vessel roll angle (${absRoll.toFixed(1)}°)`);
    } else if (absRoll > 20) {
      score += 15;
    }

    // 3. Pitch severity evaluation
    const absPitch = Math.abs(sensors.gyro.pitch);
    if (absPitch > 30) {
      score += 25;
      reasons.push(`✓ Severe pitch elevation (${absPitch.toFixed(1)}°)`);
    } else if (absPitch > 18) {
      score += 12;
    }

    // 4. Yaw rate / sudden rotation evaluation
    if (sensors.gyro.yawRate > 50) {
      score += 20;
      reasons.push(`✓ High angular velocity / rapid spin (${sensors.gyro.yawRate.toFixed(1)}°/s)`);
    }

    // 5. Accelerometer IMU anomaly
    if (sensors.accel.total > 2.5) {
      score += 25;
      reasons.push(`✓ Severe impact/acceleration spike (${sensors.accel.total.toFixed(2)} g)`);
    } else if (sensors.accel.total > 1.8) {
      score += 15;
      reasons.push(`✓ Abnormal IMU motion dynamics (${sensors.accel.total.toFixed(2)} g)`);
    }

    // 6. Motion detector & stationary drift
    if (sensors.motion.status === 'ABNORMAL') {
      score += 20;
      reasons.push(`✓ Vessel motion detector flagged ABNORMAL pattern (${sensors.motion.intensity.toFixed(0)}%)`);
    }

    // 7. Engine status
    if (sensors.engineStatus === 'STOPPED' && sensors.gps.speed < 0.5) {
      score += 15;
      reasons.push('✓ Main propulsion engine STOPPED while offshore');
    } else if (sensors.engineStatus === 'FAULT') {
      score += 10;
      reasons.push('✓ Engine failure telemetry detected');
    }

    // 8. Hull water level
    if (sensors.waterLevel > 40) {
      score += 25;
      reasons.push(`✓ High bilge water level detected (${sensors.waterLevel.toFixed(0)}%)`);
    }

    // Cap score at 100%
    score = Math.min(100, Math.max(0, Math.round(score)));

    // Calculate Confidence based on multi-sensor sensor agreement
    let featureAgreement = 0;
    if (absRoll > 20) featureAgreement++;
    if (sensors.accel.total > 1.5) featureAgreement++;
    if (sensors.motion.status === 'ABNORMAL') featureAgreement++;
    if (sensors.engineStatus !== 'RUNNING') featureAgreement++;
    if (sensors.sosButtonActive) featureAgreement += 3;

    const confidence = Math.min(99, 70 + featureAgreement * 6);

    // Classify
    let classification: DistressClassification = 'NORMAL';
    if (score >= 70) {
      classification = 'CRITICAL_DISTRESS';
    } else if (score >= 45) {
      classification = 'DISTRESS_WARNING';
    } else if (score >= 25) {
      classification = 'ELEVATED_RISK';
    }

    // Append default safe reason if none
    if (reasons.length === 0) {
      reasons.push('All sensor parameters operating within safe maritime boundaries');
    }

    const updatedHistory = [...previousHistory, score].slice(-20);

    return {
      score,
      confidence,
      classification,
      reasons,
      history: updatedHistory,
    };
  }
}
