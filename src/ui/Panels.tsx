import { useState } from 'react';
import {
  DRONE_STATS, DRONE_UPGRADES, EXTRACTOR_NEEDED, GOODS, GoodId, ITEM_IDS, MODULES, MODULE_IDS, RARITY_NAME, RECIPES,
  RESOURCE_IDS, ResourceId, SYSTEMS, droneCost, earningsForRank, planetById, planetsIn, systemById,
} from '../game/data';
import {
  GameState, canReach, currentMarket, demandOf, droneSlots, droneYields, have, holdCapacity, holdUsed, maxQueue,
  miningRate, priceAt, quoteSale, rank, title, travelTime,
} from '../game/state';
import { D, UpgradeRow, cr, perMin } from './common';

// ---------- Planet / system ----------

export function PlanetPanel({ s, systemId, planetId, dispatch, onPickPlanet, onDrones }: {
  s: GameState; systemId: string; planetId: string | null; dispatch: D; onPickPlanet: (id: string) => void; onDrones: () => void;
}) {
  const sys = systemById(systemId);
  const here = !s.travel && s.location === systemId;
  const reachable = canReach(s, systemId);
  const p = planetById(planetId);
  const showPlanet = p && p.systemId === systemId ? p : null;

  return (
    <div className="stack">
      <div className="card">
        <h2><span className="dot" style={{ background: sys.color }} /> {sys.name} <small>Tier {sys.tier}</small></h2>
        {here ? <p className="ok">🚀 Your mothership is parked here.</p>
          : s.travel?.to === systemId ? <p>🚀 En route… {Math.ceil(s.travel.remaining)}s</p>
          : !reachable ? <p className="muted">🔒 Your engines can't reach this far. Upgrade <b>Engines to level {sys.tier}</b> in the Ship tab.</p>
          : (
            <button className="primary" disabled={!!s.travel} onClick={() => dispatch({ type: 'travel', to: systemId })}>
              {s.travel ? 'Already travelling' : `Travel here · ${Math.ceil(travelTime(s, systemId))}s`}
            </button>
          )}
      </div>

      {showPlanet && (
        <div className="card">
          <h2><span className="dot" style={{ background: showPlanet.color }} /> {showPlanet.name} <small>{showPlanet.type}</small></h2>
          <p className="muted">{showPlanet.blurb}</p>
          {showPlanet.market ? (
            <p>The Kingdom's market for this system. Pays {Math.round((showPlanet.market.priceMult - 1) * 100)}% extra, and
              loves {showPlanet.market.likes.map((g) => `${GOODS[g].icon} ${GOODS[g].name}`).join(', ')}. Sell in the <b>Market</b> tab while parked here.</p>
          ) : (
            <PlanetDetails s={s} planetId={showPlanet.id} here={here} dispatch={dispatch} onDrones={onDrones} />
          )}
        </div>
      )}

      <div className="card">
        <h3>Places in {sys.name}</h3>
        {planetsIn(systemId).map((x) => (
          <button key={x.id} className={`listbtn${x.id === planetId ? ' on' : ''}`} onClick={() => onPickPlanet(x.id)}>
            <span><span className="dot" style={{ background: x.color }} /> {x.name} {x.hazard > 0 && <small>⚠️{x.hazard}</small>}</span>
            <small className="muted">{x.market ? '👑 Market' : s.ownedPlanets.includes(x.id) ? '✅ Owned' : cr(x.rightsPrice)}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function PlanetDetails({ s, planetId, here, dispatch, onDrones }: { s: GameState; planetId: string; here: boolean; dispatch: D; onDrones: () => void }) {
  const p = planetById(planetId)!;
  const owned = s.ownedPlanets.includes(p.id);
  const on = s.drones.filter((d) => d.planetId === p.id);
  const parked = s.drones.filter((d) => d.planetId === null);
  const able = parked.filter((d) => d.hull >= p.hazard);
  return (
    <>
      <ul className="yields">
        {(Object.entries(p.yields) as [ResourceId, number][]).map(([g, r]) => {
          const need = EXTRACTOR_NEEDED[GOODS[g].rarity!];
          return (
            <li key={g}>{GOODS[g].icon} {GOODS[g].name} <small className="muted">{perMin(r)}/min per drill level · {RARITY_NAME[GOODS[g].rarity!]}{need ? ` · needs Extractor ${need}` : ''}</small></li>
          );
        })}
      </ul>
      {p.hazard > 0 && <p className="warn-text">⚠️ Hazard level {p.hazard}: drones need Hull {p.hazard}+ to land.</p>}
      {!owned ? (
        here ? (
          <button className="primary" disabled={s.credits < p.rightsPrice} onClick={() => dispatch({ type: 'buyPlanet', planetId: p.id })}>
            Buy mining rights · {cr(p.rightsPrice)}
          </button>
        ) : <p className="muted">Mining rights: {cr(p.rightsPrice)}. Park your mothership in this system to buy.</p>
      ) : (
        <>
          <p className="ok">✅ You own the mining rights.</p>
          <h3>Drones here: {on.length}</h3>
          {on.map((d) => {
            const y = droneYields(s, d, p);
            return (
              <div key={d.id} className="row">
                <span>🛸 {d.name} <small className="muted">{Object.entries(y).map(([g, r]) => `${GOODS[g as GoodId].icon}${perMin(r!)}/m`).join(' ') || 'nothing it can mine'}</small></span>
                <button onClick={() => dispatch({ type: 'deploy', droneId: d.id, planetId: null })}>Recall</button>
              </div>
            );
          })}
          {able.length > 0 ? (
            <button className="primary" onClick={() => dispatch({ type: 'deploy', droneId: able[0].id, planetId: p.id })}>Send {able[0].name} here</button>
          ) : (
            <p className="muted small">{parked.length ? `Parked drones need Hull ${p.hazard} for this planet.` : 'No drones parked in the Drone Bay.'} <button className="link" onClick={onDrones}>Open Drone Bay</button></p>
          )}
        </>
      )}
    </>
  );
}

// ---------- Mothership ----------

export function ShipPanel({ s, dispatch }: { s: GameState; dispatch: D }) {
  const goods = (Object.keys(GOODS) as GoodId[]).filter((g) => have(s, g) > 0);
  const rate = miningRate(s);
  return (
    <div className="stack">
      <div className="card hero">
        <div className="hero-ship" aria-hidden>🚀</div>
        <div>
          <h2>Your Mothership</h2>
          <p className="small muted">
            {s.travel ? `In transit to ${systemById(s.travel.to).name} · ${Math.ceil(s.travel.remaining)}s` : `Parked at ${systemById(s.location).name}`}
          </p>
          {s.travel && <div className="bar"><div style={{ width: `${(1 - s.travel.remaining / s.travel.total) * 100}%` }} /></div>}
        </div>
      </div>
      <div className="card">
        <h3>Modules</h3>
        <div className="grid2">
          {MODULE_IDS.map((m) => (
            <UpgradeRow key={m} s={s} u={MODULES[m]} level={s.modules[m]} onUpgrade={() => dispatch({ type: 'upgradeModule', module: m })} />
          ))}
        </div>
      </div>
      <div className="card">
        <h3>📦 Cargo {Math.floor(holdUsed(s)).toLocaleString()}/{holdCapacity(s).toLocaleString()}</h3>
        <div className="bar"><div style={{ width: `${Math.min(100, (holdUsed(s) / holdCapacity(s)) * 100)}%` }} /></div>
        {goods.length === 0 ? <p className="muted">Empty. Your drones will fill it.</p> : (
          <div className="chips">{goods.map((g) => <span key={g} className="chip">{GOODS[g].icon} {GOODS[g].name} <b>{have(s, g)}</b>{rate[g] ? <small className="muted"> +{perMin(rate[g]!)}/m</small> : null}</span>)}</div>
        )}
      </div>
    </div>
  );
}

// ---------- Drone Bay ----------

export function DronesPanel({ s, dispatch }: { s: GameState; dispatch: D }) {
  const [open, setOpen] = useState<number | null>(s.drones[0]?.id ?? null);
  const [renaming, setRenaming] = useState<number | null>(null);
  const cost = droneCost(s.drones.length);
  const full = s.drones.length >= droneSlots(s);
  return (
    <div className="stack">
      <div className="card">
        <h2>🛸 Drone Bay <small>{s.drones.length}/{droneSlots(s)} slots</small></h2>
        <p className="small muted">Tap a drone to see its upgrades. Drones keep mining wherever you send them, even while your mothership travels.</p>
        <button className="primary" disabled={full || s.credits < cost} onClick={() => dispatch({ type: 'buyDrone' })}>
          {full ? 'Bay full: upgrade Drone Bay in the Ship tab' : `Buy a drone · ${cr(cost)}`}
        </button>
      </div>
      {s.drones.map((d) => {
        const p = planetById(d.planetId);
        const y = p ? droneYields(s, d, p) : {};
        const isOpen = open === d.id;
        return (
          <div key={d.id} className={`card drone${isOpen ? ' open' : ''}`}>
            <button className="drone-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : d.id)}>
              <span className="drone-ico">🛸</span>
              <span className="drone-title">
                <b>{d.name}</b>
                <small className="muted">⛏️{d.drill} 🛡️{d.hull} 🧲{d.extractor} · {p ? `${p.name} (${systemById(p.systemId).name})` : 'Parked'}</small>
                <small>{Object.entries(y).map(([g, r]) => `${GOODS[g as GoodId].icon} ${perMin(r!)}/min`).join('  ')}</small>
              </span>
              <span className="chev">{isOpen ? '▾' : '▸'}</span>
            </button>
            {isOpen && (
              <div className="stack">
                <div className="row wrap">
                  <label className="small muted" htmlFor={`dest-${d.id}`}>Assignment</label>
                  <select id={`dest-${d.id}`} value={d.planetId ?? ''} onChange={(e) => dispatch({ type: 'deploy', droneId: d.id, planetId: e.target.value || null })}>
                    <option value="">Parked in Drone Bay</option>
                    {SYSTEMS.map((sys) => {
                      const ps = s.ownedPlanets.map((id) => planetById(id)!).filter((x) => x.systemId === sys.id);
                      if (!ps.length) return null;
                      return (
                        <optgroup key={sys.id} label={sys.name}>
                          {ps.map((x) => <option key={x.id} value={x.id} disabled={d.hull < x.hazard}>{x.name}{x.hazard ? ` ⚠️${x.hazard}` : ''}{d.hull < x.hazard ? ' (hull too weak)' : ''}</option>)}
                        </optgroup>
                      );
                    })}
                  </select>
                  {renaming === d.id ? (
                    <form className="row" onSubmit={(e) => { e.preventDefault(); const v = new FormData(e.currentTarget).get('n') as string; dispatch({ type: 'renameDrone', droneId: d.id, name: v }); setRenaming(null); }}>
                      <input name="n" defaultValue={d.name} maxLength={24} autoFocus aria-label="Drone name" />
                      <button type="submit">Save</button>
                    </form>
                  ) : <button onClick={() => setRenaming(d.id)}>Rename</button>}
                </div>
                {DRONE_STATS.map((st) => (
                  <UpgradeRow key={st} s={s} u={DRONE_UPGRADES[st]} level={d[st]} onUpgrade={() => dispatch({ type: 'upgradeDrone', droneId: d.id, stat: st })} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------- Fabricator ----------

export function CraftPanel({ s, dispatch }: { s: GameState; dispatch: D }) {
  const q = maxQueue(s);
  return (
    <div className="stack">
      <div className="card">
        <h2>🛠️ Fabricator <small>Lv {s.modules.fabricator}</small></h2>
        <p className="muted small">Queue up to {q} jobs. Ingredients are taken when you queue.</p>
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
          const ok = (Object.entries(r.inputs) as [GoodId, number][]).every(([g, n]) => have(s, g) >= n) && s.craftQueue.length < q;
          return (
            <div key={r.id} className="recipe">
              <div>
                <b>{GOODS[r.id].icon} {GOODS[r.id].name}</b> <small className="muted">{r.seconds}s · have {have(s, r.id)}</small>
                <div className="small muted">
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

// ---------- Market ----------

export function MarketPanel({ s, dispatch, onGalaxy }: { s: GameState; dispatch: D; onGalaxy: () => void }) {
  const m = currentMarket(s);
  if (!m) return <div className="card"><h2>💰 Market</h2><p className="muted">You're in transit. Markets open when you arrive.</p></div>;
  const all = [...RESOURCE_IDS, ...ITEM_IDS] as GoodId[];
  const sorted = [...all].sort((a, b) => Number(have(s, b) > 0) - Number(have(s, a) > 0));
  return (
    <div className="card">
      <h2>👑 {m.name}</h2>
      <p className="muted small">Pays {Math.round((m.market!.priceMult - 1) * 100)}% extra here. ⭐ = this market loves it (+40%). Prices drop as you flood the market and recover over time. Other systems pay different prices. <button className="link" onClick={onGalaxy}>Galaxy map</button></p>
      {sorted.map((g) => {
        const n = have(s, g);
        const liked = m.market!.likes.includes(g);
        return (
          <div key={g} className={`market-row${n ? '' : ' dim'}`}>
            <div>
              <b>{GOODS[g].icon} {GOODS[g].name}{liked ? ' ⭐' : ''}</b> <small className="muted">have {n}</small>
              <div className="small muted">{priceAt(s, m, g)} cr each · demand {Math.round(demandOf(s, m, g) * 100)}%</div>
            </div>
            <div className="btns">
              <button disabled={n < 1} onClick={() => dispatch({ type: 'sell', good: g, qty: 1 })}>Sell 1</button>
              <button disabled={n < 1} onClick={() => dispatch({ type: 'sell', good: g, qty: n })}>All{n ? ` · ${cr(quoteSale(s, m, g, n))}` : ''}</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Kingdom ----------

export function KingdomPanel({ s, dispatch }: { s: GameState; dispatch: D }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const r = rank(s);
  const lo = earningsForRank(r);
  const hi = earningsForRank(Math.min(100, r + 1));
  return (
    <div className="stack">
      <div className="card">
        <h2>⭐ Rank {r}/100 <small>{title(s)}</small></h2>
        {r < 100 ? (
          <>
            <div className="bar"><div style={{ width: `${((s.earned - lo) / Math.max(1, hi - lo)) * 100}%` }} /></div>
            <p className="small muted">Lifetime sales {cr(s.earned)} · next rank at {cr(hi)}</p>
          </>
        ) : <p className="ok">Maximum rank. The Crown is nervous about you.</p>}
      </div>
      <div className="card">
        <h2>👑 Royal Debt Office</h2>
        {s.freed ? <p className="ok">You are a free miner! Act 1 complete. (More story coming soon.)</p> : (
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

