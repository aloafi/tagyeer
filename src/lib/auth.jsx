/* حالة الدخول للمسؤول. كلمة المرور لا تُخزَّن في الشيفرة ولا تُرسل إلا إلى دوال
   قاعدة البيانات التي تتحقق منها؛ إخفاء الواجهة ليس حماية بحد ذاته. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { adminLogin } from "./api.js";
import { LS, KEYS } from "./storage.js";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [pw, setPw] = useState(() => LS.get(KEYS.pw) || "");
  const [checking, setChecking] = useState(() => !!LS.get(KEYS.pw));

  /* مفتاح محفوظ من زيارة سابقة يُتحقَّق منه مرة واحدة عند الإقلاع */
  useEffect(() => {
    let alive = true;
    const saved = LS.get(KEYS.pw);
    if (!saved) { setChecking(false); return; }
    adminLogin(saved)
      .then((ok) => { if (alive && !ok) { LS.del(KEYS.pw); setPw(""); } })
      .catch(() => { /* تعذّر التحقق الآن — نُبقي الجلسة ونترك النداء التالي يفصل */ })
      .finally(() => { if (alive) setChecking(false); });
    return () => { alive = false; };
  }, []);

  const login = useCallback(async (value, remember) => {
    const ok = await adminLogin(value);
    if (!ok) throw new Error("كلمة المرور غير صحيحة.");
    LS.set(KEYS.pw, value, !!remember);
    setPw(value);
    return true;
  }, []);

  const logout = useCallback(() => { LS.del(KEYS.pw); setPw(""); }, []);

  const value = useMemo(() => ({ pw, authed: !!pw, checking, login, logout, setPw }), [pw, checking, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
