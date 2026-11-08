import { useEffect, useReducer, useState } from 'react';
import { planetById, systemById } from './game/data';
import { holdCapacity, holdUsed, loadGame, rank, reduce, saveGame } from './game/state';
import { Stat, cr } from './ui/common';
import { GalaxyMap, SystemMap } from './ui/Maps';
import { CraftPanel, DronesPanel, KingdomPanel, MarketPanel, PlanetPanel, ShipPanel } from './ui/Panels';

type Tab = 'planet' | 'ship' | 'drones' | 'craft' | 'market' | 'kingdom';
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'planet', label: 'Explore', icon: '🪐' },
  { id: 'ship', label: 'Ship', icon: '🚀' },
  { id: 'drones', label: 'Drones', icon: '🛸' },
  { id: 'craft', label: 'Craft', icon: '🛠️' },
  { id: 'market', label: 'Market', icon: '💰' },
  { id: 'kingdom', label: 'Kingdom', icon: '👑' },
];

export default function App() {
  const [s, dispatch] = useReducer(reduce, undefined, () => loadGame(Date.now()));
  const [tab, setTab] = useState<Tab>('planet');
  const [view, setView] = useState<'system' | 'galaxy'>('system');
  const [viewSystem, setViewSystem] = useState<string>(s.location);
  const [selected, setSelected] = useState<string | null>('rustball');

  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'tick', now: Date.now() }), 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => saveGame(s), 2000);
    const onHide = () => saveGame(s);
    window.addEventListener('pagehide', onHide);
    return () => { clearInterval(id); window.removeEventListener('pagehide', onHide); };
  }, [s]);

  // Follow the mothership when it arrives somewhere new
  const [lastLoc, setLastLoc] = useState(s.location);
  if (lastLoc !== s.location) { setLastLoc(s.location); setViewSystem(s.location); setView('system'); }

  const pickPlanet = (id: string) => {
    const p = planetById(id);
    setSelected(id);
    if (p) setViewSystem(p.systemId);
    setTab(p?.market && !s.travel && s.location === p.systemId ? 'market' : 'planet');
  };
  const pickSystem = (id: string) => { setViewSystem(id); setSelected(null); setView('system'); setTab('planet'); };
  const openShip = () => setTab('ship');

  const full = holdUsed(s) >= holdCapacity(s) - 0.5;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">🪐 <span>Planet Miner</span></div>
        <div className="stats">
          <Stat label="Credits" value={cr(s.credits)} />
          <Stat label="Debt" value={s.freed ? 'FREE!' : cr(s.debt)} warn={!s.freed} />
          <Stat label="Hold" value={`${Math.floor(holdUsed(s)).toLocaleString()}/${holdCapacity(s).toLocaleString()}`} warn={full} />
          <Stat label="Rank" value={`${rank(s)}`} />
        </div>
      </header>

      <main className="layout">
        <section className="map-wrap" aria-label="Map">
          <div className="map-toggle" role="tablist" aria-label="Map view">
            <button role="tab" aria-selected={view === 'system'} className={view === 'system' ? 'on' : ''} onClick={() => setView('system')}>System</button>
            <button role="tab" aria-selected={view === 'galaxy'} className={view === 'galaxy' ? 'on' : ''} onClick={() => setView('galaxy')}>Galaxy</button>
          </div>
          {s.travel && <div className="transit">🚀 → {systemById(s.travel.to).name} · {Math.ceil(s.travel.remaining)}s</div>}
          {view === 'system'
            ? <SystemMap s={s} systemId={viewSystem} selected={selected} onPickPlanet={pickPlanet} onShip={openShip} />
            : <GalaxyMap s={s} viewing={viewSystem} onPickSystem={pickSystem} onShip={openShip} />}
        </section>

        <section className="panel">
          <nav className="tabs" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
                <span className="ti">{t.icon}</span><span className="tl">{t.label}</span>
              </button>
            ))}
          </nav>
          <div className="panel-body">
            {tab === 'planet' && <PlanetPanel s={s} systemId={viewSystem} planetId={selected} dispatch={dispatch} onPickPlanet={pickPlanet} onDrones={() => setTab('drones')} />}
            {tab === 'ship' && <ShipPanel s={s} dispatch={dispatch} />}
            {tab === 'drones' && <DronesPanel s={s} dispatch={dispatch} />}
            {tab === 'craft' && <CraftPanel s={s} dispatch={dispatch} />}
            {tab === 'market' && <MarketPanel s={s} dispatch={dispatch} onGalaxy={() => setView('galaxy')} />}
            {tab === 'kingdom' && <KingdomPanel s={s} dispatch={dispatch} />}
          </div>
        </section>
      </main>
    </div>
  );
}
