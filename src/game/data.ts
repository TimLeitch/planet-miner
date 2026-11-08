// Balance and world data. Names are placeholders until the design doc
// settles them (docs/GAME_DESIGN.md §2.2, §7, §8).

// ---------- goods ----------

export type ResourceId =
  | 'iron' | 'carbon' | 'ice' | 'silica' | 'copper'
  | 'titanium' | 'helium3'
  | 'platinum' | 'crystal'
  | 'exotic';
export type ItemId =
  | 'water' | 'steel' | 'circuit' | 'lifeSupport' | 'machinePart'
  | 'alloy' | 'fuelCell' | 'processor' | 'crystalLens' | 'droneCore'
  | 'royalTrinket' | 'warpCoil';
export type GoodId = ResourceId | ItemId;
export type Parts = Partial<Record<GoodId, number>>;

/** 1 common, 2 uncommon, 3 rare, 4 legendary */
export type Rarity = 1 | 2 | 3 | 4;
export const RARITY_NAME: Record<Rarity, string> = { 1: 'Common', 2: 'Uncommon', 3: 'Rare', 4: 'Legendary' };
/** Drone extractor level needed to mine a resource of this rarity. */
export const EXTRACTOR_NEEDED: Record<Rarity, number> = { 1: 0, 2: 0, 3: 1, 4: 2 };

export interface GoodDef {
  id: GoodId;
  name: string;
  icon: string;
  basePrice: number;
  blurb: string;
  rarity?: Rarity; // resources only
  minTier?: number; // first star-system tier where it can be found
}

export const GOODS: Record<GoodId, GoodDef> = {
  iron: { id: 'iron', name: 'Iron', icon: '🪨', basePrice: 4, rarity: 1, minTier: 1, blurb: 'Heavy, reliable, and smells faintly of pennies.' },
  carbon: { id: 'carbon', name: 'Carbon', icon: '⚫', basePrice: 3, rarity: 1, minTier: 1, blurb: 'Technically diamonds, given enough patience.' },
  ice: { id: 'ice', name: 'Ice', icon: '🧊', basePrice: 2, rarity: 1, minTier: 1, blurb: 'Space ice. Do not put it in your drink.' },
  silica: { id: 'silica', name: 'Silica', icon: '⏳', basePrice: 3, rarity: 1, minTier: 1, blurb: 'Sand with ambition.' },
  copper: { id: 'copper', name: 'Copper', icon: '🟠', basePrice: 6, rarity: 1, minTier: 1, blurb: 'Shiny now. Green later.' },
  titanium: { id: 'titanium', name: 'Titanium', icon: '🔷', basePrice: 14, rarity: 2, minTier: 3, blurb: 'Light, strong, and very smug about it.' },
  helium3: { id: 'helium3', name: 'Helium-3', icon: '🎈', basePrice: 12, rarity: 2, minTier: 3, blurb: 'Makes engines go and voices squeaky.' },
  platinum: { id: 'platinum', name: 'Platinum', icon: '💿', basePrice: 38, rarity: 3, minTier: 5, blurb: 'The Duke has a platinum toilet. Allegedly.' },
  crystal: { id: 'crystal', name: 'Sky Crystal', icon: '💎', basePrice: 34, rarity: 3, minTier: 5, blurb: 'Hums a little tune when nobody is listening.' },
  exotic: { id: 'exotic', name: 'Quantum Fluff', icon: '☁️', basePrice: 120, rarity: 4, minTier: 8, blurb: 'Exists and does not exist. Very soft either way.' },

  water: { id: 'water', name: 'Water', icon: '💧', basePrice: 8, blurb: 'Melted space ice. Now you may drink it.' },
  steel: { id: 'steel', name: 'Steel Plate', icon: '🔩', basePrice: 20, blurb: 'Iron that went to finishing school.' },
  circuit: { id: 'circuit', name: 'Circuit', icon: '🔌', basePrice: 26, blurb: 'Thinks very small thoughts, very quickly.' },
  lifeSupport: { id: 'lifeSupport', name: 'Life Support Pack', icon: '🫁', basePrice: 38, blurb: 'Breathing: now in convenient pack form.' },
  machinePart: { id: 'machinePart', name: 'Machine Part', icon: '⚙️', basePrice: 95, blurb: 'Nobody knows what it does, but everyone needs one.' },
  alloy: { id: 'alloy', name: 'Ti-Steel Alloy', icon: '🛡️', basePrice: 70, blurb: 'Steel, but make it fancy.' },
  fuelCell: { id: 'fuelCell', name: 'Fuel Cell', icon: '🔋', basePrice: 50, blurb: 'Keep away from open flames and open mouths.' },
  processor: { id: 'processor', name: 'Processor', icon: '🧠', basePrice: 130, blurb: 'Smarter than most Royal Advisors. Low bar.' },
  crystalLens: { id: 'crystalLens', name: 'Crystal Lens', icon: '🔍', basePrice: 115, blurb: 'Sees through rocks, walls and lies.' },
  droneCore: { id: 'droneCore', name: 'Drone Core', icon: '🤖', basePrice: 330, blurb: 'The beating heart of a very determined drone.' },
  royalTrinket: { id: 'royalTrinket', name: 'Royal Trinket', icon: '👑', basePrice: 125, blurb: 'Completely useless. Nobles adore them.' },
  warpCoil: { id: 'warpCoil', name: 'Warp Coil', icon: '🌀', basePrice: 720, blurb: 'Folds space. Please fold it back afterwards.' },
};

