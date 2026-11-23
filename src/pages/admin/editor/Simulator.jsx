/* محاكاة شاشة المشارك داخل المحرر — ويُحرَّر منها مباشرة.
   كل نص تراه هنا هو نص المشارك نفسه، وبخطّه ومقاسه: الكتابة تجري في
   مكانها، والضبط الذي لا يصلح أن يكون نصاً (النوع، الدرجات، الخيارات)
   في لوحة بجانب الجهاز. */
import { useMemo } from "react";
import Icon, { ICON_FOR_TYPE } from "../../../components/ui/Icon.jsx";
import Editable from "../../../components/ui/Editable.jsx";
import { useAsk } from "../../../components/ui/Dialog.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { SHAPES, TRUEFALSE, TYPES, TYPE_KEYS, freshQuestion, qtypeOf } from "../../../lib/config.js";

const Tick = () => (
  <span className="tick">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  </span>
);

/* الشارة التي تتصدّر الخيار: شكل ملوّن، أو صح/خطأ، أو دائرة اختيار */
function OptionLead({ type, j }) {
  if (type === "truefalse")
    return <span className="badge" style={{ background: j === 0 ? "#1E7A52" : "#A4342C" }}>{j === 0 ? "✓" : "✕"}</span>;
  if (type === "choice")
    return <span className="shape" style={{ background: SHAPES[j % SHAPES.length].c }}>{SHAPES[j % SHAPES.length].s}</span>;
  return <Tick />;
}

