/* التحليلات بأربع طبقات: فلاتر، رسوم، تفصيل كل سؤال، ثم البيانات الخام. */
import { useMemo, useState } from "react";
import useDocumentTitle from "../../../hooks/useDocumentTitle.js";
import { useSession } from "./SessionPage.jsx";
import { ChartCard, Empty, Legend } from "../../../components/ui/Primitives.jsx";
import { Histogram, RankList, StackedBars } from "../../../components/charts/Charts.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { SCALE, TYPES, TYPE_KEYS } from "../../../lib/config.js";
import { heatColor } from "../../../lib/format.js";
import { csvOf, downloadCsv } from "../../../lib/csv.js";

export default function TabAnalytics() {
  const { session, results: r, an } = useSession();
  useDocumentTitle("التحليلات — " + session.code);
  const toast = useToast();

  const [filter, setFilter] = useState("");
  const [raw, setRaw] = useState(false);
  const [open, setOpen] = useState(() => new Set());

  const allScored = useMemo(() => an.qs.filter((q) => q.qtype !== "text"), [an.qs]);
  const done = useMemo(() => r.participants.filter((p) => p.finished_at), [r.participants]);
  const scored = useMemo(() => (filter ? allScored.filter((q) => q.qtype === filter) : allScored), [allScored, filter]);
  const types = TYPE_KEYS.filter((t) => t !== "text" && allScored.some((q) => q.qtype === t));

  const hist = useMemo(() => {
    if (!done.length) return null;
    const mx = r.quiz.max_score || Math.max(1, ...done.map((p) => p.total_score || 0));
    const buckets = 5;
    const counts = new Array(buckets).fill(0);
    const labels = [];
    for (let i = 0; i < buckets; i++) labels.push(Math.round((mx * i) / buckets) + "–" + Math.round((mx * (i + 1)) / buckets));
    done.forEach((p) => {
      counts[Math.min(buckets - 1, Math.floor(((p.total_score || 0) / Math.max(1, mx)) * buckets))]++;
    });
    return { counts, labels, mx };
  }, [done, r.quiz.max_score]);

  const ranking = useMemo(
    () =>
      scored
        .map((q) => {
          const top = an.topOf(q.position) || 1;
          const p = Math.round((q.avg_value / top) * 100);
          return { k: "س" + q.position + ". " + q.question_text, v: p, t: p + "%", c: heatColor(p) };
        })
        .sort((a, b) => b.v - a.v),
    [scored, an]
  );

  const stacked = useMemo(() => {
    const keys = [];
    scored.forEach((q) => Object.keys(an.dist[q.position] || {}).forEach((k) => { if (!keys.includes(k)) keys.push(k); }));
    return { keys, rows: scored.map((q) => ({ k: "س" + q.position, v: an.dist[q.position] || {} })) };
  }, [scored, an]);

  const rawRows = useMemo(() => {
    const rows = [];
    scored.forEach((q) => {
      const d = an.dist[q.position] || {};
      const tot = Object.values(d).reduce((a, b) => a + b, 0);
      Object.keys(d)
        .sort((a, b) => d[b] - d[a])
        .forEach((k) => rows.push([q.position, q.question_text, TYPES[q.qtype]?.name || "", k, d[k], (tot ? Math.round((d[k] / tot) * 100) : 0) + "%"]));
    });
    return rows;
  }, [scored, an]);

  if (!done.length && !allScored.length)
    return <Empty icon="chart" title="لا توجد بيانات كافية">تظهر التحليلات فور إجابة أول مشارك.</Empty>;

  const toggleQ = (pos) => setOpen((s) => { const n = new Set(s); n.has(pos) ? n.delete(pos) : n.add(pos); return n; });

  return (
    <>
      <div className="toolbar">
        <select className="inp" style={{ width: "auto", minWidth: 180 }} value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="نوع السؤال">
          <option value="">كل الأسئلة المُقيَّمة ({allScored.length})</option>
          {types.map((t) => (
            <option key={t} value={t}>{TYPES[t].name} ({allScored.filter((q) => q.qtype === t).length})</option>
          ))}
        </select>
        <span className="chip grey">عينة {done.length} مشارك مكتمل من {r.stats.joined}</span>
        <button className="btn ghost sm sp" onClick={() => setRaw((v) => !v)}>
          {raw ? "إخفاء البيانات الخام" : "عرض البيانات الخام"}
        </button>
      </div>

      <div className="chartgrid sec">
        {hist && (
          <ChartCard title="توزيع الدرجات" desc={"كم مشاركاً وقع في كل شريحة من الدرجة الكاملة (" + hist.mx + " درجة)"}>
            <Histogram counts={hist.counts} labels={hist.labels} />
            <p className="axnote">المحور الأفقي: شريحة الدرجة · المحور الرأسي: عدد المشاركين · العينة {done.length}</p>
          </ChartCard>
        )}

        {scored.length > 0 && (
          <>
            <ChartCard title="ترتيب الأسئلة بالاستجابة" desc="متوسط كل سؤال كنسبة من أعلى درجة ممكنة له · الأعلى أولاً">
              <RankList items={ranking} max={100} />
            </ChartCard>

            <ChartCard
              title="توزيع الخيارات"
              desc="حصة كل خيار من إجابات كل سؤال"
              legend={<Legend items={stacked.keys.map((k, i) => ({ k, c: SCALE[i % SCALE.length] }))} />}
            >
              <StackedBars rows={stacked.rows} keys={stacked.keys} colors={SCALE} />
            </ChartCard>
          </>
        )}
      </div>

      {scored.length > 0 && (
        <>
          <div className="sechead">
            <h2 className="t-lg">تحليل تفصيلي لكل سؤال</h2>
            <span className="t-xs dim">اضغط على السؤال لعرض توزيع إجاباته</span>
          </div>

          {scored.map((q) => {
            const d = an.dist[q.position] || {};
            const ks = Object.keys(d).sort((a, b) => d[b] - d[a]);
            const tot = ks.reduce((a, k) => a + d[k], 0);
            const agree = tot ? Math.round((d[ks[0]] / tot) * 100) : 0;
            const top = an.topOf(q.position) || 1;
            const p = Math.round((q.avg_value / top) * 100);

            return (
              <div className={"qdet" + (open.has(q.position) ? " open" : "")} key={q.position}>
                <div className="qdh" onClick={() => toggleQ(q.position)}>
                  <span className="pos">{q.position}</span>
                  <span className="qtx ellip">{q.question_text}</span>
                  <span className="chip grey">{TYPES[q.qtype]?.name || ""}</span>
                  <span className="chip" style={{ background: heatColor(p), color: "#fff" }}>{p}%</span>
                  <span className="caret">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </div>
                <div className="qdb">
                  <div className="row" style={{ margin: "12px 0 14px", gap: 16 }}>
                    <div><div className="t-xs dim">المتوسط</div><b className="num">{q.avg_value} من {top}</b></div>
                    <div><div className="t-xs dim">عدد الإجابات</div><b className="num">{tot}</b></div>
                    <div><div className="t-xs dim">نسبة الاتفاق</div><b className="num">{agree}%</b></div>
                    <div className="grow"><div className="t-xs dim">الخيار الأكثر</div><b>{ks[0] || "—"}</b></div>
                  </div>
                  {ks.map((k, i) => {
                    const share = tot ? Math.round((d[k] / tot) * 100) : 0;
                    return (
                      <div className="obar" key={k}>
                        <span className="ellip" title={k}>{k}</span>
                        <span className="otrack"><i style={{ width: Math.max(2, share) + "%", background: SCALE[i % SCALE.length] }} /></span>
                        <span className="ov">{d[k]} ({share}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}

      {raw && (
        <>
          <div className="sechead" style={{ marginTop: 22 }}>
            <h2 className="t-lg">البيانات الخام</h2>
            <span className="chip grey">{rawRows.length} صف</span>
            <div className="sp">
              <button
                className="btn ghost sm"
                onClick={() => {
                  downloadCsv("بيانات-" + session.code + ".csv", csvOf([["رقم السؤال", "السؤال", "النوع", "الخيار", "العدد", "الحصة"], ...rawRows]));
                  toast("تم التصدير");
                }}
              >
                تصدير CSV
              </button>
            </div>
          </div>
          <div className="tblwrap">
            <table className="tbl">
              <thead>
                <tr><th>#</th><th>السؤال</th><th>النوع</th><th>الخيار</th><th>العدد</th><th>الحصة</th></tr>
              </thead>
              <tbody>
                {rawRows.length ? (
                  rawRows.map((x, i) => (
                    <tr key={i}>
                      <td className="num">{x[0]}</td><td>{x[1]}</td><td className="t-xs muted">{x[2]}</td>
                      <td>{x[3]}</td><td className="num">{x[4]}</td><td className="num">{x[5]}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={6} className="t-sm dim">لا توجد بيانات.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
