/* تنبيه قصير أسفل الشاشة — يُستدعى من أي مكون عبر useToast(). */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";

const Ctx = createContext(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [t, setT] = useState(null);
  const timer = useRef(null);

  const toast = useCallback((msg, bad = false) => {
    setT({ msg: String(msg ?? ""), bad, id: Date.now() });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setT((x) => (x ? { ...x, closing: true } : null)), 2900);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className="admin-root ui-overlay">
        <div className={"toast" + (t && !t.closing ? " on" : "") + (t && t.bad ? " bad" : "")} role="status" aria-live="polite">
          {t && (
            <>
              <Icon name={t.bad ? "alert" : "check"} strokeWidth={t.bad ? 2 : 2.4} />
              <span>{t.msg}</span>
            </>
          )}
        </div>
      </div>
    </Ctx.Provider>
  );
}
