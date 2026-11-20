import { useEffect, useState } from "react";
import { NAV_PATHS } from "../lib/i18n.js";
import { Icon } from "./Icons.jsx";

function NavLinks({ t, lang }) {
  return (
    <>
      {["home", "savings", "drawdown"].map((k) => (
        <a key={k} className="nav-pill" href={"https://prscalculator.ppa.my" + NAV_PATHS[lang][k]}>{t("nav." + k)}</a>
      ))}
      <a className="nav-pill is-active" href="#top" aria-current="page">{t("nav.tax")}</a>
    </>
  );
}

function Actions({ t, lang, setLang }) {
  return (
    <>
      <div className="lang-toggle" role="group" aria-label={t("lang.label")}>
        <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
        <button type="button" aria-pressed={lang === "bm"} onClick={() => setLang("bm")}>BM</button>
      </div>
      <a className="btn-primary btn-sm" href="https://www.prsmember.my" target="_blank" rel="noopener noreferrer">{t("nav.login")}</a>
      <a className="btn-secondary btn-sm" href="https://prsenrolment.ppa.my" target="_blank" rel="noopener noreferrer">{t("nav.enrol")}</a>
    </>
  );
}

export default function Header({ t, lang, setLang }) {
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={"prs-header" + (compact ? " is-compact" : "") + (open ? " menu-open" : "")} id="header">
      <div className="app-container">
        <div className="header-row">
          <a className="logo" href="https://www.ppa.my" target="_blank" rel="noopener noreferrer" aria-label="Open PPA website">
            <img src="https://prscalculator.ppa.my/picture2.png" alt="PPA Logo" width="450" height="148" />
          </a>
          <nav className="nav" aria-label="Primary"><NavLinks t={t} lang={lang} /></nav>
          <div className="header-actions"><Actions t={t} lang={lang} setLang={setLang} /></div>
          <button type="button" className="menu-btn" id="menuBtn" aria-expanded={open} aria-controls="mobileMenu" aria-label="Menu" onClick={() => setOpen(!open)}>
            <Icon id={open ? "i-x" : "i-menu"} size={22} />
          </button>
        </div>
        <div className={"mobile-menu" + (open ? " is-open" : "")} id="mobileMenu">
          <NavLinks t={t} lang={lang} />
          <div className="row"><Actions t={t} lang={lang} setLang={setLang} /></div>
        </div>
      </div>
    </header>
  );
}
