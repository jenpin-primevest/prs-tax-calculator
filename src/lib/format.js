import { I18N } from "./i18n.js";
import { BANDS } from "./tax.js";

export const YEAR = new Date().getFullYear();
export const fmt = (n) => Math.round(n).toLocaleString("en-MY");
export const fmt2 = (n) => n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const rm = (n) => "RM " + fmt(n);
export const rm2 = (n) => "RM " + fmt2(n);
export const pct = (r) => Math.round(r * 100) + "%";
export const parseNum = (v) => { const n = parseFloat(String(v).replace(/[^\d.]/g, "")); return Number.isFinite(n) ? n : 0; };
export const tierColor = (i) => i === 0 ? "#dbe2ee" : `rgba(36,50,112,${(0.2 + i * 0.09).toFixed(2)})`;

/* Translator bound to a language: t("key", { var: value }) */
export function makeT(lang) {
  return (key, vars = {}) => {
    let s = I18N[lang][key] ?? I18N.en[key] ?? key;
    for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
    return s;
  };
}
export const hint = (t, id) => I18N.en["h." + id] ? t("h." + id) : "";

export function bandLabel(t, i) {
  const [from, to] = BANDS[i];
  return to === Infinity ? t("tb.above", { v: fmt(from) }) : `${i ? fmt(from + 1) : 0} – ${fmt(to)}`;
}
