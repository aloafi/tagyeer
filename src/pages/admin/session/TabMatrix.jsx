/* مصفوفة الجهات × الأسئلة. الخلايا دون الحد الأدنى للعينة تظهر N/A
   حمايةً لخصوصية المجموعات الصغيرة. */
import { useMemo } from "react";
import useDocumentTitle from "../../../hooks/useDocumentTitle.js";
import { useSession } from "./SessionPage.jsx";
import { Empty } from "../../../components/ui/Primitives.jsx";
import Icon from "../../../components/ui/Icon.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { heatColor } from "../../../lib/format.js";
import { csvOf, downloadCsv } from "../../../lib/csv.js";

const heatText = (p) => (p == null ? "#87968E" : p >= 55 || p < 25 ? "#fff" : "#2A1F06");

export default function TabMatrix() {
  const { session, results: r, an, minN } = useSession();
  useDocumentTitle("المصفوفات — " + session.code);
  const toast = useToast();

  const scored = useMemo(() => an.qs.filter((q) => q.qtype !== "text"), [an.qs]);
  const deptKeys = useMemo(() => Object.keys(an.depts), [an.depts]);

  const rowsData = useMemo(() => {
    const cells = {};
    r.participants.forEach((p) => {
      const d = an.deptOf[p.id];
      if (!d?.key) return;
      (p.answers || []).forEach((a) => {
        if (a.qtype === "text") return;
        const c = (cells[d.key] = cells[d.key] || {});
        const e = (c[a.position] = c[a.position] || { sum: 0, n: 0 });
        e.sum += +a.value || 0;
        e.n++;
      });
    });

    const pct = (dk, pos) => {
      const e = cells[dk]?.[pos];
      if (!e || e.n < minN) return null;
      const top = an.topOf(pos) || 1;
      return Math.round((e.sum / e.n / top) * 100);
    };

    return deptKeys
      .map((dk) => {
        const vals = scored.map((q) => pct(dk, q.position));
        const ok = vals.filter((v) => v != null);
        return {
          label: an.depts[dk].label,
          n: an.depts[dk].ids.length,
          vals,
          avg: ok.length ? Math.round(ok.reduce((a, b) => a + b, 0) / ok.length) : null,
        };
      })
      .sort((a, b) => (b.avg == null ? -1 : b.avg) - (a.avg == null ? -1 : a.avg));
  }, [r.participants, an, deptKeys, scored, minN]);

  const gaps = useMemo(
    () =>
      scored
        .map((q, i) => {
          const vals = rowsData.map((x) => x.vals[i]).filter((v) => v != null);
          if (vals.length < 2) return null;
          const hi = Math.max(...vals), lo = Math.min(...vals);
          return {
            q, gap: hi - lo, hi, lo,
            hiD: rowsData.find((x) => x.vals[i] === hi)?.label,
            loD: rowsData.find((x) => x.vals[i] === lo)?.label,
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.gap - a.gap)
        .slice(0, 5),
    [scored, rowsData]
  );

  const note = (
    <div className="note info sec">
      <Icon name="alert" strokeWidth={1.8} />
      <span>
        كل خلية = متوسط إجابات تلك الجهة على ذلك السؤال، كنسبة من أعلى درجة ممكنة له. الخلايا المستندة إلى أقل من {minN} مشاركين
        تظهر N/A حمايةً لخصوصية المجموعات الصغيرة (يُضبط من الإعدادات).
      </span>
    </div>
  );

  if (!deptKeys.length)
    return (
      <>
        {note}
        <Empty icon="grid4" title="لا توجد بيانات جهات">
          هذه المصفوفة تعتمد على حقل الجهة الذي يملؤه المشارك عند الدخول. فعّلي «طلب حقل الجهة» في إعدادات التجربة ثم شغّلي جلسة جديدة.
        </Empty>
      </>
    );

  if (!scored.length)
    return (<>{note}<Empty title="لا توجد أسئلة مُقيَّمة">المصفوفة تحتاج أسئلة لها درجات.</Empty></>);

  function exportMatrix() {
    const head = ["الجهة", ...scored.map((q) => "س" + q.position + ". " + q.question_text), "المؤشر العام", "حجم العينة"];
    const rows = rowsData.map((x) => [x.label, ...x.vals.map((v) => (v == null ? "N/A" : v + "%")), x.avg == null ? "N/A" : x.avg + "%", x.n]);
    downloadCsv("مصفوفة-" + session.code + ".csv", csvOf([head, ...rows]));
    toast("تم تصدير المصفوفة");
  }

  return (
    <>
      {note}

      <div className="card pad sec">
        <div className="sechead">
          <h3 className="t-lg">مصفوفة الجهات × الأسئلة</h3>
          <span className="chip grey">{deptKeys.length} جهة × {scored.length} سؤال</span>
          <div className="sp"><button className="btn ghost sm" onClick={exportMatrix}>تصدير CSV</button></div>
        </div>

        <div className="tblwrap" style={{ border: 0 }}>
          <table className="mx">
            <thead>
              <tr>
                <th>الجهة</th>
                {scored.map((q) => <th key={q.position} title={q.question_text}>س{q.position}</th>)}
                <th>المؤشر العام</th>
                <th>العينة</th>
              </tr>
            </thead>
            <tbody>
              {rowsData.map((row) => (
                <tr key={row.label}>
                  <td title={row.label}>{row.label}</td>
                  {row.vals.map((v, i) => (
                    <td key={i}>
                      <span
                        className={"cellv" + (v == null ? " na" : "")}
                        style={{ background: heatColor(v), color: heatText(v) }}
                        title={row.label + " · " + scored[i].question_text}
                      >
                        {v == null ? "N/A" : v + "%"}
                      </span>
                    </td>
                  ))}
                  <td>
                    <span className={"cellv" + (row.avg == null ? " na" : "")} style={{ background: heatColor(row.avg), color: heatText(row.avg) }}>
                      {row.avg == null ? "N/A" : row.avg + "%"}
                    </span>
                  </td>
                  <td className="num dim">{row.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="heatlegend">
          <span>ضعيف</span><span className="heatbar" /><span>قوي</span>
          <span className="dim">N/A = عينة أقل من {minN}</span>
        </div>

        <div style={{ marginTop: 12 }} className="t-xs dim">
          {scored.map((q) => "س" + q.position + " = " + q.question_text).join(" · ")}
        </div>
      </div>

      {gaps.length > 0 && (
        <div className="card pad">
          <h3 className="t-lg" style={{ marginBottom: 4 }}>أكبر الفجوات بين الجهات</h3>
          <p className="t-xs dim" style={{ marginBottom: 14 }}>الأسئلة التي تختلف فيها الجهات أكثر — نقطة بداية مناسبة للنقاش</p>
          {gaps.map((g) => (
            <div key={g.q.position}>
              <div className="barlbl">س{g.q.position}. {g.q.question_text}</div>
              <div className="bar">
                <div className="track"><i style={{ width: Math.min(100, g.gap) + "%" }} /></div>
                <span className="t-xs num muted">{g.gap} نقطة</span>
              </div>
              <p className="t-xs dim" style={{ margin: "-4px 0 12px" }}>
                الأعلى: {g.hiD} ({g.hi}%) · الأدنى: {g.loD} ({g.lo}%)
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
