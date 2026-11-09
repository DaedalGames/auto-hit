// Contract-tier model for pricing-sim: the studio and publisher contracts above the self-serve ladder in model.mjs.
// It runs on its own because contract prices are 20 to 40 times the self-serve ones: with one beta per $50 the
// engine's logit overflows on a $15K buyer, so here beta is utility per $5,000. Prices are US dollars a month.
// Measured anchor: founder statement 2026-11-09. Modules of COGGS Hit + COGGS Auto run as LiveOps PoCs at game
// companies with 10M+ players, including Nexon and Krafton, at KRW 15-25M a month, $11.5K-$19.2K at KRW 1,300 per dollar.
// Run: node <pricing-sim>/scripts/sim.mjs docs/bm/contract-model.mjs --worlds 400 --seed 20261109 --out <result.json>
const features = [
  { id: 'fixes', type: 'quota' },
  { id: 'titles', type: 'need', sigma: 0.4 },                           // live titles under contract
  { id: 'engineer', type: 'bool', off: 0.5 },                           // a named engineer and SLA
  { id: 'brain', type: 'levels', levels: { shared: 0.6, private: 1 } },
];
const segments = [
  { id: 'liveops', name: 'live-ops studio, 20 to 100 developers', share: 0.45, wtp: 1500, wtpSigma: 0.5, demand: 40, needs: { titles: 1 }, fomo: 0.1, streak: 0, churn: 0.03, yearly: 0.5,
    weights: { fixes: 0.45, titles: 0.15, engineer: 0.15, brain: 0.25 } },
  { id: 'catalog', name: 'web game portal or publisher with a catalog', share: 0.30, wtp: 2500, wtpSigma: 0.5, demand: 120, needs: { titles: 3 }, fomo: 0.1, streak: 0, churn: 0.04, yearly: 0.5,
    weights: { fixes: 0.45, titles: 0.25, engineer: 0.1, brain: 0.2 } },
  // Anchor: the PoC price band, $11.5K-$19.2K a month, median at its midpoint $15.4K (founder statement 2026-11-09).
  { id: 'major', name: 'major publisher LiveOps title, 10M+ players (Nexon, Krafton PoCs)', share: 0.25, wtp: 15400, wtpSigma: 0.15, demand: 300, needs: { titles: 2 }, fomo: 0.1, streak: 0, churn: 0.02, yearly: 0.8,
    weights: { fixes: 0.35, titles: 0.2, engineer: 0.25, brain: 0.2 } },
];
const t = (name, price, fixes, titles, engineer, brain) => ({ name, price, quota: fixes, titles, engineer, brain });
const FREE = { ...t('Free', 0, 3, 1, false, 'shared'), once: true };
const HEAVY = t('Heavy', 499, 25, 1, false, 'private');
const STUDIO = (p) => t('Studio', p, 200, 3, true, 'private');
const LIVEOPS = (p) => t('LiveOps', p, 600, 1, true, 'private');
const LIVEOPS_MULTI = (p) => t('LiveOps', p, 600, 3, true, 'private');
const pkg = (id, tiers) => ({ id, free: FREE, tiers });
const packages = [
  pkg('studio-2500', [HEAVY, STUDIO(2500)]),
  pkg('studio-5000', [HEAVY, STUDIO(5000)]),
  pkg('studio-10000', [HEAVY, STUDIO(10000)]),
  pkg('studio-2500-liveops-10000', [HEAVY, STUDIO(2500), LIVEOPS(10000)]),
  pkg('studio-2500-liveops-15000', [HEAVY, STUDIO(2500), LIVEOPS(15000)]),
  pkg('studio-2500-liveops-20000', [HEAVY, STUDIO(2500), LIVEOPS(20000)]),
  pkg('studio-5000-liveops-15000', [HEAVY, STUDIO(5000), LIVEOPS(15000)]),
  pkg('liveops-15000-only', [HEAVY, LIVEOPS(15000)]),
  pkg('studio-2500-liveops-30000-multi', [HEAVY, STUDIO(2500), LIVEOPS_MULTI(30000)]),
];
export default {
  months: 12, retentionMonth: 6, taxFactor: 1, priceUnit: 5000, defaults: { seed: 20261109, worlds: 400, agents: 80 },
  features, segments, useCost: 'hitCost*(1+fail)',
  ranges: {
    beta: [0.8, 2.0, 'hypothesis: utility per $5,000 of value minus price for a contract buyer'],
    asc: [1.0, 3.0, 'hypothesis: procurement friction of a signed contract'],
    wtpScale: [0.75, 1.25, 'the PoC band $11.5K-$19.2K is 0.75x to 1.25x its midpoint (founder statement 2026-11-09)'],
    hitCost: [0.5, 5, 'hypothesis around the measured $2.41 median model cost of one 20-minute COGGS harness run (daedal-games PRICING.md)'],
    host: [50, 500, 'hypothesis: a named engineer share, brain and frame hosting per contract account a month'],
    fee: [0, 0.01, 'hypothesis: invoiced by bank transfer, no card fee'],
    compPrice: [1000, 2000, 'GameDriver Starter 5 nodes at $200 to Growth at $400 a node a month (gamedriver-pricing-www2)'],
    compValue: [0.15, 0.45, 'hypothesis: share of our value a test-automation license gives; it neither upgrades the engine nor diffs frames'],
    churnMult: [0.8, 1.5, 'hypothesis: shakes every segment churn'],
    freeChurn: [0.2, 0.4, 'hypothesis: monthly churn of free accounts'],
    late: [0.01, 0.05, 'hypothesis: monthly late conversion'],
    fail: [0.05, 0.3, 'hypothesis: fix attempts re-run because the first one failed Auto'],
    mixNoise: [0.6, 1.4, 'hypothesis: shakes the segment mix'],
  },
  packages,
  bands: { param: 'wtpScale', edges: [[0.75, 0.92], [0.92, 1.08], [1.08, 1.25]] },
  switches: { param: 'wtpScale', edges: [[0.75, 0.92], [0.92, 1.08], [1.08, 1.2501]], atMost: [0.92, 1.08, 1.25], pairs: [['studio-2500', 'studio-2500-liveops-15000']] },
  ablations: [
    ['studio-2500-liveops-10000', 'studio-2500', 'a $10K per-title LiveOps contract above Studio'],
    ['studio-2500-liveops-15000', 'studio-2500-liveops-10000', 'LiveOps at $15K instead of $10K'],
    ['studio-2500-liveops-20000', 'studio-2500-liveops-15000', 'LiveOps at $20K instead of $15K'],
    ['studio-10000', 'studio-2500', 'raising Studio itself to $10K with no LiveOps tier'],
    ['liveops-15000-only', 'studio-2500-liveops-15000', 'dropping the $2,500 Studio rung'],
  ],
  predict: ['studio-2500-liveops-15000', 'studio-2500'],
};

