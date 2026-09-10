import { CoastGuardDispatch, SARStatus } from '../types/simulation';
import { COAST_GUARD_LAT, COAST_GUARD_LON, MeshNetworkSimulator } from './MeshNetworkSimulator';

export class CoastGuardSimulation {
  private dispatchState: CoastGuardDispatch = {
    vesselId: 'CG-07 (INS SAMUDRA)',
    status: 'STANDBY',
    targetBoatId: null,
    targetLocation: null,
    currentLocation: { latitude: COAST_GUARD_LAT, longitude: COAST_GUARD_LON },
    distanceNM: 0,
    etaMinutes: 0,
    dispatchTimestamp: null,
  };

  public getDispatchState(): CoastGuardDispatch {
    return { ...this.dispatchState };
  }

  public dispatchRescue(targetBoatId: string, targetLat: number, targetLon: number) {
    const distKm = MeshNetworkSimulator.calculateDistanceKm(
      this.dispatchState.currentLocation.latitude,
      this.dispatchState.currentLocation.longitude,
      targetLat,
      targetLon
    );
    const distNM = distKm * 0.539957; // km to NM
    const speedKnots = 28.0; // Fast rescue vessel speed
    const etaMin = Math.round((distNM / speedKnots) * 60);

    this.dispatchState = {
      ...this.dispatchState,
      status: 'DISPATCHED',
      targetBoatId,
      targetLocation: { latitude: targetLat, longitude: targetLon },
      distanceNM: Number(distNM.toFixed(1)),
      etaMinutes: etaMin,
      dispatchTimestamp: new Date().toLocaleTimeString(),
    };
  }

  public update(deltaTimeSec: number) {
    if (!this.dispatchState.targetLocation || this.dispatchState.status === 'STANDBY' || this.dispatchState.status === 'RESOLVED') {
      return;
    }

    if (this.dispatchState.status === 'DISPATCHED') {
      this.dispatchState.status = 'EN_ROUTE';
    }

    const cur = this.dispatchState.currentLocation;
    const target = this.dispatchState.targetLocation;

    const distKm = MeshNetworkSimulator.calculateDistanceKm(cur.latitude, cur.longitude, target.latitude, target.longitude);
    const distNM = distKm * 0.539957;

    if (distNM <= 0.2) {
      if (this.dispatchState.status === 'EN_ROUTE') {
        this.dispatchState.status = 'AT_SCENE';
        this.dispatchState.distanceNM = 0;
        this.dispatchState.etaMinutes = 0;
      }
    } else {
      // Step position towards target
      const speedKnots = 28.0;
      const nmPerSec = speedKnots / 3600;
      const stepNM = nmPerSec * deltaTimeSec * 4; // 4x speed multiplier for demo smoothness

      const ratio = Math.min(1.0, stepNM / distNM);
      const newLat = cur.latitude + (target.latitude - cur.latitude) * ratio;
      const newLon = cur.longitude + (target.longitude - cur.longitude) * ratio;

      const remainingNM = distNM * (1 - ratio);
      const remainingEta = Math.max(1, Math.round((remainingNM / speedKnots) * 60));

      this.dispatchState.currentLocation = { latitude: newLat, longitude: newLon };
      this.dispatchState.distanceNM = Number(remainingNM.toFixed(1));
      this.dispatchState.etaMinutes = remainingEta;
    }
  }

  public setStatus(status: SARStatus) {
    this.dispatchState.status = status;
  }

  public reset() {
    this.dispatchState = {
      vesselId: 'CG-07 (INS SAMUDRA)',
      status: 'STANDBY',
      targetBoatId: null,
      targetLocation: null,
      currentLocation: { latitude: COAST_GUARD_LAT, longitude: COAST_GUARD_LON },
      distanceNM: 0,
      etaMinutes: 0,
      dispatchTimestamp: null,
    };
  }
}
