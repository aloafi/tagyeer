/* نافذة حوار واحدة تخدم ثلاث حالات: تأكيد، إدخال نص، واختيار من بطاقات.
   تُستدعى بـ await ask({...}) فتعيد القيمة أو null عند الإلغاء. */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";

const Ctx = createContext(async () => null);
export const useAsk = () => useContext(Ctx);

export function DialogProvider({ children }) {
  const [cfg, setCfg] = useState(null);
  const [sel, setSel] = useState(null);
  const [val, setVal] = useState("");
  const resolver = useRef(null);
  const inputRef = useRef(null);
  const firstPick = useRef(null);

  const ask = useCallback(
    (opts) =>
      new Promise((res) => {
        resolver.current = res;
        setSel(null);
        setVal("");
        setCfg(opts || {});
      }),
    []
  );

  const done = useCallback((v) => {
    setCfg(null);
    const r = resolver.current;
    resolver.current = null;
    if (r) r(v);
  }, []);

  useEffect(() => {
    if (!cfg) return;
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); done(null); }
    };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => {
      if (cfg.choices) firstPick.current?.focus();
      else if (cfg.input) inputRef.current?.focus();
    }, 80);
    return () => { document.removeEventListener("keydown", onKey); clearTimeout(t); };
  }, [cfg, done]);

  const picks = cfg?.choices || null;
  const confirmDisabled = !!picks && sel == null;

  const confirm = () => {
    if (picks) { if (sel == null) return; done(sel); }
    else done(cfg.input ? val : true);
  };

  return (
    <Ctx.Provider value={ask}>
      {children}
      <div className="admin-root ui-overlay"><div className={"modal" + (cfg ? " on" : "")} role={cfg ? "dialog" : undefined} aria-modal={cfg ? "true" : undefined}>
        {cfg && (
          <div className={"box" + (picks ? " wide" : "")}>
            <h3>{cfg.title}</h3>
            {cfg.text ? <p>{cfg.text}</p> : null}

            {picks && (
              <div className="picklist on" role="radiogroup" aria-label={cfg.title}>
                {picks.map((c, i) => (
                  <button
                    key={c.v ?? i}
                    ref={i === 0 ? firstPick : null}
                    type="button"
                    className={"pickopt" + (sel === c.v ? " sel" : "")}
                    role="radio"
                    aria-checked={sel === c.v}
                    onClick={() => setSel(c.v)}
                    onDoubleClick={() => done(c.v)}
                  >
                    <span className="pemo">{c.emoji || "🌱"}</span>
                    <span className="ptx">
                      <b>{c.title}</b>
                      {c.sub ? <span>{c.sub}</span> : null}
                    </span>
                    <span className="pck"><Icon name="check" strokeWidth={3} /></span>
                  </button>
                ))}
              </div>
            )}

            {cfg.input && (
              <input
                ref={inputRef}
                className="inp"
                style={{ marginBottom: 14 }}
                value={val}
                placeholder={cfg.placeholder || ""}
                onChange={(e) => setVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") confirm(); }}
              />
            )}

            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn ghost sm" onClick={() => done(null)}>إلغاء</button>
              <button
                className={"btn sm" + (cfg.danger ? " danger" : "")}
                disabled={confirmDisabled}
                onClick={confirm}
              >
                {cfg.yes || "تأكيد"}
              </button>
            </div>
          </div>
        )}
      </div></div>
    </Ctx.Provider>
  );
}
