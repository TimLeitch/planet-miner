import {
  BASE_TRAVEL_SECONDS, DECREES, DEMAND_DROP_PER_UNIT, DEMAND_FLOOR, DEMAND_RECOVERY_PER_SEC, DRONE_NAME,
  DRONE_UPGRADES, DroneStat, EXTRACTOR_NEEDED, GOODS, GoodId, ItemId, LIKED_MULT, MODULES, ModuleId,
  OFFLINE_CAP_SECONDS, Parts, PlanetDef, RECIPES, ResourceId, STARTING_CREDITS, STARTING_DEBT, SYSTEMS,
  droneCost, droneSlotsAt, fabQueueAt, fabSpeedAt, holdCapacityAt, planetById, rankFor, rankTitle,
  scannerBonusAt, systemById, tradeBonusAt, travelSpeedAt, upgradeCost,
} from './data';

export const SAVE_VERSION = 2;

export interface Drone {
  id: number;
  name: string;
  planetId: string | null; // null = parked in the Drone Bay
  drill: number;
  hull: number;
  extractor: number;
}

export interface CraftJob { recipe: ItemId; remaining: number }

export interface Travel { to: string; remaining: number; total: number }

export interface GameState {
  version: number;
  credits: number;
  debt: number;
  freed: boolean;
  earned: number; // lifetime sales, drives rank
  location: string; // system id
  travel: Travel | null;
  visited: string[];
  modules: Record<ModuleId, number>;
  ownedPlanets: string[];
  drones: Drone[];
  nextDroneId: number;
  hold: Partial<Record<GoodId, number>>;
  craftQueue: CraftJob[];
  demand: Record<string, number>; // `${marketPlanetId}:${good}`
  log: string[];
  lastTick: number;
  decreeIn: number;
  autoSell: Partial<Record<GoodId, AutoRule>>;
  autoSellIn: number; // seconds until next auto-sell run
  autoCraft: Partial<Record<ItemId, AutoCraftRule>>;
  autoReport: { units: number; credits: number; in: number }; // batched log line
}

export interface AutoRule { on: boolean; keep: number }
/** Auto-craft: keep the Fabricator busy with this recipe until you hold `target` (0 = no limit). */
export interface AutoCraftRule { on: boolean; target: number }
export const AUTO_SELL_EVERY = 5;
const AUTO_REPORT_EVERY = 60;

const DRONE_NAMES = ['Digby', 'Rocky', 'Sir Drills-a-Lot', 'Pebbles', 'Scoop', 'Gravel Gus', 'Dusty', 'Bort', 'Clanky', 'Molly Mole'];

export function newGame(now: number): GameState {
  return {
    version: SAVE_VERSION,
    credits: STARTING_CREDITS,
    debt: STARTING_DEBT,
    freed: false,
    earned: 0,
    location: 's1',
    travel: null,
    visited: ['s1'],
    modules: { engines: 1, hold: 1, hangar: 1, fabricator: 1, scanner: 1, trade: 1 },
    ownedPlanets: [],
    drones: [{ id: 1, name: DRONE_NAMES[0], planetId: null, drill: 1, hull: 0, extractor: 0 }],
    nextDroneId: 2,
    hold: {},
    craftQueue: [],
    demand: {},
    log: [
      'Welcome, Convict #4471. Your work-release contract is active.',
      `You owe the Kingdom ${STARTING_DEBT.toLocaleString()} credits. Mine, craft, sell, repay. Good luck!`,
    ],
    lastTick: now,
    decreeIn: 90,
    autoSell: {},
    autoSellIn: AUTO_SELL_EVERY,
    autoCraft: {},
    autoReport: { units: 0, credits: 0, in: AUTO_REPORT_EVERY },
  };
}

// ---------- derived values ----------

export const holdCapacity = (s: GameState) => holdCapacityAt(s.modules.hold);
export const droneSlots = (s: GameState) => droneSlotsAt(s.modules.hangar);
export const maxQueue = (s: GameState) => fabQueueAt(s.modules.fabricator);
export const rank = (s: GameState) => rankFor(s.earned);
export const title = (s: GameState) => rankTitle(rank(s));
export const canReach = (s: GameState, systemId: string) => systemById(systemId).tier <= s.modules.engines;

export function holdUsed(s: GameState): number {
  return Object.values(s.hold).reduce((a, b) => a + (b ?? 0), 0);
}
export const have = (s: GameState, g: GoodId) => Math.floor((s.hold[g] ?? 0) + 1e-9);

