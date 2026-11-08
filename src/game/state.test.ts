import { describe, expect, it } from 'vitest';
import {
  GOODS, MODULES, OFFLINE_CAP_SECONDS, PLANETS, RECIPES, STARTING_CREDITS, STARTING_DEBT, SYSTEMS,
  earningsForRank, planetsIn, rankFor, upgradeCost,
} from './data';
import {
  GameState, currentMarket, have, holdCapacity, holdUsed, migrate, newGame, quoteSale, reduce,
} from './state';

const T0 = 1_000_000;
const at = (s: GameState, seconds: number) => reduce(s, { type: 'tick', now: s.lastTick + seconds * 1000 });

describe('galaxy data', () => {
  it('has 10 systems and 100 places, one market per system', () => {
    expect(SYSTEMS).toHaveLength(10);
    expect(PLANETS).toHaveLength(100);
    for (const sys of SYSTEMS) {
      expect(planetsIn(sys.id)).toHaveLength(10);
      expect(planetsIn(sys.id).filter((p) => p.market)).toHaveLength(1);
    }
    expect(new Set(PLANETS.map((p) => p.id)).size).toBe(100);
    expect(new Set(PLANETS.map((p) => p.name)).size).toBe(100);
  });

  it('only places resources in systems where they are allowed', () => {
    for (const p of PLANETS) {
      const tier = SYSTEMS.find((s) => s.id === p.systemId)!.tier;
      for (const g of Object.keys(p.yields)) expect(GOODS[g as keyof typeof GOODS].minTier!).toBeLessThanOrEqual(tier);
      if (!p.market) expect(Object.keys(p.yields).length).toBeGreaterThan(0);
    }
  });

  it('every recipe input exists', () => {
    for (const r of RECIPES) for (const g of Object.keys(r.inputs)) expect(GOODS[g as keyof typeof GOODS]).toBeDefined();
  });

  it('rank goes 1 to 100', () => {
    expect(rankFor(0)).toBe(1);
    expect(rankFor(earningsForRank(50))).toBe(50);
    expect(rankFor(1e12)).toBe(100);
  });
});

describe('core loop', () => {
  it('buys a planet, deploys a drone and mines', () => {
    let s = newGame(T0);
    s = reduce(s, { type: 'buyPlanet', planetId: 'rustball' });
    expect(s.ownedPlanets).toContain('rustball');
    expect(s.credits).toBe(STARTING_CREDITS - 300);
    s = reduce(s, { type: 'deploy', droneId: 1, planetId: 'rustball' });
    s = at(s, 10);
    expect(have(s, 'iron')).toBe(5);
    expect(have(s, 'carbon')).toBe(2);
  });

  it('cannot buy planets in another system or deploy to unowned ones', () => {
    const s = { ...newGame(T0), credits: 1e9 };
    const far = PLANETS.find((p) => p.systemId === 's2' && !p.market)!;
    expect(reduce(s, { type: 'buyPlanet', planetId: far.id })).toBe(s);
    expect(reduce(s, { type: 'deploy', droneId: 1, planetId: 'frostbite' })).toBe(s);
  });

  it('stops mining when the hold is full and caps offline time', () => {
    let s = newGame(T0);
    s = reduce(s, { type: 'buyPlanet', planetId: 'rustball' });
    s = reduce(s, { type: 'deploy', droneId: 1, planetId: 'rustball' });
    s = at(s, OFFLINE_CAP_SECONDS * 3);
    expect(holdUsed(s)).toBeCloseTo(holdCapacity(s), 5);
  });

  it('crafts items over time', () => {
    let s: GameState = { ...newGame(T0), hold: { iron: 6, carbon: 2 } };
    s = reduce(s, { type: 'craft', recipe: 'steel' });
    s = reduce(s, { type: 'craft', recipe: 'steel' });
    expect(have(s, 'iron')).toBe(0);
    s = at(s, 6);
    expect(have(s, 'steel')).toBe(1);
    s = at(s, 5);
    expect(have(s, 'steel')).toBe(2);
  });

  it('selling lowers the price, demand recovers, and earnings raise rank', () => {
    let s: GameState = { ...newGame(T0), hold: { steel: 200 } };
    const m = currentMarket(s)!;
    const first10 = quoteSale(s, m, 'steel', 10);
    s = reduce(s, { type: 'sell', good: 'steel', qty: 10 });
    expect(s.credits).toBe(STARTING_CREDITS + first10);
    expect(quoteSale(s, m, 'steel', 10)).toBeLessThan(first10);
    s = at(s, 3600);
    expect(quoteSale(s, m, 'steel', 10)).toBe(first10);
    s = reduce(s, { type: 'sell', good: 'steel', qty: 190 });
    expect(s.earned).toBeGreaterThan(0);
  });

  it('paying off the debt frees the player', () => {
    let s: GameState = { ...newGame(T0), credits: STARTING_DEBT + 10 };
    s = reduce(s, { type: 'payDebt', amount: 999_999 });
    expect(s.debt).toBe(0);
    expect(s.freed).toBe(true);
  });
});

