/* بناء الأسئلة: بطاقة قابلة للطي لكل سؤال، مع سحب لإعادة الترتيب. */
import { useState } from "react";
import Icon, { ICON_FOR_TYPE } from "../../../components/ui/Icon.jsx";
import { Empty } from "../../../components/ui/Primitives.jsx";
import { SHAPES, TYPES, TYPE_KEYS, freshQuestion, qtypeOf } from "../../../lib/config.js";
import { useAsk } from "../../../components/ui/Dialog.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";

function Options({ q, t, onChange }) {
  const toast = useToast();

  if (t === "text")
    return (
      <div className="note info" style={{ marginTop: 12 }}>
        <Icon name="alert" strokeWidth={1.8} />
        <span>
          إجابة مكتوبة حرّة حتى 1500 حرف. بلا درجة ولا تدخل في حساب النتيجة، وتظهر في تبويب الإجابات وملف Excel.
        </span>
      </div>
    );

  const lead = (j) => {
    if (t === "choice")
      return <span className="optlead" style={{ background: SHAPES[j % SHAPES.length].c }}>{SHAPES[j % SHAPES.length].s}</span>;
    if (t === "truefalse")
      return <span className="optlead" style={{ background: j === 0 ? "#1E7A52" : "#A4342C" }}>{j === 0 ? "✓" : "✕"}</span>;
    return <span className="optlead" style={{ background: "#DCEAE3", color: "#0B4F3A" }}>{j + 1}</span>;
  };

  const setOpt = (j, patch) =>
    onChange({ ...q, options: q.options.map((o, k) => (k === j ? { ...o, ...patch } : o)) });

  return (
    <>
      <label className="lbl" style={{ marginTop: 14 }}>الخيارات والدرجات</label>
      <div>
        {(q.options || []).map((o, j) => (
          <div className="optrow" key={j}>
            {lead(j)}
            <input className="inp grow" value={o.label} placeholder="نص الخيار" onChange={(e) => setOpt(j, { label: e.target.value })} />
            <input
              className="inp score num"
              type="number"
              value={+o.score || 0}
              title="الدرجة"
              onChange={(e) => setOpt(j, { score: +e.target.value || 0 })}
            />
            {t !== "truefalse" && (
              <button
                className="iconbtn danger"
                title="حذف الخيار"
                onClick={() => {
                  if (q.options.length <= 2) { toast("لا يمكن أن يقل السؤال عن خيارين", true); return; }
                  onChange({ ...q, options: q.options.filter((_, k) => k !== j) });
                }}
              >
                <Icon name="plus" strokeWidth={2} style={{ transform: "rotate(45deg)" }} />
              </button>
            )}
          </div>
        ))}
      </div>
      {t === "truefalse" ? (
        <p className="hint">خياران ثابتان: الأول «صح» والثاني «خطأ». يمكنك تعديل النص والدرجة.</p>
      ) : (
        <button
          className="btn ghost xs"
          style={{ marginTop: 6 }}
          onClick={() => onChange({ ...q, options: [...(q.options || []), { label: "خيار جديد", score: 0 }] })}
        >
          + خيار
        </button>
      )}
    </>
  );
}