/** Market planet in the system the mothership is parked at (null while travelling). */
export function currentMarket(s: GameState): PlanetDef | null {
  if (s.travel) return null;
  return (planetById(s.location === 's1' ? 'crown' : `${s.location}m`) ?? null);
}

const dkey = (m: PlanetDef, g: GoodId) => `${m.id}:${g}`;
export const demandOf = (s: GameState, m: PlanetDef, g: GoodId) => s.demand[dkey(m, g)] ?? 1;

export function priceAt(s: GameState, m: PlanetDef, g: GoodId, demand = demandOf(s, m, g)): number {
  const liked = m.market?.likes.includes(g) ? LIKED_MULT : 1;
  const mult = (m.market?.priceMult ?? 1) * liked * tradeBonusAt(s.modules.trade);
  return Math.max(1, Math.round(GOODS[g].basePrice * mult * demand));
}

export function quoteSale(s: GameState, m: PlanetDef, g: GoodId, qty: number): number {
  let d = demandOf(s, m, g);
  let total = 0;
  for (let i = 0; i < qty; i++) {
    total += priceAt(s, m, g, d);
    d = Math.max(DEMAND_FLOOR, d - DEMAND_DROP_PER_UNIT);
  }
  return total;
}

/** Which resources a drone can actually pull from a planet. */
export function droneYields(s: GameState, d: Drone, p: PlanetDef): Partial<Record<ResourceId, number>> {
  const out: Partial<Record<ResourceId, number>> = {};
  if (d.hull < p.hazard) return out;
  for (const [g, r] of Object.entries(p.yields) as [ResourceId, number][]) {
    if (d.extractor >= EXTRACTOR_NEEDED[GOODS[g].rarity!]) out[g] = r * d.drill * scannerBonusAt(s.modules.scanner);
  }
  return out;
}

export function miningRate(s: GameState): Partial<Record<GoodId, number>> {
  const rate: Partial<Record<GoodId, number>> = {};
  for (const d of s.drones) {
    const p = planetById(d.planetId);
    if (!p) continue;
    for (const [g, r] of Object.entries(droneYields(s, d, p)) as [GoodId, number][]) rate[g] = (rate[g] ?? 0) + r;
  }
  return rate;
}

export function canAfford(s: GameState, credits: number, parts: Parts): boolean {
  if (s.credits < credits) return false;
  return (Object.entries(parts) as [GoodId, number][]).every(([g, n]) => have(s, g) >= n);
}

function spend(s: GameState, credits: number, parts: Parts) {
  s.credits -= credits;
  for (const [g, n] of Object.entries(parts) as [GoodId, number][]) s.hold[g] = (s.hold[g] ?? 0) - n;
}

function addLog(s: GameState, msg: string) {
  s.log = [msg, ...s.log].slice(0, 40);
}

export const travelTime = (s: GameState, to: string) =>
  (BASE_TRAVEL_SECONDS * Math.max(1, Math.abs(systemById(to).tier - systemById(s.location).tier))) / travelSpeedAt(s.modules.engines);

// ---------- actions ----------

export type Action =
  | { type: 'tick'; now: number }
  | { type: 'travel'; to: string }
  | { type: 'buyPlanet'; planetId: string }
  | { type: 'buyDrone' }
  | { type: 'renameDrone'; droneId: number; name: string }
  | { type: 'deploy'; droneId: number; planetId: string | null }
  | { type: 'upgradeDrone'; droneId: number; stat: DroneStat }
  | { type: 'upgradeModule'; module: ModuleId }
  | { type: 'craft'; recipe: ItemId }
  | { type: 'sell'; good: GoodId; qty: number }
  | { type: 'payDebt'; amount: number }
  | { type: 'setAutoSell'; good: GoodId; on?: boolean; keep?: number }
  | { type: 'setAutoSellGroup'; goods: GoodId[]; on: boolean }
  | { type: 'setAutoCraft'; recipe: ItemId; on?: boolean; target?: number }
  | { type: 'reset'; now: number };

