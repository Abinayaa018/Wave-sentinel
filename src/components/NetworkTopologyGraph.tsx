import React from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { COAST_GUARD_NODE_ID } from '../simulation/MeshNetworkSimulator';

export const NetworkTopologyGraph: React.FC = () => {
  const { boats, meshLinks, activeRoute, activePacket, globalMeshRangeKm } = useSimulationStore();

  // Position nodes in a clean circular tactical network layout
  const getNodePos = (id: string, index: number, total: number) => {
    if (id === COAST_GUARD_NODE_ID) {
      return { x: 300, y: 70 }; // Top center destination
    }
    const angle = (index / (total - 1)) * Math.PI + Math.PI; // Bottom semi-circle
    const r = 160;
    return {
      x: 300 + Math.cos(angle) * r,
      y: 220 + Math.sin(angle) * r * 0.7,
    };
  };

  const allNodeIds = [...boats.map((b) => b.id), COAST_GUARD_NODE_ID];

  return (
    <div className="hud-card p-6 flex flex-col gap-6 w-full h-full">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
        <div>
          <h2 className="font-hud text-lg text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            LoRa Mesh Network Topology & Routing Graph
          </h2>
          <p className="text-xs text-slate-400 font-mono-code">
            Multi-hop Graph Dijkstra Routing Matrix // Transceiver Range: {globalMeshRangeKm} km
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono-code">
          <div className="bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800">
            <span className="text-slate-400 block text-[10px]">ACTIVE NODES</span>
            <span className="text-cyan-400 font-bold">{boats.length + 1} Nodes</span>
          </div>
          <div className="bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800">
            <span className="text-slate-400 block text-[10px]">ACTIVE LINKS</span>
            <span className="text-cyan-400 font-bold">{meshLinks.length} Links</span>
          </div>
          <div className="bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800">
            <span className="text-slate-400 block text-[10px]">AVG LATENCY</span>
            <span className="text-emerald-400 font-bold">1.8 sec</span>
          </div>
        </div>
      </div>

      {/* SVG Interactive Topology Canvas */}
      <div className="relative w-full h-[400px] bg-slate-950/90 rounded-xl overflow-hidden border border-slate-800 radar-grid flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 600 320">
          <defs>
            <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          {/* Render All Mesh Edges */}
          {meshLinks.map((link) => {
            const n1Idx = boats.findIndex((b) => b.id === link.sourceId);
            const n2Idx = boats.findIndex((b) => b.id === link.targetId);

            const p1 = getNodePos(link.sourceId, n1Idx, boats.length);
            const p2 = getNodePos(link.targetId, n2Idx, boats.length);

            const isRouteEdge =
              activeRoute.length >= 2 &&
              activeRoute.some(
                (id, i) =>
                  (id === link.sourceId && activeRoute[i + 1] === link.targetId) ||
                  (id === link.targetId && activeRoute[i + 1] === link.sourceId)
              );

            return (
              <g key={`${link.sourceId}-${link.targetId}`}>
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={isRouteEdge ? 'url(#routeGrad)' : '#1e293b'}
                  strokeWidth={isRouteEdge ? '3.5' : '1'}
                  strokeDasharray={isRouteEdge ? '6,3' : undefined}
                />
                {isRouteEdge && (
                  <text
                    x={(p1.x + p2.x) / 2}
                    y={(p1.y + p2.y) / 2 - 6}
                    fill="#f59e0b"
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                  >
                    {link.distanceKm}km ({link.rssiDbm}dBm)
                  </text>
                )}
              </g>
            );
          })}

          {/* Render All Nodes */}
          {allNodeIds.map((id, idx) => {
            const isCG = id === COAST_GUARD_NODE_ID;
            const boat = boats.find((b) => b.id === id);
            const pos = getNodePos(id, idx, boats.length);
            const isDistressed = boat?.isDistressed || false;
            const isInRoute = activeRoute.includes(id);

            return (
              <g key={id} transform={`translate(${pos.x}, ${pos.y})`}>
                {/* Outer Glow Ring for Distressed Node */}
                {isDistressed && (
                  <circle r="22" fill="none" stroke="#ef4444" strokeWidth="2" className="animate-ping" />
                )}

                {/* Node Circle */}
                <circle
                  r={isCG ? '18' : '14'}
                  fill={isCG ? '#0284c7' : isDistressed ? '#ef4444' : isInRoute ? '#06b6d4' : '#1e293b'}
                  stroke={isDistressed ? '#ef4444' : isInRoute ? '#f59e0b' : '#334155'}
                  strokeWidth="2"
                />

                {/* Node Label */}
                <text
                  y={isCG ? '28' : '24'}
                  fill={isDistressed ? '#fca5a5' : '#94a3b8'}
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="Chakra Petch"
                  textAnchor="middle"
                >
                  {isCG ? 'COAST GUARD HQ' : id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Packet Transmission Metadata HUD */}
      {activePacket && (
        <div className="hud-card-amber p-4 flex items-center justify-between font-mono-code text-xs">
          <div>
            <span className="text-amber-400 font-bold block">🚨 ACTIVE DISTRESS PACKET TRANSMISSION</span>
            <span className="text-slate-300">
              ID: {activePacket.id} | Source: {activePacket.sourceBoatId} | Path: {activePacket.route.join(' ➔ ')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>Hops: {activePacket.hopsCount}</span>
            <span>Latency: {activePacket.latencyMs}ms</span>
            <span className="text-emerald-400 font-bold">Status: {activePacket.status}</span>
          </div>
        </div>
      )}
    </div>
  );
};
