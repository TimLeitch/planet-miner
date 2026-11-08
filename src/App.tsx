import { useEffect, useReducer, useState } from 'react';
import {
  GOODS, GoodId, MAX_DRILL_LEVEL, PLANETS, RECIPES, SHIP_NAME, SYSTEM_NAME, drillUpgradeCost, holdUpgradeCost,
} from './game/data';
import {
  GameState, MAX_QUEUE, demandOf, have, holdCapacity, holdUsed, loadGame, miningRate, quoteSale, reduce,
  saveGame, shipCost, unitPrice,
} from './game/state';

type Tab = 'planet' | 'fleet' | 'craft' | 'market' | 'kingdom';
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'planet', label: 'Planet', icon: '🪐' },
  { id: 'fleet', label: 'Fleet', icon: '🚀' },
  { id: 'craft', label: 'Craft', icon: '🛠️' },
  { id: 'market', label: 'Market', icon: '💰' },
  { id: 'kingdom', label: 'Kingdom', icon: '👑' },
];

const cr = (n: number) => `${Math.floor(n).toLocaleString()} cr`;

export default function App() {
  const [s, dispatch] = useReducer(reduce, undefined, () => loadGame(Date.now()));
  const [tab, setTab] = useState<Tab>('planet');
  const [selected, setSelected] = useState<string>(PLANETS[0].id);

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

  const pickPlanet = (id: string) => { setSelected(id); setTab(PLANETS.find((p) => p.id === id)?.market ? 'market' : 'planet'); };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">🪐 <span>Planet Miner</span></div>
        <div className="stats">
          <Stat label="Credits" value={cr(s.credits)} />
          <Stat label="Debt" value={s.freed ? 'FREE!' : cr(s.debt)} warn={!s.freed} />
          <Stat label="Hold" value={`${Math.floor(holdUsed(s))}/${holdCapacity(s)}`} warn={holdUsed(s) >= holdCapacity(s) - 0.5} />
        </div>
      </header>

      <main className="layout">
        <section className="map-wrap" aria-label="Star system map">
          <SystemMap s={s} selected={selected} onPick={pickPlanet} />
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
            {tab === 'planet' && <PlanetPanel s={s} planetId={selected} dispatch={dispatch} onPick={pickPlanet} />}
            {tab === 'fleet' && <FleetPanel s={s} dispatch={dispatch} />}
            {tab === 'craft' && <CraftPanel s={s} dispatch={dispatch} />}
            {tab === 'market' && <MarketPanel s={s} dispatch={dispatch} />}
            {tab === 'kingdom' && <KingdomPanel s={s} dispatch={dispatch} />}
          </div>
        </section>
      </main>
    </div>
  );
}

type D = React.Dispatch<Parameters<typeof reduce>[1]>;

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return <div className={`stat${warn ? ' warn' : ''}`}><small>{label}</small><b>{value}</b></div>;
}

function SystemMap({ s, selected, onPick }: { s: GameState; selected: string; onPick: (id: string) => void }) {
  const R = 46;
  return (
    <svg viewBox="-50 -50 100 100" className="map" role="img" aria-label={`${SYSTEM_NAME} map`}>
      <defs>
        <radialGradient id="sun"><stop offset="0" stopColor="#fff6c9" /><stop offset="1" stopColor="#ffb347" /></radialGradient>
      </defs>
      <circle r="5" fill="url(#sun)" />
      {PLANETS.map((p, i) => {
        const angle = (i / PLANETS.length) * Math.PI * 2 - Math.PI / 2 + (s.lastTick / 1000) * 0.01 / (p.orbit * 2);
        const x = Math.cos(angle) * p.orbit * R;
        const y = Math.sin(angle) * p.orbit * R;
        const owned = s.ownedPlanets.includes(p.id);
        const ships = s.ships.filter((sh) => sh.planetId === p.id).length;
        const r = p.size / 8;
        return (
          <g key={p.id}>
            <circle r={p.orbit * R} fill="none" stroke="#ffffff14" strokeWidth="0.3" />
            <g transform={`translate(${x} ${y})`} className="planet" onClick={() => onPick(p.id)} role="button" aria-label={p.name} tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onPick(p.id)}>
              <circle r={r + 3} fill="transparent" />
              {selected === p.id && <circle r={r + 1.6} fill="none" stroke="#8ab4ff" strokeWidth="0.5" />}
              <circle r={r} fill={p.color} opacity={owned || p.market ? 1 : 0.55} />
              {p.market && <text y={-r - 1.2} textAnchor="middle" fontSize="3">👑</text>}
              {ships > 0 && <text x={r + 0.6} y={-r + 1} fontSize="2.6">🚀{ships > 1 ? ships : ''}</text>}
              <text y={r + 3.4} textAnchor="middle" fontSize="2.6" fill="#cfd6ea">{p.name}</text>
            </g>
          </g>
        );
      })}
      <text x="-48" y="-45" fontSize="3" fill="#7f8aa8">{SYSTEM_NAME}</text>
    </svg>
  );
}

