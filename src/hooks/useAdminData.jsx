/* مخزن مشترك للتجارب والجلسات: يُحمَّل مرة ويُشارَك بين الصفحات،
   حتى لا يعيد كل انتقال طلب البيانات نفسها من جديد. */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { listQuizzes, listSessions } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

const Ctx = createContext(null);
export const useAdminData = () => useContext(Ctx);

export function AdminDataProvider({ children }) {
  const { pw, authed } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const inflight = useRef(null);

  const refresh = useCallback(async () => {
    if (!pw) return;
    if (inflight.current) return inflight.current;
    const job = Promise.all([listQuizzes(pw), listSessions(pw, null)])
      .then(([qs, ss]) => {
        setQuizzes(qs || []);
        setSessions(ss || []);
        setError(null);
        setLoaded(true);
      })
      .catch((e) => { setError(e.message); setLoaded(true); })
      .finally(() => { inflight.current = null; });
    inflight.current = job;
    return job;
  }, [pw]);

  const refreshQuizzes = useCallback(async () => {
    if (!pw) return;
    const qs = await listQuizzes(pw);
    setQuizzes(qs || []);
    return qs;
  }, [pw]);

  const refreshSessions = useCallback(async () => {
    if (!pw) return;
    const ss = await listSessions(pw, null);
    setSessions(ss || []);
    return ss;
  }, [pw]);

  useEffect(() => {
    if (authed && !loaded) refresh();
    if (!authed) { setQuizzes([]); setSessions([]); setLoaded(false); }
  }, [authed, loaded, refresh]);

  const value = useMemo(
    () => ({ quizzes, sessions, loaded, error, refresh, refreshQuizzes, refreshSessions, setQuizzes, setSessions }),
    [quizzes, sessions, loaded, error, refresh, refreshQuizzes, refreshSessions]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
