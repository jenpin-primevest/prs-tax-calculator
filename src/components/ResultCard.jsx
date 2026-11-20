import { forwardRef, useEffect, useRef } from "react";
import { taxTiers } from "../lib/tax.js";
import { fmt, rm, rm2, pct, tierColor, bandLabel } from "../lib/format.js";
import { Icon } from "./Icons.jsx";

/* Count-up animation for the big number (450ms ease-out cubic). */
function useCountUp(to) {
  const ref = useRef(null), shown = useRef(0), frame = useRef(0);
  useEffect(() => {
    const from = shown.current, start = performance.now();
    const instant = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = (now) => {
      const p = instant ? 1 : Math.min(1, (now - start) / 450);
      if (ref.current) ref.current.textContent = rm(from + (to - from) * (1 - (1 - p) ** 3));
      if (p < 1) frame.current = requestAnimationFrame(step); else shown.current = to;
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [to]);
  return ref;
}

function SavingView({ result, t, hidden }) {
  const { relief, base, idx, rate, prs, saving, without } = result;
  const cost = prs - saving;
  const savePct = prs > 0 ? (saving / prs) * 100 : 0;
  const bigRef = useCountUp(saving);
  const noTax = relief ? without.charged <= 0 : rate === 0;
  const costLine = !prs ? t("r.noPrs") : t(saving > 0 ? "r.costLine" : "r.costZero", { p: fmt(prs), n: fmt(cost) });

  return (
    <div id="viewSave" role="tabpanel" aria-labelledby="tabSave" aria-live="polite" hidden={hidden}>
      <div className="eyebrow">{t("r.eyebrow")}</div>
      <div className="headline"><span className="big" ref={bigRef}>RM 0</span><span className="big-sub">{t("r.bigSub")}</span></div>
      <p className="cost-line" dangerouslySetInnerHTML={{ __html: costLine }} />
      <div className="split-bar" role="img" aria-label={`${t("r.taxSaved")} ${rm(saving)}, ${t("r.cost")} ${rm(cost)}`}>
        <i className="s-save" style={{ width: savePct + "%" }}></i>
        <i className="s-cost" style={{ width: (prs > 0 ? 100 - savePct : 0) + "%" }}></i>
      </div>
      <div className="split-legend">
        <span><i className="dot s-save"></i><span>{t("r.taxSaved")}</span> <b>{rm(saving)}</b></span>
        <span><i className="dot s-cost"></i><span>{t("r.cost")}</span> <b>{rm(cost)}</b></span>
      </div>
      <div>
        {noTax && <div className="note"><Icon id="i-info" size={18} /><div>{t(relief ? "r.zeroRelief" : "r.zero")}</div></div>}
      </div>
      <div className="rate-row">
        <span className="rate-text">
          <b>{t("r.rate")}</b><span className="rate-sep"> · </span>
          <span>{relief ? t("r.rateSubRelief", { ci: fmt(base) }) : t("r.rateSub", { band: bandLabel(t, idx) })}</span>
        </span>
        <strong>{pct(rate)}</strong>
      </div>
    </div>
  );
}

function TaxView({ result, t, hidden, onEnable }) {
  const { relief, withPrs: s } = result;
  let body;
  if (!relief) {
    body = (
      <div className="tv-teaser">
        <span className="icon-tile"><Icon id="i-calc" size={22} /></span>
        <div className="tv-teaser-title">{t("tv.teaserTitle")}</div>
        <div className="tv-teaser-sub">{t("tv.teaserSub")}</div>
        <button type="button" className="btn-secondary btn-sm" onClick={onEnable}>{t("rl.title")}</button>
      </div>
    );
  } else {
    // tax on the reliefs entered, PRS included
    const label = s.charged > 0 ? t("tv.charged") : t("tv.zero");
    const tiers = taxTiers(s.ci);
    body = (
      <>
        <div className="eyebrow">{t("tv.eyebrow")}</div>
        <div className="tv-label">{label}</div>
        <div className={"tv-amt" + (s.charged > 0 ? "" : " zero")}>{rm(s.charged)}</div>
        {tiers.length > 0 && (
          <div className="tv-sec">
            <div className="tv-h"><span>{t("tv.calc")}</span><b>{t("rl.ci")} {rm(s.ci)}</b></div>
            <div className="tier-bar" aria-hidden="true">
              {tiers.map((x) => <i key={x.i} style={{ width: (x.portion / s.ci) * 100 + "%", background: tierColor(x.i) }}></i>)}
            </div>
            <ul className="tier-list">
              {tiers.map((x, k) => (
                <li key={x.i}>
                  <span className="sw" style={{ background: tierColor(x.i) }}></span>
                  <span>{t(k ? "tv.next" : "tv.first", { v: fmt(x.portion) })}</span>
                  <span className="rt">{pct(x.rate)}</span>
                  <span className="tx">{rm2(x.tax)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="tv-sec lines">
          {s.rebate ? (
            <>
              <div className="line strong"><span>{t("tv.incomeTax")}</span><b>{rm2(s.incomeTax)}</b></div>
              <div className="line"><span>{t("tv.rebate")}</span><b>− {rm2(s.rebate)}</b></div>
              <div className="line total"><span>{label}</span><b>{rm2(s.charged)}</b></div>
            </>
          ) : (
            <div className="line total solo"><span>{label}</span><b>{rm2(s.charged)}</b></div>
          )}
        </div>
        <p className="tv-foot">{t("tv.foot")}</p>
      </>
    );
  }
  return <div id="viewTax" role="tabpanel" aria-labelledby="tabTax" aria-live="polite" hidden={hidden}>{body}</div>;
}

const ResultCard = forwardRef(function ResultCard({ result, t, tab, setTab, reliefsOn, onEnableReliefs }, ref) {
  const track = () => {
    if (typeof window.gtag === "function") window.gtag("event", "tax_calc_start", { saving: Math.round(result.saving), reliefs: reliefsOn });
  };
  return (
    <section className="card result-card" id="resultCard" aria-label="Result" ref={ref}>
      <div className="tabs" role="tablist">
        <button type="button" role="tab" id="tabSave" aria-controls="viewSave" aria-selected={tab === "save"} onClick={() => setTab("save")}>{t("tab.save")}</button>
        <button type="button" role="tab" id="tabTax" aria-controls="viewTax" aria-selected={tab === "tax"} onClick={() => setTab("tax")}>{t("tab.tax")}</button>
      </div>
      <SavingView result={result} t={t} hidden={tab !== "save"} />
      <TaxView result={result} t={t} hidden={tab !== "tax"} onEnable={onEnableReliefs} />
      <div className="cta">
        <a className="btn-primary" href="https://prsenrolment.ppa.my" target="_blank" rel="noopener noreferrer" onClick={track}>
          <span>{t("cta.start")}</span><Icon id="i-arrow" size={18} />
        </a>
      </div>
    </section>
  );
});

export default ResultCard;