export const RESOURCE_IDS = (Object.keys(GOODS) as GoodId[]).filter((g) => GOODS[g].rarity) as ResourceId[];
export const ITEM_IDS = (Object.keys(GOODS) as GoodId[]).filter((g) => !GOODS[g].rarity) as ItemId[];

// ---------- recipes ----------

export interface RecipeDef { id: ItemId; inputs: Parts; seconds: number }

export const RECIPES: RecipeDef[] = [
  { id: 'water', inputs: { ice: 3 }, seconds: 3 },
  { id: 'steel', inputs: { iron: 3, carbon: 1 }, seconds: 5 },
  { id: 'circuit', inputs: { copper: 2, silica: 2 }, seconds: 6 },
  { id: 'lifeSupport', inputs: { water: 2, carbon: 2 }, seconds: 8 },
  { id: 'machinePart', inputs: { steel: 2, circuit: 1 }, seconds: 12 },
  { id: 'alloy', inputs: { titanium: 2, steel: 1 }, seconds: 10 },
  { id: 'fuelCell', inputs: { helium3: 2, water: 1 }, seconds: 10 },
  { id: 'processor', inputs: { platinum: 1, circuit: 2 }, seconds: 15 },
  { id: 'crystalLens', inputs: { crystal: 2, silica: 2 }, seconds: 14 },
  { id: 'royalTrinket', inputs: { platinum: 1, crystal: 1 }, seconds: 20 },
  { id: 'droneCore', inputs: { processor: 1, alloy: 2 }, seconds: 25 },
  { id: 'warpCoil', inputs: { exotic: 2, crystalLens: 1, fuelCell: 2 }, seconds: 40 },
];

// ---------- upgrades ----------

/** [fromLevel, good, countPerLevel]: from this level on, each upgrade also needs parts. */
type Ladder = [number, GoodId, number][];

export interface UpgradeDef {
  id: string;
  name: string;
  icon: string;
  blurb: string;
  start: number;
  max: number;
  baseCost: number;
  growth: number;
  ladder: Ladder;
  effect: (level: number) => string;
}

/** Cost to go from `level` to `level + 1`. */
export function upgradeCost(u: UpgradeDef, level: number): { credits: number; parts: Parts } {
  const step = level - u.start; // 0 for the first upgrade
  const credits = Math.round(u.baseCost * Math.pow(u.growth, step));
  const parts: Parts = {};
  for (const [from, g, n] of u.ladder) {
    if (level >= from) parts[g] = (parts[g] ?? 0) + n * (level - from + 1);
  }
  return { credits, parts };
}

export type ModuleId = 'engines' | 'hold' | 'hangar' | 'fabricator' | 'scanner' | 'trade';

