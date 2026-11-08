import { describe, expect, it } from 'vitest';
import { OFFLINE_CAP_SECONDS, STARTING_CREDITS, STARTING_DEBT } from './data';
import { holdCapacity, holdUsed, have, newGame, quoteSale, reduce, GameState } from './state';

const T0 = 1_000_000;
const at = (s: GameState, seconds: number) => reduce(s, { type: 'tick', now: s.lastTick + seconds * 1000 });

describe('core loop', () => {
  it('buys a planet, deploys a drone and mines', () => {
    let s = newGame(T0);
    s = reduce(s, { type: 'buyPlanet', planetId: 'rustball' });
    expect(s.ownedPlanets).toContain('rustball');
    expect(s.credits).toBe(STARTING_CREDITS - 300);

    s = reduce(s, { type: 'deploy', shipId: 1, planetId: 'rustball' });
    s = at(s, 10);
    expect(have(s, 'iron')).toBe(5);
    expect(have(s, 'carbon')).toBe(2);
  });

  it('cannot deploy to a planet you do not own', () => {
    const s = newGame(T0);
    expect(reduce(s, { type: 'deploy', shipId: 1, planetId: 'frostbite' })).toBe(s);
  });

  it('cannot buy what you cannot afford', () => {
    const s = newGame(T0);
    expect(reduce(s, { type: 'buyPlanet', planetId: 'coppertop' })).toBe(s);
  });

  it('stops mining when the hold is full', () => {
    let s = newGame(T0);
    s = reduce(s, { type: 'buyPlanet', planetId: 'rustball' });
    s = reduce(s, { type: 'deploy', shipId: 1, planetId: 'rustball' });
    s = at(s, 100_000);
    expect(holdUsed(s)).toBeCloseTo(holdCapacity(s), 5);
  });

  it('caps offline progress', () => {
    let s = newGame(T0);
    s = reduce(s, { type: 'buyPlanet', planetId: 'rustball' });
    s = reduce(s, { type: 'upgradeHold' });
    s = { ...s, holdLevel: 1000 };
    s = reduce(s, { type: 'deploy', shipId: 1, planetId: 'rustball' });
    s = at(s, OFFLINE_CAP_SECONDS * 3);
    expect(have(s, 'iron')).toBe(Math.floor(0.5 * OFFLINE_CAP_SECONDS));
  });

  it('crafts items over time', () => {
    let s = newGame(T0);
    s = { ...s, hold: { iron: 6, carbon: 2 } };
    s = reduce(s, { type: 'craft', recipe: 'steel' });
    s = reduce(s, { type: 'craft', recipe: 'steel' });
    expect(have(s, 'iron')).toBe(0);
    s = at(s, 6);
    expect(have(s, 'steel')).toBe(1);
    s = at(s, 5);
    expect(have(s, 'steel')).toBe(2);
    expect(s.craftQueue).toHaveLength(0);
  });

  it('selling lowers the price and demand recovers', () => {
    let s = newGame(T0);
    s = { ...s, hold: { steel: 50 } };
    const first10 = quoteSale(s, 'steel', 10);
    s = reduce(s, { type: 'sell', good: 'steel', qty: 10 });
    expect(s.credits).toBe(STARTING_CREDITS + first10);
    expect(quoteSale(s, 'steel', 10)).toBeLessThan(first10);
    s = at(s, 3600);
    expect(quoteSale(s, 'steel', 10)).toBe(first10);
  });

  it('paying off the debt frees the player', () => {
    let s = newGame(T0);
    s = { ...s, credits: STARTING_DEBT + 10 };
    s = reduce(s, { type: 'payDebt', amount: 999_999 });
    expect(s.debt).toBe(0);
    expect(s.freed).toBe(true);
    expect(s.credits).toBe(10);
  });
});
