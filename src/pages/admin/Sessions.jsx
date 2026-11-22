/* مركز الجلسات — مؤشرات عامة، فلاتر محفوظة في الرابط، وشبكة بطاقات. */
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { usePageHead } from "../../layouts/AdminLayout.jsx";
import { useAdminData } from "../../hooks/useAdminData.jsx";
import useNewSession from "../../hooks/useNewSession.js";
import { Kpi, Empty, ErrorBox, Spinner } from "../../components/ui/Primitives.jsx";
import Icon from "../../components/ui/Icon.jsx";
import SessionCard from "../../components/SessionCard.jsx";

export default function Sessions() {
  const { quizzes, sessions, loaded, error } = useAdminData();
  const newSession = useNewSession();
  const [sp, setSp] = useSearchParams();

  usePageHead({ title: "الجلسات", actions: <button className="btn" onClick={() => newSession()}>+ جلسة جديدة</button> }, [newSession]);

  /* الفلاتر في الرابط: يمكن مشاركة العرض المفلتر والرجوع إليه بزر الخلف */
  const f = {
    q: sp.get("q") || "",
    quiz: sp.get("quiz") || "",
    state: sp.get("state") || "",
    days: sp.get("days") || "",
    sort: sp.get("sort") || "new",
    view: sp.get("view") || "grid",
  };
  const set = (k, v) => {
    const next = new URLSearchParams(sp);
    if (v) next.set(k, v); else next.delete(k);
    setSp(next, { replace: true });
  };

  const scoped = useMemo(
    () => (f.quiz ? sessions.filter((s) => s.quiz_id === f.quiz) : sessions),
    [sessions, f.quiz]
  );

  const list = useMemo(() => {
    const term = f.q.trim().toUpperCase();
    let l = scoped.slice();
    if (term) l = l.filter((s) => ((s.code || "") + " " + (s.title || "") + " " + (s.quiz_title || "")).toUpperCase().includes(term));
    if (f.state) l = l.filter((s) => s.status === f.state);
    const days = +f.days || 0;
    if (days) l = l.filter((s) => Date.now() - new Date(s.created_at).getTime() <= days * 86400000);
    l.sort((a, b) =>
      f.sort === "joined" ? (b.joined || 0) - (a.joined || 0)
      : f.sort === "rate" ? (b.joined ? b.finished / b.joined : 0) - (a.joined ? a.finished / a.joined : 0)
      : new Date(b.created_at) - new Date(a.created_at)
    );
    return l;
  }, [scoped, f.q, f.state, f.days, f.sort]);

  const k = useMemo(() => {
    const joined = scoped.reduce((a, s) => a + (s.joined || 0), 0);
    const fin = scoped.reduce((a, s) => a + (s.finished || 0), 0);
    const rates = scoped.filter((s) => s.joined > 0).map((s) => (s.finished / s.joined) * 100);
    return {
      joined, fin,
      open: scoped.filter((s) => s.status === "open").length,
      closed: scoped.filter((s) => s.status !== "open").length,
      avgRate: rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0,
      n: rates.length,
    };
  }, [scoped]);

  if (error) return <ErrorBox message={error} />;
  if (!loaded) return <Spinner big />;

  return (
    <>
      <div className="kpis sec">
        <Kpi label="إجمالي الجلسات" value={scoped.length} sub="في كل التجارب" icon="clock" />
        <Kpi label="الجلسات النشطة" value={k.open} sub="مفتوحة لاستقبال المشاركين" icon="wifi" />
        <Kpi label="الجلسات المغلقة" value={k.closed} sub="لا تستقبل دخولاً جديداً" icon="checkBox" />
        <Kpi label="إجمالي المشاركين" value={k.joined} sub={k.fin + " أكملوا التجربة"} icon="usersWide" />
        <Kpi label="متوسط الإكمال" value={k.avgRate + "%"} sub={"متوسط نسب الإكمال عبر " + k.n + " جلسة"} icon="chart" />
      </div>

      <div className="toolbar">
        <div className="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input className="inp" placeholder="ابحث باسم الجلسة أو رمزها…" value={f.q} onChange={(e) => set("q", e.target.value)} />
        </div>

        <select className="inp" style={{ width: "auto", minWidth: 180 }} value={f.quiz} onChange={(e) => set("quiz", e.target.value)} aria-label="التجربة">
          <option value="">كل التجارب</option>
          {quizzes.map((q) => <option key={q.id} value={q.id}>{q.title}</option>)}
        </select>

        <select className="inp" style={{ width: "auto", minWidth: 125 }} value={f.state} onChange={(e) => set("state", e.target.value)} aria-label="الحالة">
          <option value="">كل الحالات</option><option value="open">مفتوحة</option><option value="closed">مغلقة</option>
        </select>

        <select className="inp" style={{ width: "auto", minWidth: 125 }} value={f.days} onChange={(e) => set("days", e.target.value)} aria-label="التاريخ">
          <option value="">كل التواريخ</option><option value="1">اليوم</option><option value="7">آخر 7 أيام</option><option value="30">آخر 30 يوماً</option>
        </select>

        <select className="inp" style={{ width: "auto", minWidth: 150 }} value={f.sort} onChange={(e) => set("sort", e.target.value)} aria-label="الترتيب">
          <option value="new">الأحدث</option><option value="joined">الأكثر مشاركين</option><option value="rate">الأعلى إكمالاً</option>
        </select>

        <div className="seg sp">
          <button className={f.view === "grid" ? "on" : ""} onClick={() => set("view", "")} title="شبكة"><Icon name="grid4" strokeWidth={1.8} /></button>
          <button className={f.view === "list" ? "on" : ""} onClick={() => set("view", "list")} title="قائمة"><Icon name="rows" strokeWidth={1.8} /></button>
        </div>
      </div>

      {!sessions.length ? (
        <Empty icon="wifi" title="لا توجد جلسات" action={<button className="btn" onClick={() => newSession()}>+ جلسة جديدة</button>}>
          الجلسة تشغيل مستقل لتجربة، لها رمز دخول ونتائج خاصة بها.
        </Empty>
      ) : !list.length ? (
        <Empty title="لا نتائج">لا توجد جلسة مطابقة للفلاتر الحالية.</Empty>
      ) : (
        <div className={"sgrid" + (f.view === "list" ? " list" : "")}>
          {list.map((s) => <SessionCard key={s.id} s={s} />)}
        </div>
      )}
    </>
  );
}
