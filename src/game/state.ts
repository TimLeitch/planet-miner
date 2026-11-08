import {
  DECREES, DEMAND_DROP_PER_UNIT, DEMAND_FLOOR, DEMAND_RECOVERY_PER_SEC, GOODS, GoodId,
  HOLD_BASE, HOLD_STEP, MAX_DRILL_LEVEL, OFFLINE_CAP_SECONDS, PLANETS, RECIPES, ItemId,
  SHIP_COST, SHIP_NAME, STARTING_CREDITS, STARTING_DEBT, drillUpgradeCost, holdUpgradeCost,
} from './data';

export const SAVE_VERSION = 1;

export interface Ship {
  id: number;
  planetId: string | null; // null = docked in the mothership hangar
  drill: number;
}

export interface CraftJob {
  recipe: ItemId;
  remaining: number; // seconds
}

export interface GameState {
  version: number;
  credits: number;
  debt: number;
  freed: boolean;
  ownedPlanets: string[];
  ships: Ship[];
  nextShipId: number;
  hold: Partial<Record<GoodId, number>>;
  holdLevel: number;
  craftQueue: CraftJob[];
  demand: Partial<Record<GoodId, number>>;
  log: string[];
  lastTick: number;
  decreeIn: number; // seconds until next royal decree
}

export const MAX_QUEUE = 3;

export function newGame(now: number): GameState {
  return {
    version: SAVE_VERSION,
    credits: STARTING_CREDITS,
    debt: STARTING_DEBT,
    freed: false,
    ownedPlanets: [],
    ships: [{ id: 1, planetId: null, drill: 1 }],
    nextShipId: 2,
    hold: {},
    holdLevel: 1,
    craftQueue: [],
    demand: {},
    log: [
      'Welcome, Convict #4471. Your work-release contract is active.',
      `You owe the Kingdom ${STARTING_DEBT.toLocaleString()} credits. Mine, craft, sell, repay. Good luck!`,
    ],
    lastTick: now,
    decreeIn: 90,
  };
}

// ---------- helpers ----------

export function holdCapacity(s: GameState): number {
  return HOLD_BASE + HOLD_STEP * (s.holdLevel - 1);
}

export function holdUsed(s: GameState): number {
  return Object.values(s.hold).reduce((a, b) => a + (b ?? 0), 0);
}

export function have(s: GameState, g: GoodId): number {
  return Math.floor(s.hold[g] ?? 0);
}

export function demandOf(s: GameState, g: GoodId): number {
  return s.demand[g] ?? 1;
}

export function unitPrice(s: GameState, g: GoodId): number {
  return Math.max(1, Math.round(GOODS[g].basePrice * demandOf(s, g)));
}

/** Total credits for selling `qty` units, with price dropping per unit. */
export function quoteSale(s: GameState, g: GoodId, qty: number): number {
  let d = demandOf(s, g);
  let total = 0;
  for (let i = 0; i < qty; i++) {
    total += Math.max(1, Math.round(GOODS[g].basePrice * d));
    d = Math.max(DEMAND_FLOOR, d - DEMAND_DROP_PER_UNIT);
  }
  return total;
}

export function miningRate(s: GameState): Partial<Record<GoodId, number>> {
  const rate: Partial<Record<GoodId, number>> = {};
  for (const ship of s.ships) {
    if (!ship.planetId) continue;
    const p = PLANETS.find((x) => x.id === ship.planetId);
    if (!p) continue;
    for (const [g, r] of Object.entries(p.yields) as [GoodId, number][]) {
      rate[g] = (rate[g] ?? 0) + r * ship.drill;
    }
  }
  return rate;
}

function canAfford(s: GameState, credits: number, parts: Partial<Record<GoodId, number>>): boolean {
  if (s.credits < credits) return false;
  return (Object.entries(parts) as [GoodId, number][]).every(([g, n]) => have(s, g) >= n);
}

function spend(s: GameState, credits: number, parts: Partial<Record<GoodId, number>>) {
  s.credits -= credits;
  for (const [g, n] of Object.entries(parts) as [GoodId, number][]) s.hold[g] = (s.hold[g] ?? 0) - n;
}

function addLog(s: GameState, msg: string) {
  s.log = [msg, ...s.log].slice(0, 30);
}

// ---------- actions ----------

export type Action =
  | { type: 'tick'; now: number }
  | { type: 'buyPlanet'; planetId: string }
  | { type: 'buyShip' }
  | { type: 'deploy'; shipId: number; planetId: string | null }
  | { type: 'upgradeDrill'; shipId: number }
  | { type: 'upgradeHold' }
  | { type: 'craft'; recipe: ItemId }
  | { type: 'sell'; good: GoodId; qty: number }
  | { type: 'payDebt'; amount: number }
  | { type: 'reset'; now: number };