function Cost({ s, credits, parts }: { s: GameState; credits: number; parts?: Partial<Record<GoodId, number>> }) {
  return (
    <span className="cost">
      <span className={s.credits >= credits ? '' : 'short'}>{cr(credits)}</span>
      {parts && (Object.entries(parts) as [GoodId, number][]).map(([g, n]) => (
        <span key={g} className={have(s, g) >= n ? '' : 'short'}> + {n} {GOODS[g].icon} {GOODS[g].name}</span>
      ))}
    </span>
  );
}

function PlanetPanel({ s, planetId, dispatch, onPick }: { s: GameState; planetId: string; dispatch: D; onPick: (id: string) => void }) {
  const p = PLANETS.find((x) => x.id === planetId)!;
  const owned = s.ownedPlanets.includes(p.id);
  const here = s.ships.filter((sh) => sh.planetId === p.id);
  const docked = s.ships.filter((sh) => sh.planetId === null);
  return (
    <div className="stack">
      <div className="card">
        <h2><span className="dot" style={{ background: p.color }} /> {p.name} <small>{p.type}</small></h2>
        <p className="muted">{p.blurb}</p>
        {p.market ? (
          <p>The Kingdom's market planet. Sell your goods in the <b>Market</b> tab.</p>
        ) : (
          <>
            <ul className="yields">
              {(Object.entries(p.yields) as [GoodId, number][]).map(([g, r]) => (
                <li key={g}>{GOODS[g].icon} {GOODS[g].name} <small className="muted">{r}/s per drill level</small></li>
              ))}
            </ul>
            {!owned ? (
              <button className="primary" disabled={s.credits < p.rightsPrice} onClick={() => dispatch({ type: 'buyPlanet', planetId: p.id })}>
                Buy mining rights · {cr(p.rightsPrice)}
              </button>
            ) : (
              <p className="ok">✅ You own the mining rights.</p>
            )}
          </>
        )}
      </div>

      {owned && (
        <div className="card">
          <h3>Drones on {p.name}: {here.length}</h3>
          {here.map((sh) => (
            <div key={sh.id} className="row">
              <span>🚀 {SHIP_NAME} #{sh.id} <small className="muted">drill Lv {sh.drill}</small></span>
              <button onClick={() => dispatch({ type: 'deploy', shipId: sh.id, planetId: null })}>Recall</button>
            </div>
          ))}
          {docked.length > 0 ? (
            <button className="primary" onClick={() => dispatch({ type: 'deploy', shipId: docked[0].id, planetId: p.id })}>
              Send {SHIP_NAME} #{docked[0].id} here
            </button>
          ) : (
            <p className="muted">No drones in the hangar. Buy one in the Fleet tab, or recall one.</p>
          )}
        </div>
      )}

      <div className="card">
        <h3>Planets in {SYSTEM_NAME}</h3>
        {PLANETS.map((x) => (
          <button key={x.id} className={`listbtn${x.id === planetId ? ' on' : ''}`} onClick={() => onPick(x.id)}>
            <span><span className="dot" style={{ background: x.color }} /> {x.name}</span>
            <small className="muted">{x.market ? 'Market' : s.ownedPlanets.includes(x.id) ? 'Owned' : cr(x.rightsPrice)}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function FleetPanel({ s, dispatch }: { s: GameState; dispatch: D }) {
  const rate = miningRate(s);
  const hc = holdUpgradeCost(s.holdLevel);
  return (
    <div className="stack">
      <div className="card">
        <h2>Mothership</h2>
        <p>Cargo hold: <b>{Math.floor(holdUsed(s))}/{holdCapacity(s)}</b> units (Lv {s.holdLevel})</p>
        <div className="bar"><div style={{ width: `${Math.min(100, (holdUsed(s) / holdCapacity(s)) * 100)}%` }} /></div>
        <button disabled={s.credits < hc} onClick={() => dispatch({ type: 'upgradeHold' })}>Expand hold · {cr(hc)}</button>
        <h3>Mining output</h3>
        {Object.keys(rate).length === 0 ? <p className="muted">Nothing being mined. Deploy a drone to a planet you own.</p> : (
          <ul className="yields">
            {(Object.entries(rate) as [GoodId, number][]).map(([g, r]) => <li key={g}>{GOODS[g].icon} {GOODS[g].name} <b>{(r * 60).toFixed(0)}/min</b></li>)}
          </ul>
        )}
      </div>
      <div className="card">
        <h2>Drones</h2>
        {s.ships.map((sh) => {
          const up = drillUpgradeCost(sh.drill);
          const where = PLANETS.find((p) => p.id === sh.planetId)?.name ?? 'Hangar';
          return (
            <div key={sh.id} className="ship">
              <div className="row"><span>🚀 {SHIP_NAME} #{sh.id}</span><small className="muted">{where} · drill Lv {sh.drill}</small></div>
              <div className="row wrap">
                <select aria-label={`Send drone ${sh.id} to`} value={sh.planetId ?? ''} onChange={(e) => dispatch({ type: 'deploy', shipId: sh.id, planetId: e.target.value || null })}>
                  <option value="">Hangar</option>
                  {s.ownedPlanets.map((id) => <option key={id} value={id}>{PLANETS.find((p) => p.id === id)!.name}</option>)}
                </select>
                {sh.drill < MAX_DRILL_LEVEL ? (
                  <button onClick={() => dispatch({ type: 'upgradeDrill', shipId: sh.id })}>
                    Upgrade drill · <Cost s={s} credits={up.credits} parts={up.parts} />
                  </button>
                ) : <span className="ok">Max drill</span>}
              </div>
            </div>
          );
        })}
        <button className="primary" disabled={s.credits < shipCost(s)} onClick={() => dispatch({ type: 'buyShip' })}>
          Buy {SHIP_NAME} · {cr(shipCost(s))}
        </button>
      </div>
    </div>
  );
}

function CraftPanel({ s, dispatch }: { s: GameState; dispatch: D }) {
  return (
    <div className="stack">
      <div className="card">
        <h2>Fabricator</h2>
        <p className="muted">Queue up to {MAX_QUEUE} jobs. Ingredients are taken when you queue.</p>
        {s.craftQueue.length === 0 ? <p className="muted">Idle.</p> : s.craftQueue.map((j, i) => {
          const r = RECIPES.find((x) => x.id === j.recipe)!;
          return (
            <div key={i} className="job">
              <span>{GOODS[j.recipe].icon} {GOODS[j.recipe].name}</span>
              <div className="bar"><div style={{ width: `${i === 0 ? (1 - j.remaining / r.seconds) * 100 : 0}%` }} /></div>
            </div>
          );
        })}
      </div>
      <div className="card">
        <h3>Recipes</h3>
        {RECIPES.map((r) => {
          const ok = (Object.entries(r.inputs) as [GoodId, number][]).every(([g, n]) => have(s, g) >= n) && s.craftQueue.length < MAX_QUEUE;
          return (
            <div key={r.id} className="recipe">
              <div>
                <b>{GOODS[r.id].icon} {GOODS[r.id].name}</b> <small className="muted">{r.seconds}s · have {have(s, r.id)}</small>
                <div className="muted small">
                  {(Object.entries(r.inputs) as [GoodId, number][]).map(([g, n]) => (
                    <span key={g} className={have(s, g) >= n ? '' : 'short'}>{n} {GOODS[g].icon} {GOODS[g].name} </span>
                  ))}
                </div>
              </div>
              <button disabled={!ok} onClick={() => dispatch({ type: 'craft', recipe: r.id })}>Craft</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MarketPanel({ s, dispatch }: { s: GameState; dispatch: D }) {
  const goods = (Object.keys(GOODS) as GoodId[]);
  return (
    <div className="card">
      <h2>👑 Crown Colony Market</h2>
      <p className="muted">Prices drop as you flood the market and recover over time.</p>
      {goods.map((g) => {
        const n = have(s, g);
        const d = demandOf(s, g);
        return (
          <div key={g} className="market-row">
            <div>
              <b>{GOODS[g].icon} {GOODS[g].name}</b> <small className="muted">have {n}</small>
              <div className="small muted">{unitPrice(s, g)} cr each · demand {Math.round(d * 100)}%</div>
            </div>
            <div className="btns">
              <button disabled={n < 1} onClick={() => dispatch({ type: 'sell', good: g, qty: 1 })}>Sell 1</button>
              <button disabled={n < 1} onClick={() => dispatch({ type: 'sell', good: g, qty: n })} title={n ? `${cr(quoteSale(s, g, n))}` : ''}>
                All{n ? ` · ${cr(quoteSale(s, g, n))}` : ''}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KingdomPanel({ s, dispatch }: { s: GameState; dispatch: D }) {
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <div className="stack">
      <div className="card">
        <h2>👑 Royal Debt Office</h2>
        {s.freed ? (
          <p className="ok">You are a free miner! Act 1 complete. (More story coming soon.)</p>
        ) : (
          <>
            <p>You owe <b>{cr(s.debt)}</b> under your work-release contract.</p>
            <div className="row wrap">
              {[100, 1000, 5000].map((a) => (
                <button key={a} disabled={s.credits < 1} onClick={() => dispatch({ type: 'payDebt', amount: a })}>Pay {a.toLocaleString()}</button>
              ))}
              <button className="primary" disabled={s.credits < 1} onClick={() => dispatch({ type: 'payDebt', amount: s.credits })}>Pay all I can</button>
            </div>
          </>
        )}
      </div>
      <div className="card">
        <h3>Captain's log</h3>
        <ul className="log">{s.log.map((l, i) => <li key={i}>{l}</li>)}</ul>
      </div>
      <div className="card">
        <h3>Prototype tools</h3>
        <p className="muted small">Progress saves in this browser only for now. Accounts and cloud saves come next.</p>
        {confirmReset ? (
          <div className="row wrap">
            <button className="danger" onClick={() => { dispatch({ type: 'reset', now: Date.now() }); setConfirmReset(false); }}>Yes, wipe my save</button>
            <button onClick={() => setConfirmReset(false)}>Cancel</button>
          </div>
        ) : <button onClick={() => setConfirmReset(true)}>Start over</button>}
      </div>
    </div>
  );
}
