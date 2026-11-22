import useDocumentTitle from "../../../hooks/useDocumentTitle.js";
import { useSession } from "./SessionPage.jsx";
import { Kpi, ChartCard, Chip } from "../../../components/ui/Primitives.jsx";
import { Donut, DonutLegend } from "../../../components/charts/Charts.jsx";
import { SCALE } from "../../../lib/config.js";
import { ago, initialOf } from "../../../lib/format.js";

export default function TabOverview() {
  const { session, results: r } = useSession();
  useDocumentTitle("نظرة عامة — " + session.code);

  const st = r.stats;
  const mx = r.quiz.max_score || 0;
  const rate = st.joined ? Math.round((st.finished / st.joined) * 100) : 0;
  const started = r.participants.filter((p) => (p.answers || []).length > 0).length;

  const segs = (st.bands || []).map((b, i) => ({
    k: (b.emoji ? b.emoji + " " : "") + (b.title || "غير محدد"),
    v: b.n,
    c: SCALE[i % SCALE.length],
  }));

  const feed = r.participants.slice(0, 6);

  return (
    <>
      <div className="kpis sec">
        <Kpi label="انضم" value={st.joined} sub="عدد من دخل الجلسة بالرمز" icon="users" />
        <Kpi label="بدأ الإجابة" value={started} sub="سجّل إجابة واحدة على الأقل" icon="pencil" />
        <Kpi label="أكمل" value={st.finished} sub={"أنهى كل الأسئلة · " + rate + "% من المنضمين"} icon="checkBox" />
        <Kpi label="متوسط الدرجة" value={st.avg_score ?? "—"} sub={"من " + mx + " درجة · عينة " + st.finished + " مكتمل"} icon="chart" />
        <Kpi label="متوسط النسبة" value={st.avg_percent != null ? st.avg_percent + "%" : "—"} sub="الدرجة كنسبة من الدرجة الكاملة" icon="smile" />
      </div>

      <div className="chartgrid">
        {segs.length > 0 && (
          <ChartCard title="توزيع المستويات" desc={"المستوى الذي وصله كل مشارك · عينة " + st.finished + " مشارك مكتمل"}>
            <div className="donutwrap">
              <Donut segs={segs} />
              <DonutLegend segs={segs} />
            </div>
          </ChartCard>
        )}

        <ChartCard title="النشاط الأخير" desc="آخر من انضم أو أكمل · يتحدث كل 5 ثوانٍ">
          {feed.length ? (
            <div className="feed">
              {feed.map((p) => {
                const done = !!p.finished_at;
                return (
                  <div className="feedrow" key={p.id}>
                    <span className={"av" + (done ? " done" : "")}>{initialOf(p.name)}</span>
                    <span className="who">
                      <b>{p.name}</b>
                      {p.meta ? <span>{p.meta}</span> : null}
                    </span>
                    <Chip kind={done ? "live" : "grey"}>{done ? "أكمل" : "يجيب"}</Chip>
                    <span className="when">{ago(p.finished_at || p.started_at)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="t-sm dim">بانتظار أول مشارك.</p>
          )}
        </ChartCard>
      </div>
    </>
  );
}
