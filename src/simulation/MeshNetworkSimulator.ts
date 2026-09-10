import { BoatState, MeshLink } from '../types/simulation';

export const COAST_GUARD_NODE_ID = 'CG-HQ';
export const COAST_GUARD_LAT = 11.2500;
export const COAST_GUARD_LON = 74.7500;

export class MeshNetworkSimulator {
  /**
   * Calculates Haversine distance in Kilometers between two lat/lon points
   */
  public static calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Generates all active LoRa mesh links between boats and Coast Guard HQ
   */
  public static buildMeshLinks(boats: BoatState[]): MeshLink[] {
    const links: MeshLink[] = [];

    // Create all node coordinates including Coast Guard HQ
    const nodes = [
      ...boats.map((b) => ({
        id: b.id,
        lat: b.sensors.gps.latitude,
        lon: b.sensors.gps.longitude,
        rangeKm: b.meshRangeKm,
        isOnline: b.isOnline,
      })),
      {
        id: COAST_GUARD_NODE_ID,
        lat: COAST_GUARD_LAT,
        lon: COAST_GUARD_LON,
        rangeKm: 25.0, // High-power Coast Guard base station range
        isOnline: true,
      },
    ];

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];

        if (!n1.isOnline || !n2.isOnline) continue;

        const dist = this.calculateDistanceKm(n1.lat, n1.lon, n2.lat, n2.lon);
        const maxCoverage = Math.max(n1.rangeKm, n2.rangeKm);

        if (dist <= maxCoverage) {
          // RSSI calculation approximation (-50 dBm close to -120 dBm near max range)
          const ratio = dist / maxCoverage;
          const rssiDbm = Math.round(-50 - ratio * 65);
          const snrDb = Number((12 - ratio * 15).toFixed(1));

          links.push({
            sourceId: n1.id,
            targetId: n2.id,
            distanceKm: Number(dist.toFixed(2)),
            rssiDbm,
            snrDb,
            isActive: true,
          });
        }
      }
    }

    return links;
  }

  /**
   * Dijkstra / BFS algorithm to find shortest multi-hop route from source boat to Coast Guard HQ
   */
  public static findShortestPath(
    sourceId: string,
    targetId: string,
    links: MeshLink[],
    boats: BoatState[]
  ): string[] {
    const allNodeIds = [
      ...boats.filter((b) => b.isOnline).map((b) => b.id),
      COAST_GUARD_NODE_ID,
    ];

    if (!allNodeIds.includes(sourceId) || !allNodeIds.includes(targetId)) {
      return [];
    }

    const adjacencyMap: Map<string, Array<{ neighbor: string; weight: number }>> = new Map();
    allNodeIds.forEach((id) => adjacencyMap.set(id, []));

    links.forEach((link) => {
      if (link.isActive) {
        adjacencyMap.get(link.sourceId)?.push({ neighbor: link.targetId, weight: link.distanceKm });
        adjacencyMap.get(link.targetId)?.push({ neighbor: link.sourceId, weight: link.distanceKm });
      }
    });

    const distances: Map<string, number> = new Map();
    const previous: Map<string, string | null> = new Map();
    const unvisited = new Set<string>(allNodeIds);

    allNodeIds.forEach((id) => {
      distances.set(id, Infinity);
      previous.set(id, null);
    });

    distances.set(sourceId, 0);

    while (unvisited.size > 0) {
      // Find unvisited node with smallest distance
      let current: string | null = null;
      let minDistance = Infinity;

      unvisited.forEach((nodeId) => {
        const d = distances.get(nodeId) ?? Infinity;
        if (d < minDistance) {
          minDistance = d;
          current = nodeId;
        }
      });

      if (!current || minDistance === Infinity) break;
      if (current === targetId) break; // Destination reached

      unvisited.delete(current);

      const neighbors = adjacencyMap.get(current) || [];
      for (const { neighbor, weight } of neighbors) {
        if (!unvisited.has(neighbor)) continue;

        const newDist = (distances.get(current) || 0) + weight;
        if (newDist < (distances.get(neighbor) || Infinity)) {
          distances.set(neighbor, newDist);
          previous.set(neighbor, current);
        }
      }
    }

    // Reconstruct path
    const path: string[] = [];
    let curr: string | null = targetId;

    if (distances.get(targetId) === Infinity) {
      return []; // No route exists
    }

    while (curr) {
      path.unshift(curr);
      curr = previous.get(curr) || null;
    }

    return path.length > 1 ? path : [];
  }
}
