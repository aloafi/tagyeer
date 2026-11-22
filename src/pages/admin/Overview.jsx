import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePageHead } from "../../layouts/AdminLayout.jsx";
import { useAdminData } from "../../hooks/useAdminData.jsx";
import { Kpi, ChartCard, ErrorBox, Spinner, Chip } from "../../components/ui/Primitives.jsx";
import { RankList } from "../../components/charts/Charts.jsx";
import SessionCard from "../../components/SessionCard.jsx";
import { ago } from "../../lib/format.js";

export default function Overview() {
  usePageHead({ title: "نظرة عامة" }, []);
  const { quizzes, sessions, loaded, error } = useAdminData();
  const nav = useNavigate();

  const m = useMemo(() => {
    const joined = sessions.reduce((a, s) => a + (s.joined || 0), 0);
    const finished = sessions.reduce((a, s) => a + (s.finished || 0), 0);
    return {
      joined,
      finished,
      rate: joined ? Math.round((finished / joined) * 100) : 0,
      live: sessions.filter((s) => s.status === "open"),
      totResp: quizzes.reduce((a, q) => a + (q.responses_count || 0), 0),
      top: quizzes
        .slice()
        .sort((a, b) => (b.responses_count || 0) - (a.responses_count || 0))
        .filter((q) => q.responses_count > 0)
        .slice(0, 6),
      recent: sessions.slice(0, 7),
    };
  }, [quizzes, sessions]);

  if (error) return <ErrorBox message={error} />;
  if (!loaded) return <Spinner big />;

  return (
    <>
      <div className="kpis sec">
        <Kpi label="التجارب" value={quizzes.length} sub="تجربة منشأة" icon="book" />
        <Kpi label="الجلسات" value={sessions.length} sub={m.live.length + " مفتوحة الآن"} icon="clock" />
        <Kpi label="المشاركون" value={m.joined} sub="إجمالي من انضم لكل الجلسات" icon="usersWide" />
        <Kpi label="معدل الإكمال" value={m.rate + "%"} sub={m.finished + " أكملوا من " + m.joined} icon="checkBox" />
      </div>

      {m.live.length > 0 && (
        <div className="sec">
          <div className="sechead">
            <h2 className="t-lg">جلسات مفتوحة الآن</h2>
            <Chip kind="live" dot="pulse">{m.live.length}</Chip>
          </div>
          <div className="sgrid">
            {m.live.map((s) => <SessionCard key={s.id} s={s} />)}
          </div>
        </div>
      )}

      <div className="chartgrid">
        <ChartCard
          title="التجارب الأكثر استخداماً"
          desc={"ترتيب التجارب بعدد المشاركات المكتملة، من إجمالي " + m.totResp + " مشاركة"}
        >
          <RankList
            share
            items={m.top.map((q) => ({
              k: (q.cover_emoji ? q.cover_emoji + " " : "") + q.title,
              v: q.responses_count,
              t: String(q.responses_count),
            }))}
            empty="لا توجد مشاركات مكتملة بعد."
          />
        </ChartCard>

        <ChartCard title="آخر الجلسات" desc={"أحدث " + m.recent.length + " جلسة حسب تاريخ الإنشاء"}>
          {m.recent.length ? (
            m.recent.map((s) => (
              <div
                key={s.id}
                className="row"
                onClick={() => nav("/sessions/" + s.code)}
                style={{ padding: "8px 0", borderBottom: "1px solid var(--border)", gap: 9, cursor: "pointer" }}
              >
                <Chip kind={s.status === "open" ? "live" : "off"} dot>
                  {s.status === "open" ? "مفتوحة" : "مغلقة"}
                </Chip>
                <span className="t-sm grow ellip">{s.quiz_title}</span>
                <span className="t-xs num muted">{s.joined} مشارك</span>
                <span className="t-xs dim">{ago(s.created_at)}</span>
              </div>
            ))
          ) : (
            <p className="t-sm dim">لا توجد جلسات بعد.</p>
          )}
        </ChartCard>
      </div>
    </>
  );
}
