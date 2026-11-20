/* Tax rules and reliefs — copied unchanged from dev/PRS_Tax_Relief_Calculator.html */
const PRS_RELIEF = 3000;
const BANDS = [ // [from, to, rate] — each band covers (from, to]
  [0, 5000, 0], [5000, 20000, .01], [20000, 35000, .03], [35000, 50000, .06], [50000, 70000, .11],
  [70000, 100000, .19], [100000, 400000, .25], [400000, 600000, .26], [600000, 2000000, .28], [2000000, Infinity, .30]
];
const REBATE = { limit: 35000, self: 400, spouse: 400 };

const bandIndex = (ci) => BANDS.findIndex(([, to]) => ci <= to);
const taxTiers = (ci) => BANDS
  .map(([from, to, rate], i) => ({ i, rate, portion: Math.max(0, Math.min(ci, to) - from) }))
  .filter((x) => x.portion > 0)
  .map((x) => ({ ...x, tax: x.portion * x.rate }));

/* Workbook rows C1–D4: income tax, rebates, tax charged (zakat, credits and PCB excluded). */
function taxCharged(ci, spouseRelief) {
  const incomeTax = taxTiers(ci).reduce((sum, x) => sum + x.tax, 0);                 // C3
  const self = ci > 0 && ci <= REBATE.limit ? REBATE.self : 0;                       // D1
  const spouse = spouseRelief && self ? REBATE.spouse : 0;                            // D2: spouse relief 4,000 + D1 400 = 4,400
  return { ci, incomeTax, rebate: self + spouse, charged: Math.max(0, incomeTax - self - spouse) }; // D4
}

/* =====================================================================
   2. RELIEFS — mirror "kalkulator-cukai-tahun-taksiran-2025.xlsx".
   Caps follow the workbook's data-validation limits.
   Chargeable income (B25) = MAX(0, income − approved donations (A13) − total relief (B24)).
   PRS (B20) is preset to RM3,000; "without PRS" is the same calculation with B20 = 0.
   ===================================================================== */
const KIDS = [["u18", 2000], ["pre", 2000], ["deg", 8000], ["dis", 6000], ["disDeg", 14000]]; // Kalkulator Anak; 50% column = half
const HOUSE_CAP = { 500: 7000, 750: 5000 };                                                   // Faedah Pinjaman Perumahan
const GROUPS = [ // grouped by theme; items keep the workbook's B-order
  { id: "auto",      icon: "i-user",     items: [{ id: "indiv", type: "fixed", amount: 9000 },                          // B1
                                                 { id: "disabled", type: "check", amount: 7000 },                       // B4
                                                 { id: "eduFees", cap: 7000 }] },                                       // B5
  { id: "medical",   icon: "i-heart",    items: [{ id: "parents", cap: 8000 },                                          // B2
                                                 { id: "equip", cap: 6000 },                                            // B3
                                                 { id: "medSelf", cap: 10000 }] },                                      // B6–B9 (one input in workbook)
  { id: "lifestyle", icon: "i-sparkles", items: [{ id: "lifestyle", cap: 2500 },                                        // B10
                                                 { id: "sports", cap: 1000 },                                           // B11
                                                 { id: "breast", cap: 1000 }] },                                        // B12
  { id: "family",    icon: "i-users",    items: [{ id: "childcare", cap: 3000 },                                        // B13
                                                 { id: "sspn", cap: 8000 },                                             // B14
                                                 { id: "spouse", type: "check", amount: 4000 },                         // B15
                                                 { id: "spouseDis", type: "check", amount: 6000 },                      // B16
                                                 { id: "kids", type: "kids" }] },                                       // B17
  { id: "epf",       icon: "i-wallet",   items: [{ id: "life", cap: 3000 },                                             // B18 (life insurance)
                                                 { id: "epf", cap: 4000, auto: "epf" },                                 // B18 (EPF)
                                                 { id: "prs", cap: PRS_RELIEF, preset: PRS_RELIEF, prs: true },         // B20
                                                 { id: "eduMedIns", cap: 4000 },                                        // B21
                                                 { id: "socso", cap: 350, auto: "socso" }] },                           // B22
  { id: "home",      icon: "i-home",     items: [{ id: "house", type: "house" },                                        // B19
                                                 { id: "ev", cap: 2500 }] },                                            // B23
  { id: "donate",    icon: "i-gift",     items: [{ id: "donation", cap: Infinity, donation: true }] }                   // A13
];
const ITEMS = Object.fromEntries(GROUPS.flatMap((g) => g.items).map((it) => [it.id, it]));

function itemValue(it, s) {
  switch (it.type) {
    case "fixed": return it.amount;
    case "check": return s.ded[it.id] ? it.amount : 0;
    case "kids":  return KIDS.reduce((sum, [k, full]) => sum + full * s.kids[k][0] + full / 2 * s.kids[k][1], 0);
    case "house": return Math.min(HOUSE_CAP[s.house.band], s.house.amt);
    default:      return Math.min(it.cap, s.ded[it.id] ?? it.preset ?? 0);
  }
}
function chargeableIncome(s) {
  let reliefs = 0, donations = 0, prs = 0;
  const groupTotals = {};
  for (const g of GROUPS) {
    groupTotals[g.id] = 0;
    for (const it of g.items) {
      const v = itemValue(it, s);
      groupTotals[g.id] += v;
      if (it.donation) donations += v; else if (it.prs) prs += v; else reliefs += v;
    }
  }
  const beforePrs = s.income - donations - reliefs;
  return { donations, reliefs: reliefs + prs, prs, groupTotals, ci: Math.max(0, beforePrs - prs), ciWithoutPrs: Math.max(0, beforePrs) };
}
const AUTO_FILL = {
  epf: (income) => Math.min(4000, Math.round(income * 0.11)),                                       // 11% employee share
  socso: (income) => Math.min(350, Math.round(Math.min(income / 12, 6000) * 12 * 0.007))            // SOCSO + EIS ≈ 0.7%, wage ceiling RM6,000
};

/* Everything the page shows, from the current inputs. */
function calculate(s) {
  const relief = s.reliefsOn ? chargeableIncome(s) : null;
  const base = relief ? relief.ci : s.income;
  const idx = bandIndex(base);
  const rate = BANDS[idx][2];
  if (!relief) return { relief, base, idx, rate, prs: PRS_RELIEF, saving: PRS_RELIEF * rate };   // quick estimate: RM3,000 × top rate
  const without = taxCharged(relief.ciWithoutPrs, s.ded.spouse);
  const withPrs = taxCharged(relief.ci, s.ded.spouse);
  return { relief, base, idx, rate, prs: relief.prs, without, withPrs, saving: without.charged - withPrs.charged };
}

export { PRS_RELIEF, BANDS, REBATE, bandIndex, taxTiers, taxCharged, KIDS, HOUSE_CAP, GROUPS, ITEMS, itemValue, chargeableIncome, AUTO_FILL, calculate };
