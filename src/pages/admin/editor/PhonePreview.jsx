/* معاينة شاشة المشارك داخل المحرر — تعكس السؤال المفتوح لحظة بلحظة. */
import { SHAPES, TRUEFALSE, qtypeOf } from "../../../lib/config.js";

export default function PhonePreview({ questions, index }) {
  if (!questions.length)
    return <p className="t-sm dim" style={{ textAlign: "center", padding: "26px 0" }}>أضف سؤالاً لتظهر المعاينة</p>;

  const i = questions[index] ? index : 0;
  const q = questions[i];
  const t = qtypeOf(q);
  const p = Math.round((i / questions.length) * 100);

  let body = null;
  if (t === "text") {
    body = <div className="pta">اكتب إجابتك هنا…</div>;
  } else if (t === "truefalse") {
    body = (
      <div className="ptf">
        {(q.options?.length ? q.options : TRUEFALSE).map((o, j) => (
          <div className="popt" key={j}>
            <span className="badge" style={{ background: j === 0 ? "#1E7A52" : "#A4342C" }}>{j === 0 ? "✓" : "✕"}</span>
            <span>{o.label}</span>
          </div>
        ))}
      </div>
    );
  } else if (t === "choice") {
    body = (q.options || []).map((o, j) => (
      <div className="popt" key={j}>
        <span className="sh" style={{ background: SHAPES[j % SHAPES.length].c }}>{SHAPES[j % SHAPES.length].s}</span>
        <span>{o.label}</span>
      </div>
    ));
  } else {
    body = (q.options || []).map((o, j) => (
      <div className="popt" key={j}><span className="tick" /><span>{o.label}</span></div>
    ));
  }

  return (
    <>
      <div className="pbar"><i style={{ width: p + "%" }} /></div>
      <div className="pnum">{(t === "likert5" ? "العبارة" : "السؤال") + " " + (i + 1) + " من " + questions.length}</div>
      <div className="pq">{q.text || "نص السؤال سيظهر هنا"}</div>
      {body}
    </>
  );
}