describe('mothership, drones and travel', () => {
  it('engines gate travel, and travel takes time', () => {
    let s: GameState = { ...newGame(T0), credits: 1e9, hold: { steel: 100 } };
    expect(reduce(s, { type: 'travel', to: 's2' })).toBe(s);
    s = reduce(s, { type: 'upgradeModule', module: 'engines' });
    expect(s.modules.engines).toBe(2);
    s = reduce(s, { type: 'travel', to: 's2' });
    expect(s.travel).not.toBeNull();
    expect(currentMarket(s)).toBeNull();
    s = at(s, 60);
    expect(s.location).toBe('s2');
    expect(s.visited).toContain('s2');
  });

  it('module upgrades cost credits and parts', () => {
    const c = upgradeCost(MODULES.engines, 3);
    expect(c.credits).toBeGreaterThan(upgradeCost(MODULES.engines, 2).credits);
    expect(c.parts.steel).toBe(4);
    let s: GameState = { ...newGame(T0), credits: c.credits, modules: { ...newGame(T0).modules, engines: 3 } };
    expect(reduce(s, { type: 'upgradeModule', module: 'engines' })).toBe(s); // no steel
    s = { ...s, hold: { steel: 4 } };
    s = reduce(s, { type: 'upgradeModule', module: 'engines' });
    expect(s.modules.engines).toBe(4);
    expect(have(s, 'steel')).toBe(0);
  });

  it('drone bay limits drones; hull gates hazards; extractor gates rare resources', () => {
    let s: GameState = { ...newGame(T0), credits: 1e9, hold: { steel: 50, alloy: 50 } };
    s = reduce(s, { type: 'buyDrone' });
    expect(s.drones).toHaveLength(2);
    expect(reduce(s, { type: 'buyDrone' })).toBe(s); // bay full
    const hazardous = PLANETS.find((p) => p.hazard >= 1)!;
    s = { ...s, ownedPlanets: [hazardous.id] };
    expect(reduce(s, { type: 'deploy', droneId: 1, planetId: hazardous.id })).toBe(s);
    for (let i = 0; i < hazardous.hazard; i++) s = reduce(s, { type: 'upgradeDrone', droneId: 1, stat: 'hull' });
    s = reduce(s, { type: 'deploy', droneId: 1, planetId: hazardous.id });
    expect(s.drones[0].planetId).toBe(hazardous.id);

    const rare = PLANETS.find((p) => Object.keys(p.yields).some((g) => GOODS[g as keyof typeof GOODS].rarity === 3))!;
    const rareGood = Object.keys(rare.yields).find((g) => GOODS[g as keyof typeof GOODS].rarity === 3)! as keyof typeof GOODS;
    s = { ...s, ownedPlanets: [rare.id], drones: [{ ...s.drones[0], hull: 5, planetId: rare.id }] };
    s = at(s, 100);
    expect(have(s, rareGood)).toBe(0);
    s = reduce(s, { type: 'upgradeDrone', droneId: 1, stat: 'extractor' });
    expect(s.drones[0].extractor).toBe(1);
    s = at(s, 100);
    expect(have(s, rareGood)).toBeGreaterThan(0);
  });

  it('migrates a version 1 save', () => {
    const v1 = {
      version: 1, credits: 1234, debt: 20000, freed: false, ownedPlanets: ['rustball'],
      ships: [{ id: 1, planetId: 'rustball', drill: 3 }, { id: 2, planetId: null, drill: 1 }], nextShipId: 3,
      hold: { iron: 10 }, holdLevel: 2, craftQueue: [], demand: { iron: 0.5 }, log: ['old'], lastTick: T0, decreeIn: 50,
    };
    const s = migrate(v1, T0)!;
    expect(s.version).toBe(2);
    expect(s.credits).toBe(1234);
    expect(s.drones).toHaveLength(2);
    expect(s.drones[0].drill).toBe(3);
    expect(s.modules.hold).toBe(2);
    expect(s.demand['crown:iron']).toBe(0.5);
    expect(s.drones.length).toBeLessThanOrEqual(s.modules.hangar + 1);
  });
});