export const holdCapacityAt = (l: number) => Math.round(200 * Math.pow(l, 1.3));
export const droneSlotsAt = (l: number) => l + 1;
export const fabQueueAt = (l: number) => l + 2;
export const fabSpeedAt = (l: number) => 1 + 0.25 * (l - 1);
export const scannerBonusAt = (l: number) => 1 + 0.1 * (l - 1);
export const tradeBonusAt = (l: number) => 1 + 0.05 * (l - 1);
export const travelSpeedAt = (l: number) => 1 + 0.2 * (l - 1);

export const MODULES: Record<ModuleId, UpgradeDef> = {
  engines: {
    id: 'engines', name: 'Engines', icon: '🔥', start: 1, max: 10, baseCost: 600, growth: 2.1,
    ladder: [[2, 'steel', 2], [4, 'alloy', 1], [6, 'fuelCell', 1], [7, 'processor', 1], [9, 'warpCoil', 1]],
    blurb: 'Bigger engines reach further star systems. Royal speed limits are "suggestions".',
    effect: (l) => `Reach systems up to tier ${l} · travel ×${travelSpeedAt(l).toFixed(1)}`,
  },
  hold: {
    id: 'hold', name: 'Cargo Hold', icon: '📦', start: 1, max: 10, baseCost: 250, growth: 1.9,
    ladder: [[3, 'steel', 2], [6, 'alloy', 1]],
    blurb: 'Where your rocks live. Mining stops when it is full.',
    effect: (l) => `${holdCapacityAt(l).toLocaleString()} units`,
  },
  hangar: {
    id: 'hangar', name: 'Drone Bay', icon: '🛸', start: 1, max: 8, baseCost: 300, growth: 2.3,
    ladder: [[2, 'machinePart', 1], [5, 'droneCore', 1]],
    blurb: 'More parking spaces for more drones.',
    effect: (l) => `${droneSlotsAt(l)} drone slots`,
  },
  fabricator: {
    id: 'fabricator', name: 'Fabricator', icon: '🛠️', start: 1, max: 6, baseCost: 400, growth: 2.4,
    ladder: [[2, 'circuit', 2], [4, 'processor', 1]],
    blurb: 'Turns rocks into things. Slightly warm to the touch.',
    effect: (l) => `${fabQueueAt(l)} job queue · speed ×${fabSpeedAt(l).toFixed(2)}`,
  },
  scanner: {
    id: 'scanner', name: 'Survey Scanner', icon: '📡', start: 1, max: 6, baseCost: 500, growth: 2.5,
    ladder: [[2, 'circuit', 1], [4, 'crystalLens', 1]],
    blurb: 'Points drones at the good bits.',
    effect: (l) => `Mining +${Math.round((scannerBonusAt(l) - 1) * 100)}%`,
  },
  trade: {
    id: 'trade', name: 'Trade Computer', icon: '📈', start: 1, max: 6, baseCost: 500, growth: 2.5,
    ladder: [[2, 'circuit', 1], [4, 'processor', 1]],
    blurb: 'Haggles on your behalf. Very rude, very effective.',
    effect: (l) => `Sell prices +${Math.round((tradeBonusAt(l) - 1) * 100)}%`,
  },
};
export const MODULE_IDS = Object.keys(MODULES) as ModuleId[];

export type DroneStat = 'drill' | 'hull' | 'extractor';

export const DRONE_UPGRADES: Record<DroneStat, UpgradeDef> = {
  drill: {
    id: 'drill', name: 'Drill', icon: '⛏️', start: 1, max: 10, baseCost: 120, growth: 1.9,
    ladder: [[2, 'steel', 1], [4, 'machinePart', 1], [7, 'droneCore', 1]],
    blurb: 'Faster digging.',
    effect: (l) => `Mining ×${l}`,
  },
  hull: {
    id: 'hull', name: 'Hull', icon: '🛡️', start: 0, max: 5, baseCost: 300, growth: 2.4,
    ladder: [[0, 'steel', 2], [1, 'alloy', 1], [3, 'processor', 1]],
    blurb: 'Survive hazardous planets (lava, storms, angry moss).',
    effect: (l) => `Hazard level up to ${l}`,
  },
  extractor: {
    id: 'extractor', name: 'Extractor', icon: '🧲', start: 0, max: 2, baseCost: 2000, growth: 4,
    ladder: [[0, 'alloy', 2], [1, 'processor', 2]],
    blurb: 'Pulls rare and legendary resources out of the ground.',
    effect: (l) => (l === 0 ? 'Common & uncommon only' : l === 1 ? 'Can mine Rare' : 'Can mine Legendary'),
  },
};
export const DRONE_STATS = Object.keys(DRONE_UPGRADES) as DroneStat[];