export function reduce(prev: GameState, a: Action): GameState {
  if (a.type === 'reset') return newGame(a.now);
  const s: GameState = structuredClone(prev);

  switch (a.type) {
    case 'tick':
      tick(s, a.now);
      return s;

    case 'buyPlanet': {
      const p = PLANETS.find((x) => x.id === a.planetId);
      if (!p || p.market || s.ownedPlanets.includes(p.id) || s.credits < p.rightsPrice) return prev;
      s.credits -= p.rightsPrice;
      s.ownedPlanets.push(p.id);
      addLog(s, `Mining rights to ${p.name} purchased. The Crown says "thank you" (reluctantly).`);
      return s;
    }

    case 'buyShip': {
      if (s.credits < shipCost(s)) return prev;
      s.credits -= shipCost(s);
      s.ships.push({ id: s.nextShipId, planetId: null, drill: 1 });
      addLog(s, `New ${SHIP_NAME} #${s.nextShipId} delivered to the hangar.`);
      s.nextShipId++;
      return s;
    }

    case 'deploy': {
      const ship = s.ships.find((x) => x.id === a.shipId);
      if (!ship) return prev;
      if (a.planetId && !s.ownedPlanets.includes(a.planetId)) return prev;
      ship.planetId = a.planetId;
      const p = PLANETS.find((x) => x.id === a.planetId);
      addLog(s, p ? `${SHIP_NAME} #${ship.id} is now drilling on ${p.name}.` : `${SHIP_NAME} #${ship.id} returned to the hangar.`);
      return s;
    }

    case 'upgradeDrill': {
      const ship = s.ships.find((x) => x.id === a.shipId);
      if (!ship || ship.drill >= MAX_DRILL_LEVEL) return prev;
      const cost = drillUpgradeCost(ship.drill);
      if (!canAfford(s, cost.credits, cost.parts)) return prev;
      spend(s, cost.credits, cost.parts);
      ship.drill++;
      addLog(s, `${SHIP_NAME} #${ship.id} drill upgraded to level ${ship.drill}.`);
      return s;
    }

    case 'upgradeHold': {
      const cost = holdUpgradeCost(s.holdLevel);
      if (s.credits < cost) return prev;
      s.credits -= cost;
      s.holdLevel++;
      addLog(s, `Cargo hold expanded to ${holdCapacity(s)} units.`);
      return s;
    }

    case 'craft': {
      const r = RECIPES.find((x) => x.id === a.recipe);
      if (!r || s.craftQueue.length >= MAX_QUEUE) return prev;
      if (!canAfford(s, 0, r.inputs)) return prev;
      spend(s, 0, r.inputs);
      s.craftQueue.push({ recipe: r.id, remaining: r.seconds });
      return s;
    }

    case 'sell': {
      const qty = Math.min(Math.floor(a.qty), have(s, a.good));
      if (qty <= 0) return prev;
      const earned = quoteSale(s, a.good, qty);
      s.credits += earned;
      s.hold[a.good] = (s.hold[a.good] ?? 0) - qty;
      s.demand[a.good] = Math.max(DEMAND_FLOOR, demandOf(s, a.good) - DEMAND_DROP_PER_UNIT * qty);
      addLog(s, `Sold ${qty} ${GOODS[a.good].name} for ${earned.toLocaleString()} cr.`);
      return s;
    }

    case 'payDebt': {
      const amt = Math.min(Math.floor(a.amount), s.credits, s.debt);
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

export function shipCost(s: GameState): number {
  return Math.round(SHIP_COST * Math.pow(1.8, s.ships.length - 1));
}

/** Advance the simulation to `now`. Mutates `s`. Offline time is capped. */
export function tick(s: GameState, now: number) {
  let dt = (now - s.lastTick) / 1000;
  s.lastTick = now;
  if (!(dt > 0)) return;
  dt = Math.min(dt, OFFLINE_CAP_SECONDS);

  // Mining, limited by hold space
  const rate = miningRate(s);
  const totalRate = Object.values(rate).reduce((a, b) => a + (b ?? 0), 0);
  if (totalRate > 0) {
    const space = Math.max(0, holdCapacity(s) - holdUsed(s));
    const scale = Math.min(1, space / (totalRate * dt));
    for (const [g, r] of Object.entries(rate) as [GoodId, number][]) {
      s.hold[g] = (s.hold[g] ?? 0) + r * dt * scale;
    }
  }

  // Crafting queue, runs one job at a time
  let t = dt;
  while (t > 0 && s.craftQueue.length) {
    const job = s.craftQueue[0];
    const used = Math.min(t, job.remaining);
    job.remaining -= used;
    t -= used;
    if (job.remaining <= 1e-9) {
      s.hold[job.recipe] = (s.hold[job.recipe] ?? 0) + 1;
      s.craftQueue.shift();
    }
  }

  // Market demand recovers
  for (const g of Object.keys(s.demand) as GoodId[]) {
    s.demand[g] = Math.min(1, demandOf(s, g) + DEMAND_RECOVERY_PER_SEC * dt);
  }

  // Funny royal decrees
  s.decreeIn -= dt;
  if (s.decreeIn <= 0) {
    addLog(s, DECREES[Math.floor(Math.random() * DECREES.length)]);
    s.decreeIn = 120 + Math.random() * 120;
  }
}

// ---------- local save (Firebase cloud saves come in milestone 2) ----------

const SAVE_KEY = 'planet-miner-save';

export function loadGame(now: number): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as GameState;
      if (s.version === SAVE_VERSION) {
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
