import { BANDS, PRS_RELIEF } from "../lib/tax.js";
import { rm, pct, bandLabel } from "../lib/format.js";
import { Icon } from "./Icons.jsx";

export default function BracketsTable({ t, relief, idx, onPick }) {
  return (
    <section className="block" aria-labelledby="bracketsTitle">
      <div className="card">
        <h2 className="card-title" id="bracketsTitle"><span className="icon-tile"><Icon id="i-table" size={20} /></span><span>{t("tb.title")}</span></h2>
        <p className="table-sub">{t("tb.sub")}</p>
        <table className="brackets">
          <thead><tr>
            <th>{`${t(relief ? "rl.ci" : "in.income")} (RM)`}</th>
            <th className="num">{t("tb.rate")}</th>
            <th className="num">{t("tb.saving")}</th>
            <th className="num cost-col">{t("r.cost")}</th>
          </tr></thead>
          <tbody>
            {BANDS.map(([, , r], i) => {
              const saved = PRS_RELIEF * r, current = i === idx;
              return (
                <tr key={i} className={current ? "is-current" : ""} onClick={() => onPick(i)}>
                  <td>{bandLabel(t, i)}{current && <span className="you">{t("tb.you")}</span>}</td>
                  <td className="num">{pct(r)}</td>
                  <td className="num save">{rm(saved)}</td>
                  <td className="num cost-col">{rm(PRS_RELIEF - saved)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
