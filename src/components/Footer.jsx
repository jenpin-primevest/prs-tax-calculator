import { YEAR } from "../lib/format.js";

export default function Footer({ t }) {
  return (
    <footer>
      <div className="app-container">
        <strong>{t("ftr.disc")}</strong>
        <p>{t("ftr.calc")}</p>
        <p>{t("ftr.body")}</p>
        <hr />
        <div className="footer-row">
          <div><a href="https://www.ppa.my" target="_blank" rel="noopener noreferrer" aria-label="Open PPA website"><img src="https://prscalculator.ppa.my/picture2.png" alt="PPA PRS" width="450" height="148" loading="lazy" /></a></div>
          <div>{t("ftr.copy", { y: YEAR })}</div>
          <div>
            <a href="https://www.ppa.my/terms-of-use/" target="_blank" rel="noopener noreferrer">{t("ftr.terms")}</a>
            <span className="sep">|</span>
            <a href="https://www.ppa.my/privacy-statement/" target="_blank" rel="noopener noreferrer">{t("ftr.privacy")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