export function reduce(prev: GameState, a: Action): GameState {
  if (a.type === 'reset') return newGame(a.now);
  const s: GameState = structuredClone(prev);

  switch (a.type) {
    case 'tick':
      tick(s, a.now);
      return s;

    case 'travel': {
      if (s.travel || a.to === s.location || !SYSTEMS.some((x) => x.id === a.to) || !canReach(s, a.to)) return prev;
      const t = travelTime(s, a.to);
      s.travel = { to: a.to, remaining: t, total: t };
      addLog(s, `Mothership departing for ${systemById(a.to).name}. ETA ${Math.ceil(t)}s.`);
      return s;
    }

    case 'buyPlanet': {
      const p = planetById(a.planetId);
      if (!p || p.market || s.ownedPlanets.includes(p.id) || s.credits < p.rightsPrice) return prev;
      if (s.travel || p.systemId !== s.location) return prev; // must be parked in that system
      s.credits -= p.rightsPrice;
      s.ownedPlanets.push(p.id);
      addLog(s, `Mining rights to ${p.name} purchased. The Crown says "thank you" (reluctantly).`);
      return s;
    }

    case 'buyDrone': {
      const cost = droneCost(s.drones.length);
      if (s.drones.length >= droneSlots(s) || s.credits < cost) return prev;
      s.credits -= cost;
      const name = DRONE_NAMES[(s.nextDroneId - 1) % DRONE_NAMES.length] + (s.nextDroneId > DRONE_NAMES.length ? ` ${Math.ceil(s.nextDroneId / DRONE_NAMES.length)}` : '');
      s.drones.push({ id: s.nextDroneId, name, planetId: null, drill: 1, hull: 0, extractor: 0 });
      addLog(s, `New ${DRONE_NAME} "${name}" delivered to the Drone Bay.`);
      s.nextDroneId++;
      return s;
    }

    case 'renameDrone': {
      const d = s.drones.find((x) => x.id === a.droneId);
      const name = a.name.trim().slice(0, 24);
      if (!d || !name) return prev;
      d.name = name;
      return s;
    }

    case 'deploy': {
      const d = s.drones.find((x) => x.id === a.droneId);
      if (!d) return prev;
      if (a.planetId) {
        const p = planetById(a.planetId);
        if (!p || !s.ownedPlanets.includes(p.id) || d.hull < p.hazard) return prev;
      }
      d.planetId = a.planetId;
      const p = planetById(a.planetId);
      addLog(s, p ? `${d.name} is now drilling on ${p.name}.` : `${d.name} returned to the Drone Bay.`);
      return s;
    }

    case 'upgradeDrone': {
      const d = s.drones.find((x) => x.id === a.droneId);
      const u = DRONE_UPGRADES[a.stat];
      if (!d || !u || d[a.stat] >= u.max) return prev;
      const cost = upgradeCost(u, d[a.stat]);
      if (!canAfford(s, cost.credits, cost.parts)) return prev;
      spend(s, cost.credits, cost.parts);
      d[a.stat]++;
      addLog(s, `${d.name}: ${u.name} upgraded to level ${d[a.stat]}.`);
      return s;
    }

    case 'upgradeModule': {
      const u = MODULES[a.module];
      const lvl = s.modules[a.module];
      if (!u || lvl >= u.max) return prev;
      const cost = upgradeCost(u, lvl);
      if (!canAfford(s, cost.credits, cost.parts)) return prev;
      spend(s, cost.credits, cost.parts);
      s.modules[a.module]++;
      addLog(s, `Mothership ${u.name} upgraded to level ${lvl + 1}: ${u.effect(lvl + 1)}.`);
      return s;
    }

    case 'craft': {
      const r = RECIPES.find((x) => x.id === a.recipe);
      if (!r || s.craftQueue.length >= maxQueue(s) || !canAfford(s, 0, r.inputs)) return prev;
      spend(s, 0, r.inputs);
      s.craftQueue.push({ recipe: r.id, remaining: r.seconds });
      return s;
    }

    case 'sell': {
      const m = currentMarket(s);
      const qty = Math.min(Math.floor(a.qty), have(s, a.good));
      if (!m || qty <= 0) return prev;
      const earned = sellGood(s, m, a.good, qty);
      addLog(s, `Sold ${qty} ${GOODS[a.good].name} at ${m.name} for ${earned.toLocaleString()} cr.`);
      return s;
    }

    case 'setAutoSell': {
      const cur = s.autoSell[a.good] ?? { on: false, keep: 0 };
      s.autoSell[a.good] = {
        on: a.on ?? cur.on,
        keep: a.keep === undefined ? cur.keep : Math.max(0, Math.floor(a.keep) || 0),
      };
      return s;
    }

    case 'setAutoCraft': {
      const cur = s.autoCraft[a.recipe] ?? { on: false, target: 0 };
      s.autoCraft[a.recipe] = {
        on: a.on ?? cur.on,
        target: a.target === undefined ? cur.target : Math.max(0, Math.floor(a.target) || 0),
      };
      if (s.autoCraft[a.recipe]!.on) runAutoCraft(s);
      return s;
    }

    case 'setAutoSellGroup': {
      for (const g of a.goods) s.autoSell[g] = { on: a.on, keep: s.autoSell[g]?.keep ?? 0 };
      return s;
    }

    case 'payDebt': {
      const amt = Math.min(Math.floor(a.amount), Math.floor(s.credits), s.debt);
      if (amt <= 0) return prev;
      s.credits -= amt;
      s.debt -= amt;
      addLog(s, `Paid ${amt.toLocaleString()} cr to the Kingdom. ${s.debt.toLocaleString()} cr to go.`);
      if (s.debt === 0 && !s.freed) {
        s.freed = true;
        addLog(s, '🎉 DEBT CLEARED! You are a free miner. The Crown is... mildly impressed.');
      }
      return s;
    }
  }
}