describe('auto-sell', () => {
  it('sells everything above the keep amount every few seconds', () => {
    let s: GameState = { ...newGame(T0), hold: { iron: 50, carbon: 20 } };
    s = reduce(s, { type: 'setAutoSell', good: 'iron', on: true, keep: 10 });
    s = at(s, 6);
    expect(have(s, 'iron')).toBe(10);
    expect(have(s, 'carbon')).toBe(20); // not enabled
    expect(s.credits).toBeGreaterThan(STARTING_CREDITS);
    expect(s.earned).toBe(s.credits - STARTING_CREDITS);
  });

  it('keeps selling mined resources while away and logs a summary', () => {
    let s = newGame(T0);
    s = reduce(s, { type: 'buyPlanet', planetId: 'rustball' });
    s = reduce(s, { type: 'deploy', droneId: 1, planetId: 'rustball' });
    s = reduce(s, { type: 'setAutoSellGroup', goods: ['iron', 'carbon'], on: true });
    for (let i = 0; i < 24; i++) s = at(s, 5); // two minutes of play
    expect(have(s, 'iron')).toBeLessThan(5);
    expect(s.earned).toBeGreaterThan(0);
    expect(s.log.some((l) => l.includes('Auto-sell'))).toBe(true);
  });

  it('waits while the mothership is in transit', () => {
    let s: GameState = { ...newGame(T0), credits: 1e6, hold: { steel: 10, iron: 30 } };
    s = reduce(s, { type: 'upgradeModule', module: 'engines' });
    s = reduce(s, { type: 'setAutoSell', good: 'iron', on: true });
    s = reduce(s, { type: 'travel', to: 's2' });
    const credits = s.credits;
    s = at(s, 5.5);
    expect(s.travel).not.toBeNull();
    expect(have(s, 'iron')).toBe(30);
    expect(s.credits).toBe(credits);
  });

  it('turning a rule off stops it', () => {
    let s: GameState = { ...newGame(T0), hold: { iron: 50 } };
    s = reduce(s, { type: 'setAutoSell', good: 'iron', on: true, keep: 5 });
    s = reduce(s, { type: 'setAutoSell', good: 'iron', on: false });
    expect(s.autoSell.iron).toEqual({ on: false, keep: 5 });
    s = at(s, 10);
    expect(have(s, 'iron')).toBe(50);
  });
});

describe('auto-craft', () => {
  it('keeps the fabricator busy and stops at the target', () => {
    let s: GameState = { ...newGame(T0), hold: { iron: 30, carbon: 10 } };
    s = reduce(s, { type: 'setAutoCraft', recipe: 'steel', on: true, target: 4 });
    expect(s.craftQueue).toHaveLength(3); // queued straight away
    s = at(s, 60);
    expect(have(s, 'steel')).toBe(4);
    expect(have(s, 'iron')).toBe(18);
    expect(s.craftQueue).toHaveLength(0);
  });

  it('works offline in steps and feeds auto-sell', () => {
    let s: GameState = { ...newGame(T0), credits: 1000 };
    s = reduce(s, { type: 'buyPlanet', planetId: 'frostbite' });
    s = reduce(s, { type: 'deploy', droneId: 1, planetId: 'frostbite' });
    expect(s.drones[0].planetId).toBe('frostbite');
    s = reduce(s, { type: 'setAutoCraft', recipe: 'water', on: true });
    s = reduce(s, { type: 'setAutoSellGroup', goods: ['water', 'silica'], on: true });
    s = at(s, 3600); // an hour away
    expect(s.earned).toBeGreaterThan(0);
    expect(have(s, 'water')).toBe(0);
    expect(have(s, 'ice')).toBeLessThan(10); // ice was turned into water, not left piling up
  });

  it('does not use materials reserved by an auto-sell keep amount', () => {
    let s: GameState = { ...newGame(T0), hold: { steel: 5, circuit: 5 } };
    s = reduce(s, { type: 'setAutoSell', good: 'steel', on: true, keep: 5 });
    s = reduce(s, { type: 'setAutoCraft', recipe: 'machinePart', on: true });
    expect(s.craftQueue).toHaveLength(0);
    expect(have(s, 'steel')).toBe(5);
  });

  it('turning it off stops new jobs', () => {
    let s: GameState = { ...newGame(T0), hold: { ice: 30 } };
    s = reduce(s, { type: 'setAutoCraft', recipe: 'water', on: true });
    s = reduce(s, { type: 'setAutoCraft', recipe: 'water', on: false });
    s = at(s, 30);
    expect(have(s, 'water')).toBe(3); // only the 3 already queued
    expect(s.autoCraft.water).toEqual({ on: false, target: 0 });
  });
});
