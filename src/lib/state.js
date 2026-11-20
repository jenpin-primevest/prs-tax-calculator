import { KIDS } from "./tax.js";

/* State — saved in the browser only (same key and shape as the HTML version). */
export const STORE_KEY = "ppa-prs-tax-calculator";
export const freshKids = () => Object.fromEntries(KIDS.map(([k]) => [k, [0, 0]]));
export const defaults = () => ({ lang: "en", income: 75000, reliefsOn: false, ded: {}, kids: freshKids(), house: { band: "500", amt: 0 }, tab: "save" });
const ALLOWED = { lang: ["en", "bm"], tab: ["save", "tax"] };

export function loadState() {
  const s = defaults();
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    for (const k of Object.keys(s)) {
      if (typeof saved[k] !== typeof s[k] || (ALLOWED[k] && !ALLOWED[k].includes(saved[k]))) continue;
      s[k] = saved[k];
    }
    s.kids = Object.assign(freshKids(), s.kids);
    s.house = Object.assign({ band: "500", amt: 0 }, s.house);
  } catch { /* storage unavailable or corrupt: use defaults */ }
  return s;
}

export function saveState(s) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