export const DRONE_NAME = 'Drone';
export const DRONE_BASE_COST = 150;
export const droneCost = (owned: number) => Math.round(DRONE_BASE_COST * Math.pow(1.8, owned - 1));

// ---------- galaxy ----------

export interface SystemDef {
  id: string;
  tier: number;
  name: string;
  x: number; // galaxy map position, -50..50
  y: number;
  color: string;
}

export interface PlanetDef {
  id: string;
  systemId: string;
  name: string;
  type: string;
  color: string;
  size: number;
  orbit: number; // 0..1
  phase: number; // starting angle
  rightsPrice: number;
  yields: Partial<Record<ResourceId, number>>; // units/sec per drill level
  hazard: number; // drone hull needed
  market?: { likes: GoodId[]; priceMult: number };
  blurb: string;
}

const SYSTEM_SPECS: [string, string, number, number, string][] = [
  ['Probation Sector', 'Crown Colony', -38, 36, '#ffcf6b'],
  ['Parole Belt', 'Parole Office Station', -36, 12, '#9fe0ff'],
  ["Bureaucrat's Reach", 'Form 27B Outpost', -36, -12, '#c6a0ff'],
  ['The Taxing Expanse', 'Tax Haven Prime', -18, -32, '#7be0a5'],
  ["Duke's Doldrums", "Duke's Duty-Free", 4, -20, '#ff9f7a'],
  ['Velvet Rope Nebula', 'VIP Lounge Orbital', -8, 6, '#ff7bd5'],
  ['Crown Jewel Cluster', 'Jewel Exchange', 8, 30, '#7bd3ff'],
  ['The Moat Void', 'Drawbridge Depot', 32, 18, '#a0b4ff'],
  ['Throne Room Rim', "Courtier's Bazaar", 26, -6, '#ffd76b'],
  ['The Royal Backyard', 'The Royal Gift Shop', 38, -30, '#ff6b6b'],
];

export const SYSTEMS: SystemDef[] = SYSTEM_SPECS.map(([name, , x, y, color], i) => ({
  id: `s${i + 1}`, tier: i + 1, name, x, y, color,
}));

const PLANET_TYPES: { type: string; colors: string[]; pool: ResourceId[]; blurbs: string[] }[] = [
  { type: 'Rocky', colors: ['#c0643c', '#a0785a', '#8c6c5c'], pool: ['iron', 'carbon', 'titanium', 'platinum'],
    blurbs: ['Mostly rocks. Some of them valuable.', 'The locals are pebbles. They do not mind.', 'Looks like a potato. Mines like a dream.'] },
  { type: 'Ice', colors: ['#8fd3ff', '#bfe7ff', '#9fc4e8'], pool: ['ice', 'silica', 'helium3', 'crystal'],
    blurbs: ['Bring a scarf. Bring three.', 'So cold the echoes freeze.', 'A giant snow cone. No flavour, sadly.'] },
  { type: 'Desert', colors: ['#e0a85a', '#d9b26b', '#c99a50'], pool: ['copper', 'silica', 'titanium', 'crystal'],
    blurbs: ['Sand everywhere. Even in the sandwiches.', 'Very bright. Wear sunglasses.', 'Dunes shaped like rude gestures.'] },
  { type: 'Volcanic', colors: ['#e0503c', '#b8402c', '#ff7a3c'], pool: ['iron', 'carbon', 'platinum', 'exotic'],
    blurbs: ['The floor is lava. Literally.', 'Smells like burnt toast, forever.', 'Hot enough to cook eggs. And drones.'] },
  { type: 'Gas Giant', colors: ['#d6b48c', '#b39ddb', '#90caf9'], pool: ['helium3', 'ice', 'exotic'],
    blurbs: ['Big, puffy, and full of itself.', 'Mining clouds is harder than it sounds.', 'Rumoured to be a very large balloon.'] },
  { type: 'Ocean', colors: ['#3c8ce0', '#2c6cb8', '#4cb8c8'], pool: ['ice', 'carbon', 'crystal', 'copper'],
    blurbs: ['Wet. Extremely wet.', 'The fish here have opinions.', 'Surf is up. So are the drones.'] },
  { type: 'Swamp', colors: ['#6c9c5c', '#5c8c4c', '#7caa6c'], pool: ['carbon', 'ice', 'copper', 'titanium'],
    blurbs: ['Squelchy. Mind the moss, it bites.', 'Smells like old socks. Rich in minerals though.', 'The frogs here pay taxes too.'] },
];

