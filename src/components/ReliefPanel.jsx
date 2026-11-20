import { GROUPS, HOUSE_CAP, ITEMS, KIDS, AUTO_FILL, itemValue } from "../lib/tax.js";
import { fmt, rm, hint, parseNum } from "../lib/format.js";
import { freshKids } from "../lib/state.js";
import { Icon } from "./Icons.jsx";
import MoneyInput from "./MoneyInput.jsx";

const blankIfZero = (v) => (v ? fmt(v) : "");

function Field({ it, state, t, update }) {
  if (it.type === "fixed") {
    return (
      <div className="field">
        <div className="f-head"><span className="f-label">{t("d." + it.id)}</span><span className="f-cap">{t("rl.automatic")}</span></div>
        <div className="input-locked"><span>{rm(it.amount)}</span><Icon id="i-lock" size={15} /></div>
        <p className="f-foot"></p>
      </div>
    );
  }
  const note = hint(t, it.id);
  return (
    <div className="field">
      <div className="f-head">
        <label className="f-label" htmlFor={"d-" + it.id}>{t("d." + it.id)}</label>
        <span className="f-cap">{Number.isFinite(it.cap) ? t("rl.max", { v: fmt(it.cap) }) : t("rl.noCap")}</span>
      </div>
      <MoneyInput
        small id={"d-" + it.id} placeholder="0" value={itemValue(it, state)} format={blankIfZero}
        onValue={(raw) => update((s) => { s.ded[it.id] = Math.min(ITEMS[it.id].cap, parseNum(raw)); })}   // workbook rejects amounts above the limit
      />
      <p className="f-foot">
        {it.auto && (
          <button type="button" className="f-auto" onClick={() => update((s) => { s.ded[it.id] = AUTO_FILL[it.auto](s.income); })}>
            <Icon id="i-calc" size={12} />{t("rl.auto." + it.auto)}
          </button>
        )}
        {note && <span>{note}</span>}
      </p>
    </div>
  );
}

function Toggle({ it, state, t, update }) {
  return (
    <label className="toggle-tile">
      <input type="checkbox" checked={!!state.ded[it.id]} onChange={(e) => update((s) => { s.ded[it.id] = e.target.checked; })} />
      <span className="tt-check"><Icon id="i-check" size={12} /></span>
      <span className="tt-text">{t("d." + it.id)}</span>
      <span className="tt-amt">{rm(it.amount)}</span>
    </label>
  );
}

function Stepper({ k, col, state, t, update }) {
  const v = state.kids[k][col], label = t(col ? "k.half" : "k.full");
  const step = (d) => update((s) => { s.kids[k][col] = Math.max(0, Math.min(20, s.kids[k][col] + d)); });
  return (
    <div>
      <span className="kid-cap">{label}</span>
      <div className={"stepper" + (v ? " has-val" : "")} role="group" aria-label={`${t("k." + k)}, ${label}`}>
        <button type="button" aria-label="−" disabled={!v} onClick={() => step(-1)}>−</button>
        <output>{v}</output>
        <button type="button" aria-label="+" onClick={() => step(1)}>+</button>
      </div>
    </div>
  );
}

function Kids(props) {
  const { t } = props;
  return (
    <div className="wide">
      <div className="f-head"><span className="f-label">{t("d.kids")}</span></div>
      <p className="f-foot">{t("h.kids")}</p>
      <div className="kids-list">
        <div className="kid-row kid-head"><span></span><span>{t("k.full")}</span><span>{t("k.half")}</span></div>
        {KIDS.map(([k, full]) => (
          <div className="kid-row" key={k}>
            <div className="kid-label">{t("k." + k)}<small>{t("k.each", { v: fmt(full) })}</small></div>
            <Stepper {...props} k={k} col={0} />
            <Stepper {...props} k={k} col={1} />
          </div>
        ))}
      </div>
    </div>
  );
}