export default function Simulator({ quiz, patch, sel, setSel, lo, hi }) {
  const ask = useAsk();
  const toast = useToast();

  const questions = quiz.questions || [];
  const bands = quiz.bands || [];

  const qi = typeof sel === "number" ? Math.min(sel, questions.length - 1) : -1;
  const q = qi > -1 ? questions[qi] : null;
  const type = q ? qtypeOf(q) : null;
  const kind = type === "likert5" ? "العبارة" : "السؤال";

  const setQuestions = (qs) => patch({ questions: qs });
  const setQ = (i, next) => setQuestions(questions.map((x, k) => (k === i ? next : x)));
  const setOpt = (j, p) => setQ(qi, { ...q, options: (q.options || []).map((o, k) => (k === j ? { ...o, ...p } : o)) });

  function addQuestion(t) {
    const next = [...questions, freshQuestion(t)];
    setQuestions(next);
    setSel(next.length - 1);
  }

  async function removeQuestion() {
    const ok = await ask({
      title: "حذف " + kind,
      text: "سيُحذف " + kind + " رقم " + (qi + 1) + " من التجربة.",
      yes: "حذف", danger: true,
    });
    if (!ok) return;
    setQuestions(questions.filter((_, k) => k !== qi));
    setSel(questions.length > 1 ? Math.max(0, qi - 1) : "start");
  }

  function duplicateQuestion() {
    const next = questions.slice();
    next.splice(qi + 1, 0, JSON.parse(JSON.stringify(q)));
    setQuestions(next);
    setSel(qi + 1);
    toast("نُسخ " + kind);
  }

  function move(dir) {
    const to = qi + dir;
    if (to < 0 || to >= questions.length) return;
    const next = questions.slice();
    next.splice(to, 0, next.splice(qi, 1)[0]);
    setQuestions(next);
    setSel(to);
  }

  function changeType(t) {
    if (t === type) return;
    const fresh = freshQuestion(t);
    setQ(qi, { ...q, qtype: t, options: fresh.options.map((o) => ({ ...o })) });
    toast("تغيّر النوع إلى «" + TYPES[t].name + "» — تُستبدل الخيارات بخيارات النوع الجديد");
  }

  /* المستوى المعروض في شاشة النتيجة */
  const bandIdx = useMemo(() => {
    if (!bands.length) return -1;
    const i = typeof sel === "string" && sel.startsWith("band:") ? +sel.slice(5) : 0;
    return Math.min(Math.max(0, i), bands.length - 1);
  }, [bands.length, sel]);
  const band = bandIdx > -1 ? bands[bandIdx] : null;
  const setBand = (p) => patch({ bands: bands.map((b, k) => (k === bandIdx ? { ...b, ...p } : b)) });

  const onResult = sel === "result" || (typeof sel === "string" && sel.startsWith("band:"));

  /* ----------------------------- الشاشات ----------------------------- */

  const startScreen = (
    <section className="screen on">
      <div className="hero">
        <div className="emblem">
          <Editable
            className="emo" multiline={false} maxLength={4}
            value={quiz.cover_emoji} onChange={(v) => patch({ cover_emoji: v })}
            placeholder="🌱" ariaLabel="أيقونة التجربة"
          />
        </div>
        <h1>
          <Editable value={quiz.title} onChange={(v) => patch({ title: v })} placeholder="اسم التجربة" />
        </h1>
        <p className="lede">
          <Editable value={quiz.subtitle} onChange={(v) => patch({ subtitle: v })} placeholder="عبارة تعريفية قصيرة" />
        </p>

        <div className="field">
          {quiz.ask_name !== false && (
            <div>
              <span className="label">الاسم</span>
              <div className="input ph">اكتب اسمك هنا</div>
            </div>
          )}
          {quiz.ask_meta && (
            <div style={{ marginTop: 14 }}>
              <span className="label">
                <Editable
                  multiline={false} className="metalbl"
                  value={quiz.meta_label} onChange={(v) => patch({ meta_label: v })}
                  placeholder="الإدارة / الجهة"
                />
                <span style={{ color: "#A4342C" }}> *</span>
              </span>
              <div className="input ph">اكتب هنا</div>
            </div>
          )}
        </div>

        <span className="btn simbtn">ابدأ</span>
        <p className="hint">
          <Editable value={quiz.intro} onChange={(v) => patch({ intro: v })} placeholder="ملاحظة تطمئن المشارك قبل البدء" />
        </p>
      </div>
    </section>
  );

  const questionScreen = q && (
    <section className="screen on">
      <div className="progress"><i style={{ width: (qi / Math.max(1, questions.length)) * 100 + "%" }} /></div>
      <div className="qwrap">
        <div className="card qcard">
          <div className="qnum">{kind} <b>{qi + 1}</b> من {questions.length}</div>
          <p className="qtext">
            <Editable
              value={q.text} onChange={(v) => setQ(qi, { ...q, text: v })}
              placeholder={type === "likert5" ? "اكتب العبارة…" : "اكتب السؤال…"}
            />
          </p>

          {type === "text" ? (
            <>
              <div className="ta ph">اكتب إجابتك هنا…</div>
              <p className="qnote">إجابة حرّة — اكتب ما تراه، ولك أن تتركها فارغة.</p>
            </>
          ) : (
            <div className={"opts" + (type === "truefalse" ? " tf" : "")}>
              {(q.options || []).map((o, j) => (
                <div className={"opt simopt" + (type === "truefalse" ? " tfopt" : "")} key={j}>
                  <OptionLead type={type} j={j} />
                  <Editable
                    multiline={false} className="optlbl"
                    value={o.label} onChange={(v) => setOpt(j, { label: v })} placeholder="نص الخيار"
                  />
                  {/* أدوات المحرر: تنزل سطراً مستقلاً على الشاشات الضيقة
                      حتى يبقى نص الخيار كاملاً كما يراه المشارك */}
                  <span className="optedit">
                    <span className="optsc" title="درجة هذا الخيار">
                      <input
                        type="number" value={+o.score || 0} aria-label={"درجة الخيار " + (j + 1)}
                        onChange={(e) => setOpt(j, { score: +e.target.value || 0 })}
                      />
                    </span>
                    {type !== "truefalse" && (
                      <button
                        className="optx" title="حذف الخيار"
                        onClick={() => {
                          if ((q.options || []).length <= 2) { toast("لا يمكن أن يقل السؤال عن خيارين", true); return; }
                          setQ(qi, { ...q, options: q.options.filter((_, k) => k !== j) });
                        }}
                      >
                        <Icon name="plus" strokeWidth={2} style={{ transform: "rotate(45deg)" }} />
                      </button>
                    )}
                  </span>
                </div>
              ))}
              {type !== "truefalse" && (
                <button
                  className="optadd"
                  onClick={() => setQ(qi, { ...q, options: [...(q.options || []), { label: "خيار جديد", score: 0 }] })}
                >
                  <Icon name="plus" strokeWidth={2} /> خيار
                </button>
              )}
            </div>
          )}

          <div className="qfoot">
            <span className="link" hidden={qi === 0}>‹ السابق</span>
            <span className="link" style={{ color: "var(--green)", fontWeight: 600 }}>
              {qi === questions.length - 1 ? "إنهاء ›" : "التالي ›"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );

  const sample = band ? Math.round((band.min_score + band.max_score) / 2) : hi;
  const pct = hi > lo ? Math.max(4, Math.round(((sample - lo) / (hi - lo)) * 100)) : 100;

  const resultScreen = (
    <section className="screen on">
      <div className="result">
        <p className="rkicker">{quiz.title || "اسم التجربة"}</p>
        <div className="rbadge">
          {band ? (
            <Editable
              className="emo" multiline={false} maxLength={4}
              value={band.emoji} onChange={(v) => setBand({ emoji: v })} placeholder="🌿" ariaLabel="أيقونة المستوى"
            />
          ) : (quiz.cover_emoji || "🌿")}
        </div>
        <h2 className="rlevel" style={band?.color ? { color: band.color } : undefined}>
          {band ? (
            <Editable value={band.title} onChange={(v) => setBand({ title: v })} placeholder="اسم المستوى" />
          ) : "تم تسجيل إجاباتك"}
        </h2>

        {quiz.show_score !== false && hi > 0 && (
          <div className="rscore" style={{ display: "inline-flex" }}>
            نتيجتك: <b>{sample}</b> من <span>{hi}</span>
          </div>
        )}

        <p className="rmsg">
          {band ? (
            <Editable value={band.message} onChange={(v) => setBand({ message: v })} placeholder="رسالة المستوى للمشارك" />
          ) : "شكراً لمشاركتك في التجربة."}
        </p>

        {quiz.show_score !== false && hi > 0 && (
          <div className="gauge">
            <div className="gtrack">
              {bands.map((b, i) => (
                <span key={i} style={{ background: b.color || "var(--green)", flex: Math.max(1, b.max_score - b.min_score + 1) }} />
              ))}
              <div className="gfill" style={{ width: pct + "%" }} />
            </div>
            <div className="gends"><span>{lo}</span><span>{hi}</span></div>
          </div>
        )}

        <p className="rfoot">
          <Editable value={quiz.footer_note} onChange={(v) => patch({ footer_note: v })} placeholder="عبارة ختامية" />
        </p>
      </div>
    </section>
  );

  /* ---------------------------- لوحة الضبط ---------------------------- */

  const inspector = (
    <aside className="siminspect">
      {sel === "start" && (
        <>
          <p className="lbl">شاشة البداية</p>
          <div className="simset">
            <label className="sw">
              <input type="checkbox" checked={quiz.ask_name !== false} onChange={(e) => patch({ ask_name: e.target.checked })} />
              <i /><span>طلب اسم المشارك</span>
            </label>
            <label className="sw">
              <input type="checkbox" checked={!!quiz.ask_meta} onChange={(e) => patch({ ask_meta: e.target.checked })} />
              <i /><span>طلب الجهة إلزامياً</span>
            </label>
            <label className="sw">
              <input type="checkbox" checked={quiz.show_score !== false} onChange={(e) => patch({ show_score: e.target.checked })} />
              <i /><span>إظهار الدرجة في النتيجة</span>
            </label>
          </div>
          <p className="hint">
            كل ما تكتبينه على الجهاز يظهر للمشارك كما هو. حقل الجهة هو أساس مصفوفة
            مقارنة الإدارات في تقارير الجلسة.
          </p>
        </>
      )}

      {qi > -1 && q && (
        <>
          <p className="lbl">نوع {kind}</p>
          <div className="simtypes">
            {TYPE_KEYS.map((k) => (
              <button key={k} className={"simtype" + (k === type ? " on" : "")} onClick={() => changeType(k)} title={TYPES[k].desc}>
                <Icon name={ICON_FOR_TYPE[k]} strokeWidth={1.8} />
                <span>{TYPES[k].name}</span>
              </button>
            ))}
          </div>

          <p className="lbl" style={{ marginTop: 16 }}>ترتيب وتصرّفات</p>
          <div className="simacts">
            <button className="btn ghost xs" disabled={qi === 0} onClick={() => move(-1)}>↑ لأعلى</button>
            <button className="btn ghost xs" disabled={qi === questions.length - 1} onClick={() => move(1)}>↓ لأسفل</button>
            <button className="btn ghost xs" onClick={duplicateQuestion}>نسخ</button>
            <button className="btn ghost xs danger" onClick={removeQuestion}>حذف</button>
          </div>

          <p className="hint" style={{ marginTop: 12 }}>
            {type === "text"
              ? "إجابة مكتوبة حرّة حتى 1500 حرف، بلا درجة، وتظهر في تبويب الإجابات وملف Excel."
              : "الرقم بجانب كل خيار هو درجته. مجموع أعلى الدرجات في التجربة كلها: " + hi + "."}
          </p>
        </>
      )}

      {onResult && (
        <>
          <p className="lbl">المستوى المعروض</p>
          {bands.length ? (
            <>
              <div className="simbands">
                {bands.map((b, i) => (
                  <button
                    key={i}
                    className={"simband" + (i === bandIdx ? " on" : "")}
                    onClick={() => setSel("band:" + i)}
                  >
                    <span className="bdot" style={{ background: b.color || "#0B4F3A" }} />
                    <span className="grow ellip">{(b.emoji || "") + " " + (b.title || "مستوى بلا اسم")}</span>
                    <span className="t-xs dim num">{b.min_score}–{b.max_score}</span>
                  </button>
                ))}
              </div>
              <p className="hint" style={{ marginTop: 10 }}>
                النطاقات والألوان تُضبط في تبويب «المستويات». اكتبي هنا عنوان المستوى ورسالته كما
                سيقرأها المشارك.
              </p>
            </>
          ) : (
            <p className="hint">
              لا توجد مستويات بعد — أضيفيها من تبويب «المستويات» لتظهر للمشارك رسالة مع درجته.
            </p>
          )}
        </>
      )}
    </aside>
  );

  /* ------------------------------ الهيكل ------------------------------ */

  return (
    <div className="simwrap">
      <div className="simrail" role="tablist" aria-label="شاشات المشارك">
        <button className={"simchip" + (sel === "start" ? " on" : "")} onClick={() => setSel("start")} role="tab" aria-selected={sel === "start"}>
          <Icon name="smile" strokeWidth={1.8} /> البداية
        </button>

        <span className="simsep" aria-hidden="true" />

        {questions.map((x, i) => (
          <button
            key={i}
            className={"simchip num" + (qi === i ? " on" : "") + (String(x.text || "").trim() ? "" : " empty")}
            onClick={() => setSel(i)}
            title={x.text || "بلا نص"}
            role="tab"
            aria-selected={qi === i}
          >
            {i + 1}
          </button>
        ))}

        <div className="simadd">
          <button className="simchip add" onClick={() => addQuestion("likert5")} title="أضف عبارة مقياس خماسي">
            <Icon name="plus" strokeWidth={2} /> سؤال
          </button>
          <div className="simaddmenu">
            {TYPE_KEYS.map((k) => (
              <button key={k} onClick={() => addQuestion(k)}>
                <Icon name={ICON_FOR_TYPE[k]} strokeWidth={1.8} />
                <span><b>{TYPES[k].name}</b><span>{TYPES[k].desc}</span></span>
              </button>
            ))}
          </div>
        </div>

        <span className="simsep" aria-hidden="true" />

        <button className={"simchip" + (onResult ? " on" : "")} onClick={() => setSel("result")} role="tab" aria-selected={onResult}>
          <Icon name="checkBox" strokeWidth={1.8} /> النتيجة
        </button>

        <span className="simtip">
          <Icon name="pencil" strokeWidth={1.8} />
          اضغطي على أي نص داخل الجهاز لتعديله
        </span>
      </div>

      <div className="simstage">
        <div className="simdev">
          <div className="simtop" aria-hidden="true">
            <span className="simtime">9:41</span>
            <span className="simdot" /><span className="simdot" /><span className="simdot" />
          </div>
          <div className="simscreen">
            <div className="participant-root simcanvas">
              <div className="stage">
                <div className="topbar">
                  <span className="mark">
                    <Icon name="refresh" strokeWidth={1.8} />
                    {quiz.title || "منصة تغيير"}
                  </span>
                  {qi > -1 ? <span className="steps">{qi + 1} من {questions.length}</span> : null}
                </div>
                {/* المفتاح يعيد تشغيل حركة الدخول عند كل انتقال بين الشاشات */}
                <div className="simfade" key={sel}>
                  {sel === "start" ? startScreen : qi > -1 ? questionScreen : resultScreen}
                </div>
              </div>
            </div>
          </div>
        </div>

        {inspector}
      </div>

      {!questions.length && (
        <p className="simempty">
          لا توجد أسئلة بعد — أضيفي أول سؤال من زر «+ سؤال» في الشريط أعلاه، واكتبي نصّه على الجهاز مباشرة.
        </p>
      )}
    </div>
  );
}
