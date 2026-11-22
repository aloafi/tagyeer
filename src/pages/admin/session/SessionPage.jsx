/* صفحة الجلسة: ترويسة ثابتة + تبويبات، وكل تبويب مسار مستقل في الرابط.
   النتائج تُحمَّل هنا مرة وتُمرَّر للتبويبات عبر Outlet context، وتُحدَّث كل 5 ثوانٍ. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useOutletContext, useParams } from "react-router-dom";
import { usePageHead } from "../../../layouts/AdminLayout.jsx";
import { useAuth } from "../../../lib/auth.jsx";
import { useAdminData } from "../../../hooks/useAdminData.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { ErrorBox, Spinner, Empty } from "../../../components/ui/Primitives.jsx";
import { sessionResults, setSessionStatus } from "../../../lib/api.js";
import { analyze } from "../../../lib/analytics.js";
import { ago } from "../../../lib/format.js";
import { joinLink } from "../../../lib/links.js";
import { csvOf, downloadCsv } from "../../../lib/csv.js";
import { LS, KEYS } from "../../../lib/storage.js";
import { useNavigate } from "react-router-dom";

const POLL_MS = 5000;

export const useSession = () => useOutletContext();

const TABS = [
  { to: ".", end: true, label: "نظرة عامة" },
  { to: "participants", label: "المشاركون" },
  { to: "analytics", label: "التحليلات" },
  { to: "matrix", label: "المصفوفات" },
  { to: "answers", label: "الإجابات" },
  { to: "settings", label: "الإعدادات" },
];

export default function SessionPage() {
  const { code } = useParams();
  const { pw } = useAuth();
  const { sessions, loaded, refreshSessions } = useAdminData();
  const toast = useToast();
  const nav = useNavigate();

  const [results, setResults] = useState(null);
  const [err, setErr] = useState(null);
  const [minN, setMinN] = useState(() => parseInt(LS.get(KEYS.minN) || "3", 10) || 3);
  const timer = useRef(null);

  const session = useMemo(
    () => sessions.find((s) => String(s.code).toUpperCase() === String(code).toUpperCase()) || null,
    [sessions, code]
  );

  const load = useCallback(
    async (quiet) => {
      if (!session) return;
      try {
        const r = await sessionResults(pw, session.id);
        setResults(r);
        setErr(null);
      } catch (e) {
        if (!quiet) setErr(e.message);
      }
    },
    [pw, session]
  );

  /* تحميل أولي ثم تحديث دوري يتوقف تلقائياً عند مغادرة الصفحة */
  useEffect(() => {
    if (!session) return;
    setResults(null);
    load(false);
    timer.current = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(timer.current);
  }, [session, load]);

  const toggle = useCallback(async () => {
    if (!session) return;
    const next = session.status === "open" ? "closed" : "open";
    try {
      await setSessionStatus(pw, session.id, next);
      await refreshSessions();
      toast(next === "open" ? "فُتحت الجلسة" : "أُغلقت الجلسة");
    } catch (e) { toast(e.message, true); }
  }, [session, pw, refreshSessions, toast]);

  const exportCsv = useCallback(() => {
    const r = results;
    if (!r) { toast("لا توجد بيانات بعد", true); return; }
    const an = analyze(r);
    const header = ["الاسم", "الجهة", "الدرجة", "من", "النسبة", "المستوى", "بدأ", "أنهى", ...an.qs.map((q) => q.question_text)];
    const rows = r.participants.map((p) => [
      p.name, p.meta || "", p.total_score ?? "", p.max_score ?? "", p.percent ?? "",
      ((p.band_emoji || "") + " " + (p.band_title || "")).trim(),
      p.started_at || "", p.finished_at || "",
      ...an.qs.map((q) => {
        const a = (p.answers || []).find((x) => x.position === q.position);
        return a ? a.label : "";
      }),
    ]);
    downloadCsv("tagyeer-" + r.session.code + ".csv", csvOf([header, ...rows]));
  }, [results, toast]);

  const copyLink = useCallback(() => {
    if (!session) return;
    const url = joinLink(session.code);
    navigator.clipboard?.writeText(url).then(() => toast("تم النسخ"), () => toast("تعذر النسخ", true));
  }, [session, toast]);

  usePageHead(
    {
      title: session ? session.quiz_title + " — " + session.code : "تفاصيل الجلسة",
      crumb: [{ label: "الجلسات", to: "/sessions" }, { label: "تفاصيل الجلسة" }],
    },
    [session?.id, session?.code, session?.quiz_title]
  );

  if (!loaded) return <Spinner big />;
  if (!session)
    return (
      <Empty icon="alert" title="الجلسة غير موجودة" action={<button className="btn" onClick={() => nav("/sessions")}>كل الجلسات</button>}>
        لا توجد جلسة بالرمز «{code}». ربما حُذفت أو أن الرمز غير صحيح.
      </Empty>
    );

  const open = session.status === "open";
  const an = results ? analyze(results) : null;

  const ctx = {
    session, results, an, minN,
    setMinN: (n) => { setMinN(n); LS.set(KEYS.minN, String(n), true); },
    reload: () => load(false),
    toggle, exportCsv,
  };

  return (
    <>
      <div className="shead">
        <div>
          <div className="t-xs dim">رمز الدخول</div>
          <div className="code">{session.code}</div>
        </div>
        <div className="grow" style={{ minWidth: 170 }}>
          <div className="t-lg ellip">{session.title || "جلسة بلا اسم"}</div>
          <div className="t-sm muted ellip">{session.quiz_title}</div>
          <div className="row" style={{ marginTop: 6, gap: 7 }}>
            <span className={"chip " + (open ? "live" : "off")}>
              <span className={"dot" + (open ? " pulse" : "")} />{open ? "مفتوحة" : "مغلقة"}
            </span>
            <span className="t-xs dim">أُنشئت {ago(session.created_at)}</span>
          </div>
        </div>
        <div className="row sp">
          <button className="btn gold sm" onClick={() => nav("/projection/" + session.code)}>شاشة العرض</button>
          <button className="btn ghost sm" onClick={copyLink}>نسخ رابط المشاركة</button>
          <button className="btn ghost sm" onClick={exportCsv}>تصدير البيانات</button>
          <button className="btn ghost sm" onClick={toggle}>{open ? "إغلاق الجلسة" : "إعادة الفتح"}</button>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <NavLink key={t.label} to={t.to} end={t.end} className={({ isActive }) => (isActive ? "on" : "")}>
            {t.label}
          </NavLink>
        ))}
      </div>

      <div className="pane on">
        {err ? <ErrorBox message={err} /> : !results ? <Spinner big /> : <Outlet context={ctx} />}
      </div>
    </>
  );
}