const NAME_A = ['Grum', 'Blor', 'Zib', 'Krunk', 'Mop', 'Fizz', 'Wob', 'Snor', 'Plim', 'Glub', 'Dor', 'Quib', 'Yon', 'Bap', 'Zorp', 'Nub', 'Tov', 'Grib', 'Snib', 'Pud', 'Flor', 'Skib', 'Lum', 'Hob'];
const NAME_B = ['ble', 'ton', 'ix', 'ula', 'orp', 'bus', 'ania', 'ock', 'o', 'eep', 'ax', 'umph', 'ington', 'oid', 'wick', 'zel'];
const NAME_C = ['', '', '', ' Prime', ' Minor', ' II', ' IV', ' Major', ' Junior'];

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const orbitAt = (k: number) => 0.2 + k * 0.085;
const phaseAt = (k: number, tier: number) => tier * 1.1 + k * 2.39996; // golden angle keeps planets apart

const RARITY_YIELD: Record<Rarity, number> = { 1: 0.5, 2: 0.3, 3: 0.15, 4: 0.06 };

function buildPlanets(): PlanetDef[] {
  const r = rng(4471);
  const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)];
  const used = new Set<string>();
  const out: PlanetDef[] = [];

  // Hand-made starter planets (ids kept for old saves)
  out.push(
    { id: 'rustball', systemId: 's1', name: 'Rustball', type: 'Rocky', color: '#c0643c', size: 26, orbit: orbitAt(0), phase: phaseAt(0, 1),
      rightsPrice: 300, yields: { iron: 0.5, carbon: 0.25 }, hazard: 0, blurb: 'A planet-sized scrapyard. The Kingdom calls it "rustic".' },
    { id: 'frostbite', systemId: 's1', name: 'Frostbite', type: 'Ice', color: '#8fd3ff', size: 22, orbit: orbitAt(1), phase: phaseAt(1, 1),
      rightsPrice: 800, yields: { ice: 0.6, silica: 0.2 }, hazard: 0, blurb: 'Bring a scarf. Bring three.' },
    { id: 'coppertop', systemId: 's1', name: 'Coppertop', type: 'Desert', color: '#e0a85a', size: 30, orbit: orbitAt(2), phase: phaseAt(2, 1),
      rightsPrice: 2500, yields: { copper: 0.35, silica: 0.3 }, hazard: 0, blurb: 'Dunes of copper sand. Very bright. Wear sunglasses.' },
  );
  ['Rustball', 'Frostbite', 'Coppertop'].forEach((n) => used.add(n));

  SYSTEM_SPECS.forEach(([, marketName], i) => {
    const tier = i + 1;
    const sys = `s${tier}`;
    // 9 mining planets + 1 market per system (s1 has 3 hand-made ones)
    for (let k = tier === 1 ? 3 : 0; k < 9; k++) {
      const t = pick(PLANET_TYPES);
      let pool = t.pool.filter((g) => (GOODS[g].minTier ?? 1) <= tier);
      if (!pool.length) pool = ['iron'];
      const nRes = Math.min(pool.length, 1 + Math.floor(r() * 3));
      const shuffled = [...pool].sort(() => r() - 0.5).slice(0, nRes);
      const yields: Partial<Record<ResourceId, number>> = {};
      for (const g of shuffled) {
        const base = RARITY_YIELD[GOODS[g].rarity!] * (1 + 0.15 * (tier - 1)) * (0.7 + r() * 0.6);
        yields[g] = Math.round(base * 100) / 100 || 0.01;
      }
      const best = Math.max(...shuffled.map((g) => GOODS[g].rarity!));
      const hazard = tier <= 2 ? 0 : Math.min(5, Math.floor(r() * (Math.floor(tier / 2) + 1)) + (t.type === 'Volcanic' ? 1 : 0));
      let name = '';
      do name = pick(NAME_A) + pick(NAME_B) + pick(NAME_C); while (used.has(name));
      used.add(name);
      out.push({
        id: `${sys}p${k}`, systemId: sys, name, type: t.type, color: pick(t.colors),
        size: 16 + Math.floor(r() * 18), orbit: orbitAt(k), phase: phaseAt(k, tier),
        rightsPrice: Math.round((250 * Math.pow(1.75, tier - 1) * (0.8 + r() * 0.5) * (1 + 0.3 * (best - 1))) / 10) * 10,
        yields, hazard, blurb: pick(t.blurbs),
      });
    }
    const likes = [...ITEM_IDS].sort(() => r() - 0.5).slice(0, 3);
    out.push({
      id: tier === 1 ? 'crown' : `${sys}m`, systemId: sys, name: marketName, type: 'Kingdom Market', color: '#b28dff',
      size: 34, orbit: 0.98, phase: phaseAt(9, tier), rightsPrice: 0, yields: {}, hazard: 0,
      market: { likes, priceMult: 1 + 0.05 * (tier - 1) },
      blurb: 'A Kingdom outpost. Buys everything, taxes everything else.',
    });
  });
  return out;
}

