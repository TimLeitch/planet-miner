// Balance data for the first prototype. Names are placeholders until the
// design doc settles them (see docs/GAME_DESIGN.md §2.2, §7, §8).

export type ResourceId = 'iron' | 'carbon' | 'ice' | 'silica' | 'copper';
export type ItemId = 'steel' | 'circuit' | 'water' | 'machinePart' | 'lifeSupport';
export type GoodId = ResourceId | ItemId;

export interface GoodDef {
  id: GoodId;
  name: string;
  icon: string;
  basePrice: number; // what Crown Colony pays at full demand
  blurb: string;
}

export const GOODS: Record<GoodId, GoodDef> = {
  iron: { id: 'iron', name: 'Iron', icon: '🪨', basePrice: 4, blurb: 'Heavy, reliable, and smells faintly of pennies.' },
  carbon: { id: 'carbon', name: 'Carbon', icon: '⚫', basePrice: 3, blurb: 'Technically diamonds, given enough patience.' },
  ice: { id: 'ice', name: 'Ice', icon: '🧊', basePrice: 2, blurb: 'Space ice. Do not put it in your drink.' },
  silica: { id: 'silica', name: 'Silica', icon: '⏳', basePrice: 3, blurb: 'Sand with ambition.' },
  copper: { id: 'copper', name: 'Copper', icon: '🟠', basePrice: 6, blurb: 'Shiny now. Green later.' },
  steel: { id: 'steel', name: 'Steel Plate', icon: '🔩', basePrice: 16, blurb: 'Iron that went to finishing school.' },
  circuit: { id: 'circuit', name: 'Circuit', icon: '🔌', basePrice: 22, blurb: 'Thinks very small thoughts, very quickly.' },
  water: { id: 'water', name: 'Water', icon: '💧', basePrice: 7, blurb: 'Melted space ice. Now you may drink it.' },
  machinePart: { id: 'machinePart', name: 'Machine Part', icon: '⚙️', basePrice: 60, blurb: 'Nobody knows what it does, but everyone needs one.' },
  lifeSupport: { id: 'lifeSupport', name: 'Life Support Pack', icon: '🫁', basePrice: 30, blurb: 'Breathing: now in convenient pack form.' },
};

export interface PlanetDef {
  id: string;
  name: string;
  type: string;
  color: string;
  size: number; // relative draw size
  orbit: number; // relative orbit radius 0..1
  rightsPrice: number; // cost to buy mining rights from the Kingdom
  yields: Partial<Record<ResourceId, number>>; // units per second per drill level
  market?: boolean; // inhabited planet with a market
  blurb: string;
}

export const SYSTEM_NAME = 'Probation Sector';

export const PLANETS: PlanetDef[] = [
  {
    id: 'rustball', name: 'Rustball', type: 'Rocky', color: '#c0643c', size: 26, orbit: 0.35,
    rightsPrice: 300, yields: { iron: 0.5, carbon: 0.25 },
    blurb: 'A planet-sized scrapyard. The Kingdom calls it "rustic".',
  },
  {
    id: 'frostbite', name: 'Frostbite', type: 'Ice', color: '#8fd3ff', size: 22, orbit: 0.55,
    rightsPrice: 800, yields: { ice: 0.6, silica: 0.2 },
    blurb: 'Bring a scarf. Bring three.',
  },
  {
    id: 'coppertop', name: 'Coppertop', type: 'Desert', color: '#e0a85a', size: 30, orbit: 0.75,
    rightsPrice: 2500, yields: { copper: 0.35, silica: 0.3 },
    blurb: 'Dunes of copper sand. Very bright. Wear sunglasses.',
  },
  {
    id: 'crown', name: 'Crown Colony', type: 'Inhabited', color: '#b28dff', size: 34, orbit: 0.95,
    rightsPrice: 0, yields: {}, market: true,
    blurb: 'The Kingdom\'s local outpost. Buys everything, taxes everything else.',
  },
];

export interface RecipeDef {
  id: ItemId;
  inputs: Partial<Record<GoodId, number>>;
  seconds: number;
}

export const RECIPES: RecipeDef[] = [
  { id: 'water', inputs: { ice: 3 }, seconds: 3 },
  { id: 'steel', inputs: { iron: 3, carbon: 1 }, seconds: 5 },
  { id: 'circuit', inputs: { copper: 2, silica: 2 }, seconds: 6 },
  { id: 'lifeSupport', inputs: { water: 2, carbon: 2 }, seconds: 8 },
  { id: 'machinePart', inputs: { steel: 2, circuit: 1 }, seconds: 12 },
];

export const SHIP_NAME = 'Scout Drone';
export const SHIP_COST = 150;
export const MAX_DRILL_LEVEL = 5;

/** Cost to go from `level` to `level + 1`. */
export function drillUpgradeCost(level: number): { credits: number; parts: Partial<Record<GoodId, number>> } {
  const credits = Math.round(120 * Math.pow(2.2, level - 1));
  const parts: Partial<Record<GoodId, number>> =
    level >= 3 ? { machinePart: level - 2 } : level >= 2 ? { steel: 3 } : {};
  return { credits, parts };
}

export const HOLD_BASE = 200;
export const HOLD_STEP = 150;
export function holdUpgradeCost(level: number): number {
  return Math.round(250 * Math.pow(1.9, level - 1));
}

export const STARTING_CREDITS = 500;
export const STARTING_DEBT = 25000;
export const OFFLINE_CAP_SECONDS = 8 * 60 * 60;

// Market: each unit sold knocks the price down; demand recovers over time.
export const DEMAND_DROP_PER_UNIT = 0.01;
export const DEMAND_FLOOR = 0.3;
export const DEMAND_RECOVERY_PER_SEC = 0.002;

export const DECREES = [
  'By Royal Decree: all asteroids must be addressed as "sir".',
  'By Royal Decree: mining on Tuesdays now requires a Tuesday Permit.',
  'By Royal Decree: the Crown thanks you for your continued debt.',
  'By Royal Decree: smiling in the Probation Sector is taxed at 2%.',
  'By Royal Decree: your debt has been reviewed and found to be "large".',
  'By Royal Decree: the Royal Accountant has requested more spreadsheets.',
];
