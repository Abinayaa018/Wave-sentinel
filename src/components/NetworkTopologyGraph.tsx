import React from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { COAST_GUARD_NODE_ID } from '../simulation/MeshNetworkSimulator';
import { Radio, Wifi, ShieldAlert, Cpu } from 'lucide-react';

export const NetworkTopologyGraph: React.FC = () => {
  const { boats, meshLinks, activeRoute, activePacket, globalMeshRangeKm, currentStep } = useSimulationStore();

  const getNodePos = (id: string, index: number, total: number) => {
    if (id === COAST_GUARD_NODE_ID) {
      return { x: 300, y: 65 }; // Top center destination (Shore / CG HQ)
    }
    const angle = (index / (total - 1)) * Math.PI + Math.PI;
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
          <h2 className="font-hud text-lg text-cyan-400 uppercase tracking-wider flex items-center gap-2 font-bold">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            LoRa 868MHz Multi-Hop Mesh Network Topology
          </h2>
          <p className="text-xs text-slate-400 font-mono-code">
            Dijkstra Shortest Path Matrix // Transceiver Range: {globalMeshRangeKm} km
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono-code">
          <div className="bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800">
            <span className="text-slate-400 block text-[10px]">TOTAL NODES</span>
            <span className="text-cyan-400 font-bold">{boats.length + 1} Nodes</span>
          </div>
          <div className="bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800">
            <span className="text-slate-400 block text-[10px]">ACTIVE LINKS</span>
            <span className="text-cyan-400 font-bold">{meshLinks.length} Links</span>
          </div>
          <div className="bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800">
            <span className="text-slate-400 block text-[10px]">ROUTING STATUS</span>
            <span className="text-emerald-400 font-bold">{activeRoute.length > 0 ? 'ROUTE ACTIVE' : 'MONITORING'}</span>
          </div>
        </div>
      </div>

      {/* SVG Multi-Hop Topology Visualizer */}
      <div className="relative w-full h-[380px] bg-slate-950/90 rounded-xl overflow-hidden border border-slate-800 radar-grid flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 600 310">
          <defs>
            <linearGradient id="activeRouteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#f59e0b" />
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
                  stroke={isRouteEdge ? 'url(#activeRouteGrad)' : '#1e293b'}
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
                    fontWeight="bold"
                  >
                    {link.distanceKm}km ({link.rssiDbm}dBm)
                  </text>
                )}
              </g>
            );
          })}

          {/* Render Nodes */}
          {allNodeIds.map((id, idx) => {
            const isCG = id === COAST_GUARD_NODE_ID;
            const boat = boats.find((b) => b.id === id);
            const pos = getNodePos(id, idx, boats.length);
            const isDistressed = boat?.isDistressed || id === 'BOAT-07';
            const isInRoute = activeRoute.includes(id);

            return (
              <g key={id} transform={`translate(${pos.x}, ${pos.y})`}>
                {isDistressed && (
                  <circle r="22" fill="none" stroke="#ef4444" strokeWidth="2" className="animate-ping" />
                )}

                <circle
                  r={isCG ? '18' : '14'}
                  fill={isCG ? '#0284c7' : isDistressed ? '#ef4444' : isInRoute ? '#06b6d4' : '#1e293b'}
                  stroke={isDistressed ? '#ef4444' : isInRoute ? '#f59e0b' : '#334155'}
                  strokeWidth="2.5"
                />

                <text
                  y={isCG ? '28' : '24'}
                  fill={isDistressed ? '#fca5a5' : isInRoute ? '#67e8f9' : '#94a3b8'}
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

      {/* Packet Metadata Panel */}
      {activePacket && (
        <div className="hud-card-amber p-4 flex flex-col gap-3 font-mono-code text-xs">
          <div className="flex items-center justify-between border-b border-amber-500/40 pb-2">
            <span className="text-amber-400 font-bold flex items-center gap-2 uppercase">
              <ShieldAlert className="w-4 h-4" />
              LORA EMERGENCY DISTRESS PACKET METADATA
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 uppercase">
              STATUS: {activePacket.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">PACKET ID</span>
              <span className="text-amber-400 font-bold text-sm">{activePacket.id}</span>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">SOURCE NODE</span>
              <span className="text-red-400 font-bold text-sm">{activePacket.sourceBoatId}</span>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">DESTINATION</span>
              <span className="text-sky-400 font-bold text-sm">{activePacket.destNodeId}</span>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">HOP COUNT</span>
              <span className="text-cyan-400 font-bold text-sm">{activePacket.hopsCount} Hops</span>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">TTL / LATENCY</span>
              <span className="text-emerald-400 font-bold text-sm">{activePacket.ttl} / {activePacket.latencyMs}ms</span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded border border-amber-500/30 flex items-center justify-between">
            <span className="text-slate-300 text-xs">
              <strong className="text-amber-400">CALCULATED ROUTE:</strong> {activePacket.route.join(' ➔ ')}
            </span>
            <span className="text-emerald-400 font-bold text-xs">OFFLINE LORA MESH ACTIVE</span>
          </div>
        </div>
      )}
    </div>
  );
};