/** Sell from the hold at market `m`. Mutates `s`, returns credits earned. */
function sellGood(s: GameState, m: PlanetDef, g: GoodId, qty: number): number {
  const earned = quoteSale(s, m, g, qty);
  const before = rank(s);
  s.credits += earned;
  s.earned += earned;
  s.hold[g] = (s.hold[g] ?? 0) - qty;
  s.demand[dkey(m, g)] = Math.max(DEMAND_FLOOR, demandOf(s, m, g) - DEMAND_DROP_PER_UNIT * qty);
  if (rank(s) > before) addLog(s, `⭐ Rank up! You are now rank ${rank(s)}: ${title(s)}.`);
  return earned;
}

/** Sell everything above each rule's keep amount at the current market. */
export function runAutoSell(s: GameState) {
  const m = currentMarket(s);
  if (!m) return; // in transit: wait until we arrive
  for (const [g, rule] of Object.entries(s.autoSell) as [GoodId, AutoRule][]) {
    if (!rule?.on) continue;
    const qty = have(s, g) - rule.keep;
    if (qty <= 0) continue;
    s.autoReport.credits += sellGood(s, m, g, qty);
    s.autoReport.units += qty;
  }
}

/** How many of `g` are free to use: what you hold minus the auto-sell "keep" reserve. */
const spare = (s: GameState, g: GoodId) => have(s, g) - (s.autoSell[g]?.on ? s.autoSell[g]!.keep : 0);

/** Fill free Fabricator slots from auto-craft rules, taking turns between recipes. */
export function runAutoCraft(s: GameState) {
  const rules = [...RECIPES].reverse().filter((r) => s.autoCraft[r.id]?.on);
  if (!rules.length) return;
  let queued = true;
  while (queued && s.craftQueue.length < maxQueue(s)) {
    queued = false;
    for (const r of rules) {
      if (s.craftQueue.length >= maxQueue(s)) break;
      const target = s.autoCraft[r.id]!.target;
      const pending = s.craftQueue.filter((j) => j.recipe === r.id).length;
      if (target > 0 && have(s, r.id) + pending >= target) continue;
      const ok = (Object.entries(r.inputs) as [GoodId, number][]).every(([g, n]) => spare(s, g) >= n);
      if (!ok) continue;
      spend(s, 0, r.inputs);
      s.craftQueue.push({ recipe: r.id, remaining: r.seconds });
      queued = true;
    }
  }
}

/** Advance the simulation to `now`. Mutates `s`. Offline time is capped. */
export function tick(s: GameState, now: number) {
  let dt = (now - s.lastTick) / 1000;
  s.lastTick = now;
  if (!(dt > 0)) return;
  dt = Math.min(dt, OFFLINE_CAP_SECONDS);
  // Long gaps (offline time) run in small steps so auto-craft and auto-sell keep up
  while (dt > 0) {
    const d = Math.min(dt, AUTO_SELL_EVERY);
    step(s, d);
    dt -= d;
  }
}

