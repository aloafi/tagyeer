/* إجابات أسئلة التعبير بكلمات المشاركين، مع بحث داخل النصوص وتصدير لكل سؤال. */
import { useMemo, useState } from "react";
import useDocumentTitle from "../../../hooks/useDocumentTitle.js";
import { useSession } from "./SessionPage.jsx";
import { Empty } from "../../../components/ui/Primitives.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { csvOf, downloadCsv } from "../../../lib/csv.js";

/* تظليل موضع البحث داخل النص دون أي حقن HTML */
function Highlight({ text, term }) {
  if (!term) return <>{text}</>;
  const parts = String(text).split(term);
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 ? <mark>{term}</mark> : null}
        </span>
      ))}
    </>
  );
}

export default function TabAnswers() {
  const { session, an } = useSession();
  useDocumentTitle("الإجابات — " + session.code);
  const toast = useToast();
  const [term, setTerm] = useState("");

  const textQs = useMemo(() => an.qs.filter((q) => q.qtype === "text"), [an.qs]);
  const t = term.trim();

  const blocks = useMemo(
    () =>
      textQs.map((q) => {
        const list = (q.texts || []).filter((x) => (t ? String(x.text || "").includes(t) : true));
        return { q, list };
      }),
    [textQs, t]
  );

  if (!textQs.length)
    return (
      <Empty icon="text" title="لا توجد أسئلة تعبير">
        أضيفي سؤال تعبير في التجربة لتجمعي مقترحات الموظفين بكلماتهم.
      </Empty>
    );

  const total = blocks.reduce((a, b) => a + b.list.length, 0);

  function exportOne(q) {
    const rows = [["الاسم", "الجهة", "الإجابة"], ...(q.texts || []).map((x) => [x.name || "", x.meta || "", x.text || ""])];
    downloadCsv("إجابات-س" + q.position + "-" + session.code + ".csv", csvOf(rows));
    toast("تم التصدير");
  }

  return (
    <>
      <div className="toolbar">
        <div className="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input className="inp" placeholder="ابحث داخل نصوص الإجابات…" value={term} onChange={(e) => setTerm(e.target.value)} />
        </div>
        <span className="chip grey">{total} إجابة ظاهرة</span>
      </div>

      {blocks.map(({ q, list }) => (
        <div className="card pad sec" key={q.position}>
          <div className="sechead">
            <h3 className="t-lg">{q.position}. {q.question_text}</h3>
            <span className="chip grey">{list.length} إجابة</span>
            <div className="sp"><button className="btn ghost sm" onClick={() => exportOne(q)}>تصدير</button></div>
          </div>
          {list.length ? (
            list.map((x, i) => (
              <div className="quote" key={i}>
                <div className="who">{(x.name || "—") + (x.meta ? " · " + x.meta : "")}</div>
                <div className="txt"><Highlight text={x.text} term={t} /></div>
              </div>
            ))
          ) : (
            <p className="t-sm dim">{t ? "لا توجد إجابة تطابق البحث." : "لا توجد إجابات مكتوبة بعد."}</p>
          )}
        </div>
      ))}
    </>
  );
}