function House({ state, t, update }) {
  return (
    <div className="wide">
      <div className="f-head"><span className="f-label">{t("d.house")}</span></div>
      <p className="f-foot">{t("h.house")}</p>
      <div className="seg2">
        {Object.keys(HOUSE_CAP).map((b) => (
          <label key={b}>
            <input type="radio" name="houseBand" checked={state.house.band === b}
              onChange={() => update((s) => { s.house.band = b; s.house.amt = Math.min(HOUSE_CAP[b], s.house.amt); })} />
            <b>{t("hs." + b)}</b><small>{t("rl.max", { v: fmt(HOUSE_CAP[b]) })}</small>
          </label>
        ))}
      </div>
      <label className="sub-label" htmlFor="houseAmt">{t("hs.amt")}</label>
      <MoneyInput
        small id="houseAmt" placeholder="0" value={Math.min(HOUSE_CAP[state.house.band], state.house.amt)} format={blankIfZero}
        onValue={(raw) => update((s) => { s.house.amt = Math.min(HOUSE_CAP[s.house.band], parseNum(raw)); })}
      />
    </div>
  );
}

/* Keep item order; consecutive amount fields / tick tiles share one grid. */
function GroupBody({ g, ...props }) {
  const parts = [];
  for (const it of g.items) {
    if (it.type === "kids") { parts.push(<Kids key={it.id} {...props} />); continue; }
    if (it.type === "house") { parts.push(<House key={it.id} {...props} />); continue; }
    const kind = it.type === "check" ? "toggles" : "fields";
    const el = kind === "toggles" ? <Toggle key={it.id} it={it} {...props} /> : <Field key={it.id} it={it} {...props} />;
    const last = parts[parts.length - 1];
    if (last && last.kind === kind) last.items.push(el); else parts.push({ kind, items: [el] });
  }
  return parts.map((p, i) => (p.kind ? <div key={i} className={p.kind}>{p.items}</div> : p));
}

export default function ReliefPanel({ state, relief, t, update, openGroups, setGroupOpen }) {
  const deducted = Math.min(relief.donations + relief.reliefs, state.income);
  const ciPct = state.income > 0 ? (relief.ci / state.income) * 100 : 0;
  const props = { state, t, update };

  return (
    <div className="rl-body" id="reliefPanel" hidden={!state.reliefsOn}>
      <div className="flow" aria-live="polite">
        <div className="flow-grid">
          <div className="flow-item"><span>{t("rl.income")}</span><b>{rm(state.income)}</b></div>
          <div className="flow-op" aria-hidden="true">−</div>
          <div className="flow-item minus"><span>{t("rl.deduct")}</span><b>{rm(deducted)}</b></div>
          <div className="flow-op" aria-hidden="true">=</div>
          <div className="flow-item result"><span>{t("rl.ci")}</span><b>{rm(relief.ci)}</b></div>
        </div>
        <div className="flow-bar" aria-hidden="true">
          <i className="fb-ci" style={{ width: ciPct + "%" }}></i>
          <i className="fb-rel" style={{ width: (state.income > 0 ? 100 - ciPct : 0) + "%" }}></i>
        </div>
        <p className="flow-note">{t("rl.note")}</p>
      </div>

      {GROUPS.map((g) => {
        const total = relief.groupTotals[g.id];
        const n = g.items.filter((it) => it.type !== "fixed" && itemValue(it, state) > 0).length;
        return (
          <details key={g.id} className="cat" open={openGroups.has(g.id)} onToggle={(e) => setGroupOpen(g.id, e.currentTarget.open)}>
            <summary>
              <span className="cat-icon"><Icon id={g.icon} size={18} /></span>
              <span className="cat-text">
                <span className="cat-title">{t("g." + g.id)}</span>
                <span className="cat-meta">{n ? t("g.meta", { n }) : t(g.id === "auto" ? "g.metaAuto" : "g.metaNone")}</span>
              </span>
              <span className={"cat-total" + (total <= 0 ? " is-zero" : "")}>{rm(total)}</span>
              <span className="cat-chev"><Icon id="i-chevron" /></span>
            </summary>
            <div className="cat-body"><GroupBody g={g} {...props} /></div>
          </details>
        );
      })}

      <div className="rl-foot">
        <button type="button" className="rl-reset" onClick={() => update((s) => { Object.assign(s, { ded: {}, kids: freshKids(), house: { band: "500", amt: 0 } }); })}>
          <Icon id="i-reset" size={14} />{t("rl.reset")}
        </button>
      </div>
    </div>
  );
}