export default function QuestionList({ questions, setQuestions, openSet, setOpenSet, onFocus }) {
  const ask = useAsk();
  const [picker, setPicker] = useState(false);
  const [dragFrom, setDragFrom] = useState(null);
  const [over, setOver] = useState(null);

  const patch = (i, q) => setQuestions(questions.map((x, k) => (k === i ? q : x)));

  const toggle = (i) => {
    const next = new Set(openSet);
    if (next.has(i)) next.delete(i); else next.add(i);
    setOpenSet(next);
    onFocus(i);
  };

  function addType(t) {
    const next = [...questions, freshQuestion(t)];
    setQuestions(next);
    setOpenSet(new Set([next.length - 1]));
    setPicker(false);
    onFocus(next.length - 1);
  }

  async function removeQ(i) {
    const ok = await ask({ title: "حذف السؤال", text: "سيُحذف السؤال رقم " + (i + 1) + " من التجربة.", yes: "حذف", danger: true });
    if (!ok) return;
    setQuestions(questions.filter((_, k) => k !== i));
    setOpenSet(new Set());
  }

  function drop(to) {
    const from = dragFrom;
    setDragFrom(null); setOver(null);
    if (from == null || from === to) return;
    const next = questions.slice();
    next.splice(to, 0, next.splice(from, 1)[0]);
    setQuestions(next);
    setOpenSet(new Set());
  }

  return (
    <>
      <div className="sechead">
        <h2 className="t-lg">الأسئلة</h2>
        <span className="chip grey">{questions.length} سؤال</span>
        <div className="sp"><button className="btn sm" onClick={() => setPicker((p) => !p)}>+ إضافة سؤال</button></div>
      </div>

      {picker && (
        <div className="card pad" style={{ marginBottom: 12 }}>
          <p className="t-sm muted" style={{ marginBottom: 10 }}>اختر نوع السؤال</p>
          <div className="typegrid">
            {TYPE_KEYS.map((k) => (
              <button className="typecard" key={k} onClick={() => addType(k)}>
                <span className="ti"><Icon name={ICON_FOR_TYPE[k]} strokeWidth={1.8} /></span>
                <span><b>{TYPES[k].name}</b><span>{TYPES[k].desc}</span></span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="qbuild">
        {!questions.length ? (
          <Empty icon="plus" title="لا توجد أسئلة">أضف أول سؤال من زر «إضافة سؤال» واختر نوعه.</Empty>
        ) : (
          questions.map((q, i) => {
            const t = qtypeOf(q);
            return (
              <div
                className={"qb" + (openSet.has(i) ? " open" : "") + (over === i ? " over" : "") + (dragFrom === i ? " dragging" : "")}
                key={i}
                onDragOver={(e) => { e.preventDefault(); setOver(i); }}
                onDragLeave={() => setOver((o) => (o === i ? null : o))}
                onDrop={(e) => { e.preventDefault(); drop(i); }}
              >
                <div className="qhead" onClick={() => toggle(i)}>
                  <span
                    className="handle"
                    draggable
                    title="اسحب للترتيب"
                    onClick={(e) => e.stopPropagation()}
                    onDragStart={(e) => { setDragFrom(i); e.dataTransfer.effectAllowed = "move"; }}
                    onDragEnd={() => { setDragFrom(null); setOver(null); }}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" />
                      <circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" />
                      <circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
                    </svg>
                  </span>
                  <span className="idx">{i + 1}</span>
                  <span className={"qt" + (q.text ? "" : " empty")}>{q.text || "سؤال بدون نص"}</span>
                  <span className="chip grey">{TYPES[t].name}</span>
                  <button
                    className="iconbtn" title="نسخ"
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = questions.slice();
                      next.splice(i + 1, 0, JSON.parse(JSON.stringify(q)));
                      setQuestions(next);
                    }}
                  >
                    <Icon name="copy" />
                  </button>
                  <button className="iconbtn danger" title="حذف" onClick={(e) => { e.stopPropagation(); removeQ(i); }}>
                    <Icon name="trash" />
                  </button>
                  <span className="caret">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </div>

                <div className="qbody">
                  <label className="lbl" style={{ marginTop: 12 }}>نص السؤال</label>
                  <textarea
                    className="inp"
                    rows={2}
                    placeholder={t === "likert5" ? "اكتب العبارة…" : "اكتب السؤال…"}
                    value={q.text}
                    onChange={(e) => { patch(i, { ...q, text: e.target.value }); onFocus(i); }}
                  />
                  <Options q={q} t={t} onChange={(nq) => { patch(i, nq); onFocus(i); }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
