import { PLANETS, SYSTEMS, planetsIn, systemById } from '../game/data';
import { GameState, canReach } from '../game/state';

const R = 46;

function planetPos(orbit: number, phase: number) {
  const a = phase;
  return { x: Math.cos(a) * orbit * R, y: Math.sin(a) * orbit * R };
}

export function MothershipIcon({ x, y, scale = 1, onClick, label }: { x: number; y: number; scale?: number; onClick?: () => void; label: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} className="mothership" role="button" tabIndex={0} aria-label={label}
      onClick={onClick} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}>
      <circle r="6" fill="transparent" />
      <path d="M-4.5 1.5 L0 -3.5 L4.5 1.5 L2.5 1.5 L2.5 3 L-2.5 3 L-2.5 1.5 Z" fill="#dfe6ff" stroke="#8ab4ff" strokeWidth="0.4" />
      <circle r="0.9" cy="-0.2" fill="#8ab4ff" />
      <path d="M-1.5 3 L0 5 L1.5 3 Z" fill="#ffb347" className="flame" />
      {scale > 1 && <text y="8" textAnchor="middle" fontSize="2.2" fill="#cfd6ea">Mothership</text>}
    </g>
  );
}

export function SystemMap({ s, systemId, selected, onPickPlanet, onShip }: {
  s: GameState; systemId: string; selected: string | null; onPickPlanet: (id: string) => void; onShip: () => void;
}) {
  const sys = systemById(systemId);
  const here = !s.travel && s.location === systemId;
  return (
    <svg viewBox="-50 -50 100 100" className="map" role="img" aria-label={`${sys.name} map`}>
      <defs>
        <radialGradient id="sun"><stop offset="0" stopColor="#fff6c9" /><stop offset="1" stopColor={sys.color} /></radialGradient>
      </defs>
      <circle r="4.5" fill="url(#sun)" />
      {planetsIn(systemId).map((p) => {
        const { x, y } = planetPos(p.orbit, p.phase);
        const owned = s.ownedPlanets.includes(p.id);
        const drones = s.drones.filter((d) => d.planetId === p.id).length;
        const r = p.size / 10;
        return (
          <g key={p.id}>
            <circle r={p.orbit * R} fill="none" stroke="#ffffff12" strokeWidth="0.25" />
            <g transform={`translate(${x} ${y})`} className="planet" onClick={() => onPickPlanet(p.id)} role="button" aria-label={p.name} tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onPickPlanet(p.id)}>
              <circle r={r + 3} fill="transparent" />
              {selected === p.id && <circle r={r + 1.4} fill="none" stroke="#8ab4ff" strokeWidth="0.45" />}
              {owned && <circle r={r + 0.7} fill="none" stroke="#7be0a5" strokeWidth="0.35" strokeDasharray="1 0.8" />}
              <circle r={r} fill={p.color} opacity={owned || p.market ? 1 : 0.6} />
              {p.market && <text y={-r - 1} textAnchor="middle" fontSize="2.6">👑</text>}
              {p.hazard > 0 && !p.market && <text x={-r - 2.6} y={-r + 1} fontSize="2">⚠️</text>}
              {drones > 0 && <text x={r + 0.4} y={-r + 1} fontSize="2.2">🛸{drones > 1 ? drones : ''}</text>}
              <text y={r + 3} textAnchor="middle" fontSize="2.2" fill="#cfd6ea">{p.name}</text>
            </g>
          </g>
        );
      })}
      {here && <MothershipIcon x={-42} y={38} scale={1.1} onClick={onShip} label="Open your mothership" />}
      <text x="-48" y="-45" fontSize="3" fill="#a9b1c7">{sys.name}</text>
      <text x="-48" y="-41.5" fontSize="2.2" fill="#7f8aa8">Tier {sys.tier} · {here ? 'you are here' : s.travel?.to === systemId ? 'arriving soon' : 'viewing'}</text>
    </svg>
  );
}

export function GalaxyMap({ s, viewing, onPickSystem, onShip }: {
  s: GameState; viewing: string; onPickSystem: (id: string) => void; onShip: () => void;
}) {
  const from = systemById(s.location);
  let ship = { x: from.x, y: from.y };
  if (s.travel) {
    const to = systemById(s.travel.to);
    const k = 1 - s.travel.remaining / s.travel.total;
    ship = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k };
  }
  return (
    <svg viewBox="-50 -50 100 100" className="map" role="img" aria-label="Galaxy map">
      {SYSTEMS.slice(1).map((sys, i) => {
        const prev = SYSTEMS[i];
        return <line key={sys.id} x1={prev.x} y1={prev.y} x2={sys.x} y2={sys.y} stroke={canReach(s, sys.id) ? '#8ab4ff55' : '#ffffff18'} strokeWidth="0.4" strokeDasharray="1.2 1" />;
      })}
      {SYSTEMS.map((sys) => {
        const ok = canReach(s, sys.id);
        const owned = PLANETS.filter((p) => p.systemId === sys.id && s.ownedPlanets.includes(p.id)).length;
        return (
          <g key={sys.id} transform={`translate(${sys.x} ${sys.y})`} className="planet" role="button" tabIndex={0} aria-label={sys.name}
            onClick={() => onPickSystem(sys.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onPickSystem(sys.id)}>
            <circle r="6" fill="transparent" />
            {viewing === sys.id && <circle r="4.2" fill="none" stroke="#8ab4ff" strokeWidth="0.45" />}
            <circle r="2.8" fill={sys.color} opacity={ok ? 1 : 0.3} />
            {!ok && <text y="1" textAnchor="middle" fontSize="2.6">🔒</text>}
            <text y="6.4" textAnchor="middle" fontSize="2.3" fill={ok ? '#e6e9f2' : '#7f8aa8'}>{sys.name}</text>
            <text y="9" textAnchor="middle" fontSize="1.9" fill="#7f8aa8">
              {ok ? `Tier ${sys.tier}${owned ? ` · ${owned} owned` : ''}` : `Needs Engines ${sys.tier}`}
            </text>
          </g>
        );
      })}
      <MothershipIcon x={ship.x + 5.5} y={ship.y - 4.5} scale={0.8} onClick={onShip} label="Open your mothership" />
      <text x="-48" y="-45" fontSize="3" fill="#a9b1c7">The Kingdom</text>
      <text x="-48" y="-41.5" fontSize="2.2" fill="#7f8aa8">{s.visited.length}/10 systems visited · {s.ownedPlanets.length}/90 planets owned</text>
    </svg>
  );
}
