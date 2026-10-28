import type { AssetDef, Bracket, Goal, WorldId } from '../engine/types';

export type AssetSkin = Omit<AssetDef, 'id'>;

export interface World {
  id: WorldId;
  name: string;
  emoji: string;
  tagline: string;
  ages: string;
  defaultBracket: Bracket;
  defaultScenarioId: string;
  currency: { symbol: string; word: string; prefix: boolean };
  colors: {
    accent: string;
    accentDark: string;
    soft: string;
    hero: string;
    chart: string[];
  };
  cashName: string;
  investedName: string;
  marketName: string;
  portfolioName: string;
  seasonWord: string;
  levelTitles: string[];
  stormWord: string;
  sunWord: string;
  incomeWord: string;
  seasonLabel: (s: number) => string;
  /** Things to save up for and buy; bought items appear in the world scene. Prices are in today's money. */
  goalLadder: Goal[];
  /** Name of the home base in the scene (holds the cash). */
  baseName: string;
  assets: Record<string, AssetSkin>;
}

const FARM_SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];

export const WORLDS: Record<WorldId, World> = {
  farm: {
    id: 'farm',
    name: 'Sunny Hill Farm',
    emoji: '🌻',
    tagline: 'Raise animals and trees and watch your farm grow.',
    ages: '6 to 8',
    defaultBracket: 1,
    defaultScenarioId: 'farm-default',
    currency: { symbol: 'coins', word: 'coins', prefix: false },
    colors: {
      accent: '#2f9e44',
      accentDark: '#237032',
      soft: '#ebf8ee',
      hero: 'linear-gradient(135deg,#fff7d6 0%,#e7f7df 55%,#d3f0d8 100%)',
      chart: ['#2f9e44', '#f59f00', '#e8590c', '#d6336c', '#7048e8', '#1c7ed6', '#868e96', '#0ca678'],
    },
    cashName: 'Farmhouse chest',
    investedName: 'On the farm',
    marketName: 'Farm market',
    portfolioName: 'My farm',
    seasonWord: 'season',
    levelTitles: ['Farmhand', 'Young Farmer', 'Farmer', 'Master Farmer', 'Farm Legend'],
    stormWord: 'A storm hit the farm',
    sunWord: 'What a sunny season',
    incomeWord: 'Pocket money',
    seasonLabel: (s) => (s === 0 ? 'Year 1 · First day' : `Year ${Math.floor((s - 1) / 4) + 1} · ${FARM_SEASONS[(s - 1) % 4]}`),
    baseName: 'Farmhouse',
    goalLadder: [
      { name: 'Farm dog', emoji: '🐕', amount: 250 },
      { name: 'Sunflower field', emoji: '🌻', amount: 800 },
      { name: 'Big farmhouse', emoji: '🏡', amount: 1200 },
      { name: 'Hot-air balloon', emoji: '🎈', amount: 2000 },
      { name: 'Farm fair', emoji: '🎡', amount: 3500 },
    ],
    assets: {
      cow: {
        name: 'Cow', emoji: '🐄',
        tagline: 'Gives milk all year. Grows slowly but surely.',
        description: 'A cow is a calm, strong animal. She gives you milk, and at the end of every year the milk is sold for coins that go into your barn. Sometimes a storm makes her worth less for a while, but cows usually grow over the years.',
        realLabel: 'Equity index ETF · distributing',
        model: { kind: 'series', series: 'stocks' }, payoutYield: 0.03, payoutWord: 'milk', fee: 0.002, risk: 3, basePrice: 20,
      },
      tree: {
        name: 'Apple tree', emoji: '🌳',
        tagline: 'Its apples help the tree grow even bigger.',
        description: 'An apple tree gives you no coins right away. Its apples fall to the ground and help the tree grow bigger and bigger. Patient farmers end up with huge trees.',
        realLabel: 'Equity index ETF · accumulating',
        model: { kind: 'series', series: 'stocks' }, payoutYield: 0, fee: 0.002, risk: 3, basePrice: 20,
      },
      hens: {
        name: 'Hens', emoji: '🐔',
        tagline: 'Lay eggs all year. Calm and steady.',
        description: 'Hens are quiet and steady. They lay eggs, and at the end of every year you sell the eggs for coins. They rarely grow big, but storms hardly bother them.',
        realLabel: 'Government bond ETF · distributing',
        model: { kind: 'series', series: 'tbond' }, payoutYield: 0.04, payoutWord: 'eggs', fee: 0.002, risk: 2, basePrice: 10,
      },
      pig: {
        name: 'Pig', emoji: '🐖',
        tagline: 'Might grow very big, or get sick. Exciting but risky!',
        description: 'A pig can grow really, really big. But pigs can also get sick and shrink a lot. If you buy pigs, maybe do not put all your coins into them.',
        realLabel: 'Small-cap stocks · very high risk',
        model: { kind: 'series', series: 'small' }, payoutYield: 0, fee: 0.005, risk: 5, basePrice: 10,
      },
      bees: {
        name: 'Bee hive', emoji: '🐝',
        tagline: 'Golden honey. Sometimes worth a lot, sometimes not.',
        description: 'Honey is golden and people love it, especially when times are hard. But the price of honey can jump up and down, and bees give you no coins while you keep them.',
        realLabel: 'Gold',
        model: { kind: 'series', series: 'gold' }, payoutYield: 0, fee: 0.002, risk: 4, basePrice: 15,
      },
    },
  },

  space: {
    id: 'space',
    name: 'Starbase Nova',
    emoji: '🪐',
    tagline: 'Build a space fleet and power your starbase.',
    ages: '9 to 11',
    defaultBracket: 2,
    defaultScenarioId: 'space-default',
    currency: { symbol: 'cr', word: 'credits', prefix: false },
    colors: {
      accent: '#5f3dc4',
      accentDark: '#43298c',
      soft: '#f1edff',
      hero: 'linear-gradient(135deg,#1b1747 0%,#3b2a85 55%,#5f3dc4 100%)',
      chart: ['#7048e8', '#15aabf', '#f59f00', '#e64980', '#40c057', '#fd7e14', '#868e96', '#4c6ef5'],
    },
    cashName: 'Credits available',
    investedName: 'Deployed in space',
    marketName: 'Shipyard',
    portfolioName: 'My fleet',
    seasonWord: 'quarter',
    levelTitles: ['Cadet', 'Pilot', 'Navigator', 'Commander', 'Admiral'],
    stormWord: 'Meteor storm',
    sunWord: 'Solar wind boost',
    incomeWord: 'Pocket money',
    seasonLabel: (s) => (s === 0 ? 'Mission year 1 · Launch' : `Mission year ${Math.floor((s - 1) / 4) + 1} · Q${((s - 1) % 4) + 1}`),
    baseName: 'Starbase core',
    goalLadder: [
      { name: 'Robot helper', emoji: '🤖', amount: 900 },
      { name: 'Space telescope', emoji: '🔭', amount: 3500 },
      { name: 'Moon base', emoji: '🌙', amount: 5500 },
      { name: 'Comet catcher', emoji: '☄️', amount: 8000 },
    ],
    assets: {
      solar: {
        name: 'Solar Station', emoji: '☀️',
        tagline: 'Owns a little bit of hundreds of space companies. Pays energy credits.',
        description: 'A Solar Station is shared by hundreds of space companies at once. When the companies do well, the station grows. Every quarter it sends you energy credits that land in your account.',
        realLabel: 'Equity index ETF · distributing',
        model: { kind: 'series', series: 'stocks' }, payoutYield: 0.02, payoutWord: 'energy credits', fee: 0.002, risk: 3, basePrice: 100,
      },
      greenhouse: {
        name: 'Space Greenhouse', emoji: '🌱',
        tagline: 'Same companies as the Solar Station, but it reinvests its harvest.',
        description: 'The greenhouse holds the same mix of space companies. Instead of paying you, it plants every harvest again, so the greenhouse itself grows faster.',
        realLabel: 'Equity index ETF · accumulating',
        model: { kind: 'series', series: 'stocks' }, payoutYield: 0, fee: 0.002, risk: 3, basePrice: 100,
      },
      premium: {
        name: 'Captain Vega\'s Fleet', emoji: '🌟',
        tagline: 'A famous captain picks the companies. The crew costs 1.8 % per year.',
        description: 'Captain Vega is famous and picks space companies by hand. That sounds great, but the crew has to be paid: 1.8 out of every 100 credits each year, whether the captain picks well or not.',
        realLabel: 'Actively managed equity fund · high fees',
        model: { kind: 'series', series: 'stocks' }, payoutYield: 0, fee: 0.018, risk: 3, basePrice: 100,
      },
      satellites: {
        name: 'Supply Satellites', emoji: '🛰️',
        tagline: 'Lend credits to the starbase and get steady interest back.',
        description: 'You lend credits to the starbase council. In return they pay you interest every quarter. Satellites move much less than stations, but they also grow more slowly.',
        realLabel: 'Government bond ETF · distributing',
        model: { kind: 'series', series: 'tbond' }, payoutYield: 0.03, payoutWord: 'interest', fee: 0.002, risk: 2, basePrice: 50,
      },
      rocket: {
        name: 'Rocket Lab', emoji: '🚀',
        tagline: 'Brand-new rockets. Some fly to the moon, some explode on the pad.',
        description: 'Rocket Lab builds brand-new rockets. When a launch works, the value can shoot up. When it fails, a lot can be lost very fast. Exciting, but very risky.',
        realLabel: 'Small-cap stocks · very high risk',
        model: { kind: 'series', series: 'small' }, payoutYield: 0, fee: 0.005, risk: 5, basePrice: 40,
      },
      crystal: {
        name: 'Star Crystals', emoji: '💎',
        tagline: 'Rare and shiny. Pays nothing, but often shines when others are dark.',
        description: 'Star Crystals are rare. They pay you nothing while you hold them, and their price jumps around. But in scary times many people want crystals, so they sometimes rise when everything else falls.',
        realLabel: 'Gold',
        model: { kind: 'series', series: 'gold' }, payoutYield: 0, fee: 0.002, risk: 4, basePrice: 60,
      },
      fuel: {
        name: 'Fuel Bank', emoji: '⛽',
        tagline: 'A safe deposit that pays a little interest. Never drops.',
        description: 'The Fuel Bank keeps your credits safe and adds a little interest. It almost never goes down. But when prices at the starbase rise faster than the interest, your credits buy less.',
        realLabel: 'Savings account / money market',
        model: { kind: 'series', series: 'tbill' }, payoutYield: 0, fee: 0, risk: 1, basePrice: 10,
      },
    },
  },

  city: {
    id: 'city',
    name: 'Metro City',
    emoji: '🏙️',
    tagline: 'Invest in the companies, buildings and bonds of a whole city.',
    ages: '12 to 14',
    defaultBracket: 3,
    defaultScenarioId: 'city-default',
    currency: { symbol: '€', word: 'euros', prefix: true },
    colors: {
      accent: '#0c8599',
      accentDark: '#0b6575',
      soft: '#e3f6f8',
      hero: 'linear-gradient(135deg,#0b1f2a 0%,#103a46 55%,#0c8599 100%)',
      chart: ['#0c8599', '#f08c00', '#7048e8', '#e8590c', '#2f9e44', '#c2255c', '#868e96', '#1971c2'],
    },
    cashName: 'Available',
    investedName: 'Invested',
    marketName: 'Discover',
    portfolioName: 'Portfolio',
    seasonWord: 'quarter',
    levelTitles: ['Intern', 'Analyst', 'Investor', 'Portfolio Pro', 'Market Legend'],
    stormWord: 'Market dip',
    sunWord: 'Rally',
    incomeWord: 'Savings from pocket money',
    seasonLabel: (s) => (s === 0 ? 'Year 1 · Start' : `Year ${Math.floor((s - 1) / 4) + 1} · Q${((s - 1) % 4) + 1}`),
    baseName: 'Cash account',
    goalLadder: [
      { name: 'E-scooter', emoji: '🛴', amount: 600 },
      { name: 'Laptop', emoji: '💻', amount: 1500 },
      { name: 'Festival trip', emoji: '🎪', amount: 3000 },
      { name: 'First car', emoji: '🚗', amount: 18000 },
    ],
    assets: {
      cityetf: {
        name: 'Whole City Index Fund', emoji: '🏙️',
        tagline: 'One fund, the 500 biggest companies in the city. Pays a dividend.',
        description: 'An index fund (ETF) buys all big companies in the city at once, so one bad company cannot ruin you. This version pays out the companies\' dividends to your cash account every quarter.',
        realLabel: 'Equity index ETF · distributing',
        model: { kind: 'series', series: 'stocks' }, payoutYield: 0.02, payoutWord: 'dividend', fee: 0.002, risk: 3, basePrice: 80,
      },
      cityacc: {
        name: 'Whole City Index Fund (Acc)', emoji: '🌆',
        tagline: 'Same 500 companies; dividends are reinvested automatically.',
        description: 'Exactly the same companies as the distributing fund. The difference: dividends are reinvested inside the fund, so you see one growing number instead of payouts. Over many years this compounds.',
        realLabel: 'Equity index ETF · accumulating',
        model: { kind: 'series', series: 'stocks' }, payoutYield: 0, fee: 0.002, risk: 3, basePrice: 80,
      },
      active: {
        name: 'Star Manager Fund', emoji: '👔',
        tagline: 'A famous manager picks winners. Costs 1.8 % per year, win or lose.',
        description: 'A professional manager tries to beat the market by picking stocks. The fund charges 1.8 % per year (TER). Research shows most such funds trail a cheap index fund over long periods, mostly because of the costs.',
        realLabel: 'Actively managed equity fund · TER 1.8 %',
        model: { kind: 'series', series: 'stocks' }, payoutYield: 0, fee: 0.018, risk: 3, basePrice: 80,
      },
      bonds: {
        name: 'City Bonds', emoji: '🏛️',
        tagline: 'Lend money to the city government and receive interest.',
        description: 'A bond is a loan. You lend money to the government, it pays you interest (the coupon) and gives the money back later. Bond prices move less than stocks, but they fall when interest rates jump.',
        realLabel: 'Government bond ETF · distributing',
        model: { kind: 'series', series: 'tbond' }, payoutYield: 0.03, payoutWord: 'interest', fee: 0.0015, risk: 2, basePrice: 50,
      },
      startup: {
        name: 'Startup Garage', emoji: '🧪',
        tagline: 'Tiny young companies. Huge upside, brutal crashes.',
        description: 'The smallest companies in the city. Some become giants, many disappear. Their prices can double in a year or lose half. Great for a small part of a portfolio, dangerous as the whole portfolio.',
        realLabel: 'Small-cap stocks · very high risk',
        model: { kind: 'series', series: 'small' }, payoutYield: 0, fee: 0.004, risk: 5, basePrice: 30,
      },
      gold: {
        name: 'Gold Vault', emoji: '🥇',
        tagline: 'Physical gold. No interest, but a classic crisis hedge.',
        description: 'Gold pays no interest or dividend. Its price depends on what people are willing to pay, which often rises in crises and with high inflation. It can also fall for years.',
        realLabel: 'Gold ETC',
        model: { kind: 'series', series: 'gold' }, payoutYield: 0, fee: 0.0025, risk: 4, basePrice: 60,
      },
      property: {
        name: 'Property Fund', emoji: '🏘️',
        tagline: 'Owns homes in the city and collects rent.',
        description: 'A property fund owns many homes and passes the rent on to you. House prices usually move slowly, but they can fall for several years after a housing bubble.',
        realLabel: 'Real estate fund · rent paid out',
        model: { kind: 'series', series: 'realestate' }, payoutYield: 0.025, payoutOnTop: true, payoutWord: 'rent', fee: 0.006, risk: 3, basePrice: 50,
      },
      savings: {
        name: 'Savings Account', emoji: '🏦',
        tagline: 'Instant access, interest, no price swings.',
        description: 'Your money is safe and earns the current interest rate. It never falls in value in euros, but after inflation it often barely grows or even shrinks.',
        realLabel: 'Savings account / money market',
        model: { kind: 'series', series: 'tbill' }, payoutYield: 0, fee: 0, risk: 1, basePrice: 10,
      },
    },
  },
};

export const WORLD_LIST = [WORLDS.farm, WORLDS.space, WORLDS.city];

export const BRACKETS: { id: Bracket; ages: string; label: string; summary: string }[] = [
  { id: 1, ages: '6 to 8', label: 'Explorer', summary: 'Whole items, no percentages, weather instead of numbers.' },
  { id: 2, ages: '9 to 11', label: 'Builder', summary: 'Percent changes, charts, fees and payouts made visible.' },
  { id: 3, ages: '12 to 14', label: 'Investor', summary: 'Real terms, euros, trading fees, inflation-adjusted view.' },
];

export function worldAssets(world: WorldId): AssetDef[] {
  return Object.entries(WORLDS[world].assets).map(([id, a]) => ({ id: `${world}.${id}`, ...a }));
}
