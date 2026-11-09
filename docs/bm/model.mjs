// COGGS Hit + COGGS Auto pricing model for pricing-sim (LilMSkills; every run prints the engine sha256).
// One account is one studio, team or maintainer. The metered use is a fix: one COGGS Hit coding-agent attempt at an
// engine upgrade or store-requirement change, which COGGS Auto then plays. Auto's plays run in the customer's own
// GitHub Actions, so a play costs us nothing and is never metered. Prices are US dollars a month.
// Every range names its source (listed in docs/BM.md) or is marked hypothesis.
// Run: node <pricing-sim>/scripts/sim.mjs docs/bm/model.mjs --worlds 400 --seed 20261109 --out <result.json>
const features = [
  { id: 'fixes', type: 'quota' },                                         // Hit fix attempts a month
  { id: 'repos', type: 'need', sigma: 0.5 },                              // game repositories covered
  { id: 'private', type: 'bool', off: 0.25 },                             // private repositories; public-only keeps 25% of the value
  { id: 'watch', type: 'bool', off: 0.5 },                                // Hit watches engine releases and store deadlines and opens PRs unasked
  { id: 'brain', type: 'levels', levels: { shared: 0.6, private: 1 } },  // gbrain: the shared public lessons, or the studio's private brain on top
];
const segments = [
  { id: 'oss', name: 'open-source web game maintainer', share: 0.30, wtp: 12, wtpSigma: 0.8, demand: 2, needs: { repos: 1 }, fomo: 0.2, streak: 0, churn: 0.12, yearly: 0.05,
    weights: { fixes: 0.5, repos: 0.1, private: 0.05, watch: 0.25, brain: 0.1 } },
  { id: 'indie', name: 'solo or duo indie with a shipped private game', share: 0.28, wtp: 60, wtpSigma: 0.7, demand: 4, needs: { repos: 1.3 }, fomo: 0.5, streak: 0, churn: 0.08, yearly: 0.15,
    weights: { fixes: 0.4, repos: 0.1, private: 0.25, watch: 0.15, brain: 0.1 } },
  { id: 'small', name: 'small studio, 5 to 15 developers', share: 0.20, wtp: 300, wtpSigma: 0.6, demand: 12, needs: { repos: 3 }, fomo: 0.5, streak: 0, churn: 0.05, yearly: 0.3,
    weights: { fixes: 0.35, repos: 0.15, private: 0.2, watch: 0.15, brain: 0.15 } },
  { id: 'agency', name: 'porting or outsourcing house keeping client games alive', share: 0.08, wtp: 600, wtpSigma: 0.6, demand: 30, needs: { repos: 8 }, fomo: 0.4, streak: 0, churn: 0.06, yearly: 0.3,
    weights: { fixes: 0.35, repos: 0.25, private: 0.15, watch: 0.1, brain: 0.15 } },
  { id: 'liveops', name: 'live-ops studio, 20 to 100 developers', share: 0.09, wtp: 1500, wtpSigma: 0.5, demand: 40, needs: { repos: 6 }, fomo: 0.3, streak: 0, churn: 0.03, yearly: 0.5,
    weights: { fixes: 0.3, repos: 0.1, private: 0.2, watch: 0.2, brain: 0.2 } },
  { id: 'catalog', name: 'web game portal or publisher with a catalog', share: 0.05, wtp: 2500, wtpSigma: 0.5, demand: 120, needs: { repos: 30 }, fomo: 0.3, streak: 0, churn: 0.04, yearly: 0.5,
    weights: { fixes: 0.35, repos: 0.3, private: 0.1, watch: 0.15, brain: 0.1 } },
];
const t = (name, price, fixes, repos, priv, watch, brain) => ({ name, price, quota: fixes, repos, private: priv, watch, brain });
const FREE_ONCE = { ...t('Free', 0, 3, 1, false, false, 'shared'), once: true };   // public repos, unlimited plays, 3 Hit fixes once
const FREE_MONTHLY = t('Free', 0, 3, 1, false, false, 'shared');                  // 3 Hit fixes every month
const FREE_AUTO = t('Free', 0, 0, 1, false, false, 'shared');                     // Auto only, no Hit fix
const HOBBY = (p = 49) => t('Hobby', p, 5, 1, true, false, 'shared');
const PRO = (p = 149) => t('Pro', p, 15, 3, true, true, 'private');
const HEAVY = (p = 249) => t('Heavy', p, 25, 10, true, true, 'private');
const STUDIO = (p = 1500) => t('Studio', p, 200, 50, true, true, 'private');
const DEV = { decoy: 'Pro', lossFrame: true, yearly: 0.2 };
const pkg = (id, free, tiers, o = {}) => ({ id, free, tiers, ...o });
const packages = [
  pkg('ladder', FREE_ONCE, [HOBBY(), PRO(), HEAVY()]),
  pkg('ladder-studio', FREE_ONCE, [HOBBY(), PRO(), HEAVY(), STUDIO()]),
  pkg('launch', FREE_ONCE, [HOBBY(), PRO(), HEAVY(), STUDIO()], DEV),
  pkg('launch-trial14', FREE_ONCE, [HOBBY(), PRO(), HEAVY(), STUDIO()], { ...DEV, trial: 14, trialCap: 3 }),
  pkg('launch-free-monthly', FREE_MONTHLY, [HOBBY(), PRO(), HEAVY(), STUDIO()], DEV),
  pkg('launch-free-auto-only', FREE_AUTO, [HOBBY(), PRO(), HEAVY(), STUDIO()], DEV),
  pkg('per-repo', FREE_ONCE, [t('Repo', 29, 3, 1, true, false, 'shared'), t('3 repos', 87, 9, 3, true, true, 'private'), t('10 repos', 290, 30, 10, true, true, 'private'), STUDIO()], { decoy: '3 repos', lossFrame: true, yearly: 0.2 }),
  pkg('auto-only-seat', FREE_AUTO, [t('Auto', 24, 0, 1, true, false, 'shared'), t('Auto Team', 99, 0, 5, true, false, 'shared')], { yearly: 0.2 }),
  pkg('higher-ladder', FREE_ONCE, [HOBBY(79), PRO(249), HEAVY(499), STUDIO(2500)], DEV),
  pkg('launch-topups', FREE_ONCE, [HOBBY(), PRO(), HEAVY(), STUDIO()], { ...DEV, credits: { n: 1, price: 12 } }),
  pkg('final', FREE_ONCE, [HOBBY(79), PRO(249), HEAVY(499), STUDIO(2500)], { credits: { n: 1, price: 19 } }),
  pkg('final-yearly', FREE_ONCE, [HOBBY(79), PRO(249), HEAVY(499), STUDIO(2500)], { credits: { n: 1, price: 19 }, yearly: 0.2 }),
];
export default {
  months: 12, retentionMonth: 6, taxFactor: 1, priceUnit: 50, defaults: { seed: 20261109, worlds: 400, agents: 80 },
  features, segments, useCost: 'hitCost*(1+fail)',
  ranges: {
    beta: [0.8, 2.0, 'hypothesis: utility per $50 of value minus price; B2B buyers less price sensitive than consumers'],
    asc: [4.0, 6.0, 'hypothesis: payment and procurement friction, set so Free to paid lands at a few percent; checked by the calibration shift'],
    wtpScale: [0.6, 1.4, 'hypothesis: shakes every segment willingness to pay; segment medians sit between one CodeRabbit seat at $24 to $72, nunu.ai self-serve at $200 a month and GameDriver Starter at $1,000 a month minimum'],
    hitCost: [0.5, 5, 'hypothesis around the measured $2.41 median model cost of one 20-minute COGGS harness run (daedal-games docs/daedal/frontier/PRICING.md)'],
    host: [0.2, 2, 'hypothesis: brain storage, verdict and frame hosting per active account a month; plays run in the customer GitHub Actions, free on public repositories (github-actions-billing)'],
    fee: [0.03, 0.05, 'hypothesis: card fee share on $49 to $1,500 at 2.9% + $0.30'],
    fomo: [0, 0.6, 'hypothesis: pull a used-up free fix allowance adds to paid tiers'],
    decoy: [0, 0.3, 'Frederick, Lee and Baskin 2014: attraction effect often absent; Huber et al. 2014: present when dominance is numeric'],
    lambda: [1.31, 2.25, 'loss aversion: 2024 mixed-gamble meta-analysis 1.31 to Tversky and Kahneman 1992 2.25'],
    endow: [0, 1, 'hypothesis: how strongly a trial makes the paid tier feel owned'],
    lossFrame: [0, 0.3, 'hypothesis: churn a cancel screen showing the private brain that would be lost removes'],
    compPrice: [24, 200, 'nearest paid alternative a month: one CodeRabbit Essentials seat at $24 to nunu.ai self-serve at $200 (coderabbit-pricing, nunu-ai-pricing)'],
    compValue: [0.15, 0.45, 'hypothesis: share of our value a code reviewer or a device QA agent gives; neither upgrades the engine nor replays base and head to diff frames'],
    churnMult: [0.8, 1.5, 'hypothesis: shakes every segment churn'],
    freeChurn: [0.2, 0.4, 'hypothesis: monthly churn of free accounts'],
    late: [0.01, 0.05, 'hypothesis: monthly late conversion when a public game goes private or an engine release lands'],
    yearlyPull: [0.6, 1.4, 'hypothesis: shakes yearly-plan propensity'],
    taste: [0, 0.3, 'hypothesis: value discount when a free account never saw Hit fix anything'],
    acq: [0, 1, 'hypothesis: signup lift from free fixes; Dependabot, Renovate, CodeRabbit and Greptile all give public or OSS repositories free use (their pages)'],
    fail: [0.05, 0.3, 'hypothesis: fix attempts re-run because the first one failed Auto'],
    mixNoise: [0.6, 1.4, 'hypothesis: shakes the segment mix'],
  },
  packages,
  bands: { param: 'hitCost', edges: [[0.5, 2], [2, 3.5], [3.5, 5]] },
  switches: { param: 'hitCost', edges: [[0.5, 2], [2, 3.5], [3.5, 5.0001]], atMost: [2, 3.5, 5], pairs: [['launch', 'per-repo'], ['launch', 'launch-free-monthly']] },
  ablations: [
    ['ladder-studio', 'ladder', 'adding the Studio contract tier'],
    ['launch', 'ladder-studio', 'Pro decoy, cancel screen and 20% yearly'],
    ['launch-trial14', 'launch', '14-day trial'],
    ['launch-free-monthly', 'launch', '3 free fixes every month instead of once'],
    ['launch-free-auto-only', 'launch', 'free tier gives plays only, no fix'],
    ['launch-topups', 'launch', '$12 single-fix top-ups'],
    ['higher-ladder', 'launch', 'prices about 1.6 to 2x higher'],
    ['per-repo', 'launch', 'price per repository instead of by fixes'],
    ['auto-only-seat', 'launch', 'sell Auto alone, no Hit'],
    ['final', 'higher-ladder', '$19 single-fix top-ups and no decoy, cancel screen or yearly on the higher ladder'],
    ['final-yearly', 'final', '20% yearly plan on the launch package'],
  ],
  calibrate: { package: 'final', target: 'hypothesis: B2B developer-tool freemium conversion of a few percent; no saved source' },
  predict: ['final', 'launch'],
};

