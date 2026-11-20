import { useState } from "react";

/* RM text input. While focused it shows exactly what was typed; on blur it
   shows the stored (capped, formatted) value — same as the HTML version. */
export default function MoneyInput({ id, value, format, onValue, small, selectOnFocus, ...rest }) {
  const [draft, setDraft] = useState(null);
  return (
    <div className={"money-input" + (small ? " sm" : "")}>
      <span>RM</span>
      <input
        className="input-glass"
        id={id}
        inputMode="numeric"
        autoComplete="off"
        value={draft ?? format(value)}
        onFocus={(e) => { setDraft(format(value)); if (selectOnFocus) e.target.select(); }}
        onChange={(e) => { setDraft(e.target.value); onValue(e.target.value); }}
        onBlur={() => setDraft(null)}
        {...rest}
      />
    </div>
  );
}