export const PLANETS: PlanetDef[] = buildPlanets();
export const planetById = (id: string | null | undefined) => PLANETS.find((p) => p.id === id);
export const systemById = (id: string) => SYSTEMS.find((s) => s.id === id)!;
export const planetsIn = (systemId: string) => PLANETS.filter((p) => p.systemId === systemId);
export const marketOf = (systemId: string) => PLANETS.find((p) => p.systemId === systemId && p.market)!;

// ---------- economy ----------

export const STARTING_CREDITS = 500;
export const STARTING_DEBT = 25000;
export const OFFLINE_CAP_SECONDS = 8 * 60 * 60;
export const LIKED_MULT = 1.4;

export const DEMAND_DROP_PER_UNIT = 0.01;
export const DEMAND_FLOOR = 0.3;
export const DEMAND_RECOVERY_PER_SEC = 0.002;

export const BASE_TRAVEL_SECONDS = 8;

// ---------- rank 1..100 ----------

export const MAX_RANK = 100;
export const earningsForRank = (rank: number) => Math.round(150 * Math.pow(rank - 1, 2.1));
export function rankFor(earned: number): number {
  let r = 1;
  while (r < MAX_RANK && earned >= earningsForRank(r + 1)) r++;
  return r;
}
const RANK_TITLES = ['Convict', 'Parolee', 'Rock Licker', 'Dirt Merchant', 'Prospector', 'Ore Baron', 'Asteroid Aristocrat', 'Planet Tycoon', 'Galactic Magnate', 'Royal Pain'];
export const rankTitle = (rank: number) => RANK_TITLES[Math.min(9, Math.floor((rank - 1) / 10))];

export const DECREES = [
  'By Royal Decree: all asteroids must be addressed as "sir".',
  'By Royal Decree: mining on Tuesdays now requires a Tuesday Permit.',
  'By Royal Decree: the Crown thanks you for your continued debt.',
  'By Royal Decree: smiling in the Probation Sector is taxed at 2%.',
  'By Royal Decree: your debt has been reviewed and found to be "large".',
  'By Royal Decree: the Royal Accountant has requested more spreadsheets.',
  'By Royal Decree: drones must now wear tiny hats on public holidays.',
  'By Royal Decree: the Moat Void shall be refilled. With what, unclear.',
  'By Royal Decree: Quantum Fluff is both legal and illegal until observed.',
];