function step(s: GameState, dt: number) {
  runAutoCraft(s);

  // Mining, limited by hold space
  const rate = miningRate(s);
  const totalRate = Object.values(rate).reduce((a, b) => a + (b ?? 0), 0);
  if (totalRate > 0) {
    const space = Math.max(0, holdCapacity(s) - holdUsed(s));
    const scale = Math.min(1, space / (totalRate * dt));
    for (const [g, r] of Object.entries(rate) as [GoodId, number][]) s.hold[g] = (s.hold[g] ?? 0) + r * dt * scale;
  }

  // Crafting queue, one job at a time
  let t = dt * fabSpeedAt(s.modules.fabricator);
  while (t > 0 && s.craftQueue.length) {
    const job = s.craftQueue[0];
    const used = Math.min(t, job.remaining);
    job.remaining -= used;
    t -= used;
    if (job.remaining <= 1e-9) {
      s.hold[job.recipe] = (s.hold[job.recipe] ?? 0) + 1;
      s.craftQueue.shift();
      runAutoCraft(s);
    }
  }

  // Travel
  if (s.travel) {
    s.travel.remaining -= dt;
    if (s.travel.remaining <= 0) {
      s.location = s.travel.to;
      s.travel = null;
      const sys = systemById(s.location);
      const first = !s.visited.includes(sys.id);
      if (first) s.visited.push(sys.id);
      addLog(s, `Arrived at ${sys.name}.${first ? ' New system discovered!' : ''}`);
    }
  }

  // Market demand recovers
  for (const k of Object.keys(s.demand)) s.demand[k] = Math.min(1, s.demand[k] + DEMAND_RECOVERY_PER_SEC * dt);

  // Auto-sell
  s.autoSellIn -= dt;
  if (s.autoSellIn <= 0) {
    runAutoSell(s);
    s.autoSellIn = AUTO_SELL_EVERY;
  }
  s.autoReport.in -= dt;
  if (s.autoReport.in <= 0) {
    if (s.autoReport.units > 0) {
      addLog(s, `🤖 Auto-sell: ${s.autoReport.units.toLocaleString()} units sold for ${s.autoReport.credits.toLocaleString()} cr.`);
    }
    s.autoReport = { units: 0, credits: 0, in: AUTO_REPORT_EVERY };
  }

  // Royal decrees
  s.decreeIn -= dt;
  if (s.decreeIn <= 0) {
    addLog(s, DECREES[Math.floor(Math.random() * DECREES.length)]);
    s.decreeIn = 120 + Math.random() * 120;
  }
}

// ---------- saves (local for now; Firebase cloud saves come in milestone 2) ----------

const SAVE_KEY = 'planet-miner-save';

interface V1Save {
  version: 1; credits: number; debt: number; freed: boolean; ownedPlanets: string[];
  ships: { id: number; planetId: string | null; drill: number }[]; nextShipId: number;
  hold: Partial<Record<GoodId, number>>; holdLevel: number; craftQueue: CraftJob[];
  demand: Partial<Record<GoodId, number>>; log: string[]; lastTick: number; decreeIn: number;
}

export function migrate(raw: unknown, now: number): GameState | null {
  const v = raw as { version?: number };
  if (v?.version === SAVE_VERSION) {
    const s = raw as GameState;
    s.autoSell ??= {};
    s.autoSellIn ??= AUTO_SELL_EVERY;
    s.autoCraft ??= {};
    s.autoReport ??= { units: 0, credits: 0, in: AUTO_REPORT_EVERY };
    return s;
  }
  if (v?.version === 1) {
    const o = raw as V1Save;
    const s = newGame(o.lastTick ?? now);
    Object.assign(s, {
      credits: o.credits, debt: o.debt, freed: o.freed, ownedPlanets: o.ownedPlanets, hold: o.hold,
      craftQueue: o.craftQueue, log: ['🚀 The galaxy just got a lot bigger! Check the Galaxy map.', ...o.log].slice(0, 40),
      lastTick: o.lastTick, decreeIn: o.decreeIn, nextDroneId: o.nextShipId,
    });
    s.modules.hold = Math.min(10, o.holdLevel);
    s.drones = o.ships.map((sh, i) => ({
      id: sh.id, name: DRONE_NAMES[i % DRONE_NAMES.length], planetId: sh.planetId, drill: sh.drill, hull: 0, extractor: 0,
    }));
    s.modules.hangar = Math.min(8, Math.max(1, s.drones.length - 1));
    for (const [g, d] of Object.entries(o.demand ?? {})) s.demand[`crown:${g}`] = d as number;
    return s;
  }
  return null;
}

export function loadGame(now: number): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const s = migrate(JSON.parse(raw), now);
      if (s) {
        const before = { ...s.hold };
        tick(s, now);
        const gained = (Object.keys(s.hold) as GoodId[])
          .map((g) => [g, Math.floor((s.hold[g] ?? 0) - (before[g] ?? 0))] as const)
          .filter(([, n]) => n > 0);
        if (gained.length) {
          addLog(s, `While you were away your drones mined: ${gained.map(([g, n]) => `${n} ${GOODS[g].name}`).join(', ')}.`);
        }
        return s;
      }
    }
  } catch {
    /* corrupt or unavailable storage: start fresh */
  }
  return newGame(now);
}

export function saveGame(s: GameState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable (private mode etc.) */
  }
}
