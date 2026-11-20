import { useEffect, useMemo, useRef, useState } from "react";
import { BANDS, calculate, chargeableIncome } from "./lib/tax.js";
import { PRESETS } from "./lib/i18n.js";
import { fmt, makeT, parseNum } from "./lib/format.js";
import { loadState, saveState } from "./lib/state.js";
import { IconSprite, Icon } from "./components/Icons.jsx";
import Header from "./components/Header.jsx";
import MoneyInput from "./components/MoneyInput.jsx";
import ReliefPanel from "./components/ReliefPanel.jsx";
import ResultCard from "./components/ResultCard.jsx";
import BracketsTable from "./components/BracketsTable.jsx";
import Footer from "./components/Footer.jsx";

const RANGE = { min: 0, max: 300000 };

export default function App() {
  const [state, setState] = useState(loadState);
  const [openGroups, setOpenGroups] = useState(() => new Set(["epf"]));
  const resultRef = useRef(null);
  const reliefsRef = useRef(null);

  /* Apply a mutation to a copy of the state (mirrors the original's update()). */
  const update = (fn) => setState((s) => { const n = structuredClone(s); fn(n); return n; });

  useEffect(() => { saveState(state); }, [state]);
  useEffect(() => { document.documentElement.lang = state.lang === "bm" ? "ms-MY" : "en-MY"; }, [state.lang]);

  const t = useMemo(() => makeT(state.lang), [state.lang]);
  const result = useMemo(() => calculate(state), [state]);
  const relief = result.relief ?? chargeableIncome(state);   // panel is hidden when reliefs are off

  const setGroupOpen = (id, open) => setOpenGroups((prev) => {
    if (prev.has(id) === open) return prev;
    const next = new Set(prev);
    open ? next.add(id) : next.delete(id);
    return next;
  });

  // Bracket rows map to income only when reliefs are off
  const pickBand = (i) => {
    if (state.reliefsOn) return;
    const [from, to] = BANDS[i];
    update((s) => { s.income = to === Infinity ? from + 500000 : Math.round((from + to) / 2000) * 1000; });
    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const enableReliefs = () => {
    update((s) => { s.reliefsOn = true; });
    requestAnimationFrame(() => reliefsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const rangeVal = Math.min(RANGE.max, Math.max(RANGE.min, state.income));

  return (
    <>
      <IconSprite />
      <Header t={t} lang={state.lang} setLang={(lang) => update((s) => { s.lang = lang; })} />

      <div className="page-bg" id="top">
        <div className="aurora" aria-hidden="true"></div>
        <div className="grid-pattern" aria-hidden="true"></div>

        <main className="app-container">
          <section className="hero">
            <h1 className="fade-up">{t("hero.title")}</h1>
            <p className="fade-up d1">{t("hero.sub")}</p>
          </section>

          <div className="calc-grid">
            {/* Inputs */}
            <section className="card" aria-labelledby="inputsTitle">
              <h2 className="card-title" id="inputsTitle"><span className="icon-tile"><Icon id="i-piggy" size={20} /></span><span>{t("in.title")}</span></h2>
              <label className="label" htmlFor="incomeInput">{t("in.income")}</label>
              <MoneyInput
                id="incomeInput" value={state.income} format={fmt} selectOnFocus
                onValue={(raw) => update((s) => { s.income = Math.min(1e9, parseNum(raw)); })}
              />
              <input
                type="range" id="incomeRange" min={RANGE.min} max={RANGE.max} step="1000" aria-label={t("in.income")}
                value={rangeVal} style={{ "--pct": ((rangeVal - RANGE.min) / (RANGE.max - RANGE.min)) * 100 + "%" }}
                onChange={(e) => update((s) => { s.income = +e.target.value; })}
              />
              <div className="range-scale"><span>RM0</span><span>RM300k+</span></div>
              <p className="hint">{t("in.incomeHint")}</p>
              <div className="chips">
                {PRESETS.map((v) => (
                  <button key={v} type="button" className={"chip" + (state.income === v ? " is-active" : "")} onClick={() => update((s) => { s.income = v; })}>RM{v / 1000}k</button>
                ))}
              </div>

              {/* Tax reliefs: chargeable income per LHDN "Kalkulator Cukai TT 2025" */}
              <div className="reliefs" ref={reliefsRef}>
                <label className="rl-head" htmlFor="reliefToggle">
                  <span className="icon-tile"><Icon id="i-calc" size={20} /></span>
                  <span className="rl-text"><span className="rl-title">{t("rl.title")}</span><span className="rl-sub">{t("rl.sub")}</span></span>
                  <span className="switch">
                    <input type="checkbox" id="reliefToggle" role="switch" checked={state.reliefsOn} onChange={(e) => update((s) => { s.reliefsOn = e.target.checked; })} />
                    <span></span>
                  </span>
                </label>
                <ReliefPanel state={state} relief={relief} t={t} update={update} openGroups={openGroups} setGroupOpen={setGroupOpen} />
              </div>
            </section>

            {/* Result */}
            <ResultCard
              ref={resultRef} result={result} t={t} tab={state.tab} reliefsOn={state.reliefsOn}
              setTab={(tab) => update((s) => { s.tab = tab; })} onEnableReliefs={enableReliefs}
            />
          </div>

          {/* Tax savings by bracket */}
          <BracketsTable t={t} relief={result.relief} idx={result.idx} onPick={pickBand} />
        </main>
      </div>

      <Footer t={t} />
    </>
  );
}
