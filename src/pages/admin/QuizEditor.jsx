/* محرر التجربة — معالج من أربع خطوات: المعلومات، الأسئلة، المستويات، المراجعة. */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePageHead } from "../../layouts/AdminLayout.jsx";
import { useAuth } from "../../lib/auth.jsx";
import { useAdminData } from "../../hooks/useAdminData.jsx";
import useNewSession from "../../hooks/useNewSession.js";
import { useAsk } from "../../components/ui/Dialog.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { ErrorBox, Spinner } from "../../components/ui/Primitives.jsx";
import Icon from "../../components/ui/Icon.jsx";
import QuestionList from "./editor/QuestionList.jsx";
import BandsEditor from "./editor/BandsEditor.jsx";
import PhonePreview from "./editor/PhonePreview.jsx";
import { blankQuiz, qtypeOf, TYPES } from "../../lib/config.js";
import { getQuiz, saveQuiz, deleteQuiz, createSession } from "../../lib/api.js";
import { participantUrl } from "../../lib/links.js";

const STEPS = ["معلومات التجربة", "الأسئلة", "المستويات", "المراجعة"];
const scored = (q) => qtypeOf(q) !== "text";

const bound = (qs, pick) =>
  qs.filter(scored).reduce((s, q) => {
    const v = (q.options || []).map((o) => +o.score || 0);
    return s + (v.length ? pick(v) : 0);
  }, 0);

export default function QuizEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const { pw } = useAuth();
  const { refreshQuizzes } = useAdminData();
  const newSession = useNewSession();
  const ask = useAsk();
  const toast = useToast();

  const [quiz, setQuiz] = useState(() => (id ? null : blankQuiz()));
  const [err, setErr] = useState(null);
  const [step, setStep] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [openSet, setOpenSet] = useState(() => new Set());
  const [focusIdx, setFocusIdx] = useState(0);

  useEffect(() => {
    let alive = true;
    if (!id) { setQuiz(blankQuiz()); setErr(null); return; }
    setQuiz(null);
    getQuiz(pw, id)
      .then((q) => { if (alive) { setQuiz(q); setErr(null); setDirty(false); setSaved(false); } })
      .catch((e) => { if (alive) setErr(e.message); });
    return () => { alive = false; };
  }, [id, pw]);

  /* تحذير المتصفح عند مغادرة الصفحة بتغييرات غير محفوظة */
  useEffect(() => {
    if (!dirty) return;
    const h = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const patch = useCallback((p) => {
    setQuiz((q) => ({ ...q, ...p }));
    setDirty(true);
    setSaved(false);
  }, []);

  const lo = useMemo(() => (quiz ? bound(quiz.questions || [], (v) => Math.min(...v)) : 0), [quiz]);
  const hi = useMemo(() => (quiz ? bound(quiz.questions || [], (v) => Math.max(...v)) : 0), [quiz]);

  const goStep = useCallback((n) => {
    setStep(Math.max(0, Math.min(3, n)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const save = useCallback(async () => {
    if (!quiz) return null;
    if (!String(quiz.title || "").trim()) { toast("اكتب عنوان التجربة", true); goStep(0); return null; }
    if (!quiz.questions.length) { toast("أضف سؤالاً واحداً على الأقل", true); goStep(1); return null; }
    const bad = quiz.questions.findIndex((x) => !String(x.text || "").trim());
    if (bad > -1) { toast("السؤال رقم " + (bad + 1) + " بلا نص", true); goStep(1); setOpenSet(new Set([bad])); return null; }
    try {
      const out = await saveQuiz(pw, quiz);
      setQuiz(out);
      setDirty(false);
      setSaved(true);
      await refreshQuizzes();
      toast("تم الحفظ");
      if (!id && out.id) nav("/quizzes/" + out.id + "/edit", { replace: true });
      return out;
    } catch (e) { toast(e.message, true); return null; }
  }, [quiz, pw, toast, goStep, refreshQuizzes, id, nav]);

  const preview = useCallback(async () => {
    if (!quiz?.id) { toast("احفظ التجربة أولاً", true); return; }
    try {
      const s = await createSession(pw, quiz.id, "معاينة");
      window.open(participantUrl() + "/join/" + s.code, "_blank", "noopener");
      toast("فُتحت جلسة معاينة بالرمز " + s.code);
    } catch (e) { toast(e.message, true); }
  }, [quiz, pw, toast]);

  usePageHead(
    {
      title: id ? "تعديل التجربة" : "تجربة جديدة",
      crumb: [{ label: "التجارب", to: "/quizzes" }, { label: id ? "تعديل التجربة" : "تجربة جديدة" }],
      actions: (
        <>
          <button className="btn ghost sm" onClick={preview}>معاينة</button>
          <button className="btn sm" onClick={save}>حفظ</button>
        </>
      ),
    },
    [id, preview, save]
  );

  if (err) return <ErrorBox message={err} />;
  if (!quiz) return <Spinner big />;

  const setQuestions = (qs) => patch({ questions: qs });
  const setBands = (bs) => patch({ bands: bs });

  async function removeQuiz() {
    if (!quiz.id) return;
    const ok = await ask({ title: "حذف التجربة", text: "سيتم حذف التجربة وكل جلساتها ونتائجها نهائياً.", yes: "حذف", danger: true });
    if (!ok) return;
    try { await deleteQuiz(pw, quiz.id); await refreshQuizzes(); toast("تم الحذف"); nav("/quizzes"); }
    catch (e) { toast(e.message, true); }
  }

  const counts = {};
  (quiz.questions || []).forEach((x) => { const t = qtypeOf(x); counts[t] = (counts[t] || 0) + 1; });

  const problems = [];
  if (!quiz.title) problems.push("التجربة بلا عنوان.");
  if (!quiz.questions.length) problems.push("لا توجد أسئلة.");
  (quiz.questions || []).forEach((x, i) => { if (!String(x.text || "").trim()) problems.push("السؤال رقم " + (i + 1) + " بلا نص."); });
  if (quiz.questions.some(scored) && !quiz.bands.length)
    problems.push("لا توجد مستويات نتيجة — سيرى المشارك درجته بلا رسالة.");

  return (
    <>
      <div className="steps">
        {STEPS.map((label, i) => (
          <button key={i} className={"step" + (i === step ? " on" : "") + (i < step ? " done" : "")} onClick={() => goStep(i)}>
            <span className="n">{i + 1}</span>{label}
          </button>
        ))}
      </div>

      {step === 0 && (
        <div className="wizpane on">
          <div className="card pad readable">
            <div className="formgrid">
              <div style={{ maxWidth: 110 }}>
                <label className="lbl">الأيقونة</label>
                <input className="inp" maxLength={4} style={{ textAlign: "center", fontSize: 22 }}
                  value={quiz.cover_emoji || ""} onChange={(e) => patch({ cover_emoji: e.target.value })} />
              </div>
              <div className="grow">
                <label className="lbl">اسم التجربة</label>
                <input className="inp" placeholder="مثال: ما مدى جاهزيتك للتغيير؟" value={quiz.title || ""} onChange={(e) => patch({ title: e.target.value })} />
              </div>
              <div className="full">
                <label className="lbl">العبارة التعريفية</label>
                <input className="inp" placeholder="خمس عبارات فقط تفصلك عن معرفة مستوى جاهزيتك" value={quiz.subtitle || ""} onChange={(e) => patch({ subtitle: e.target.value })} />
              </div>
              <div>
                <label className="lbl">ملاحظة قبل البدء</label>
                <input className="inp" placeholder="لا توجد إجابة صحيحة أو خاطئة" value={quiz.intro || ""} onChange={(e) => patch({ intro: e.target.value })} />
              </div>
              <div>
                <label className="lbl">عبارة ختامية</label>
                <input className="inp" placeholder="التغيير يبدأ بك" value={quiz.footer_note || ""} onChange={(e) => patch({ footer_note: e.target.value })} />
              </div>
            </div>

            <hr className="divider" />

            <div style={{ display: "grid", gap: 12 }}>
              <label className="sw">
                <input type="checkbox" checked={quiz.ask_name !== false} onChange={(e) => patch({ ask_name: e.target.checked })} />
                <i /><span>طلب اسم المشارك <span className="dim t-xs">— أوقفه لمشاركة مجهولة</span></span>
              </label>
              <label className="sw">
                <input type="checkbox" checked={quiz.show_score !== false} onChange={(e) => patch({ show_score: e.target.checked })} />
                <i /><span>إظهار الدرجة للمشارك</span>
              </label>
              <label className="sw">
                <input type="checkbox" checked={!!quiz.ask_meta} onChange={(e) => patch({ ask_meta: e.target.checked })} />
                <i /><span>طلب حقل الجهة إلزامياً عند الدخول</span>
              </label>
              {quiz.ask_meta && (
                <div style={{ maxWidth: 300 }}>
                  <input className="inp" placeholder="الإدارة / الجهة" value={quiz.meta_label || ""} onChange={(e) => patch({ meta_label: e.target.value })} />
                  <p className="hint">هذا الحقل هو أساس مصفوفة مقارنة الجهات — فعّليه إذا كنتِ تريدين مقارنة النتائج بين الإدارات.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="wizpane on">
          <div id="qlayout" style={{ display: "grid", gap: 22, gridTemplateColumns: "minmax(0,1fr) 340px" }}>
            <div>
              <QuestionList
                questions={quiz.questions || []}
                setQuestions={setQuestions}
                openSet={openSet}
                setOpenSet={setOpenSet}
                onFocus={setFocusIdx}
              />
            </div>
            <div className="preview">
              <p className="lbl">معاينة المشارك</p>
              <div className="phone">
                <PhonePreview
                  questions={quiz.questions || []}
                  index={openSet.size ? Math.min(...openSet) : focusIdx}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="wizpane on">
          <BandsEditor bands={quiz.bands || []} setBands={setBands} lo={lo} hi={hi} />
        </div>
      )}

      {step === 3 && (
        <div className="wizpane on">
          <div className="chartgrid">
            <div className="card pad">
              <div style={{ fontSize: 28 }}>{quiz.cover_emoji || "🌱"}</div>
              <h3 className="t-lg" style={{ margin: "6px 0 3px" }}>{quiz.title || "تجربة بدون عنوان"}</h3>
              <p className="t-sm muted">{quiz.subtitle || ""}</p>
              <div className="row" style={{ marginTop: 12 }}>
                <span className="chip">{quiz.questions.length} سؤال</span>
                {hi > lo ? <span className="chip gold">النطاق {lo} – {hi}</span> : null}
                <span className="chip grey">{quiz.ask_name === false ? "مشاركة مجهولة" : "باسم المشارك"}</span>
                {quiz.ask_meta ? <span className="chip grey">{quiz.meta_label}</span> : null}
                {quiz.show_score === false ? <span className="chip grey">الدرجة مخفية</span> : null}
              </div>
            </div>

            <div className="card pad">
              <h3 className="t-md" style={{ marginBottom: 10 }}>أنواع الأسئلة</h3>
              {Object.keys(counts).length ? (
                Object.keys(counts).map((t) => (
                  <div className="row" key={t} style={{ padding: "5px 0" }}>
                    <span className="t-sm grow">{TYPES[t].name}</span>
                    <b className="num">{counts[t]}</b>
                  </div>
                ))
              ) : <p className="t-sm dim">لا توجد أسئلة.</p>}
            </div>

            <div className="card pad">
              <h3 className="t-md" style={{ marginBottom: 10 }}>المستويات</h3>
              {quiz.bands.length ? (
                quiz.bands.slice().sort((a, b) => a.min_score - b.min_score).map((b, i) => (
                  <div className="row" key={i} style={{ padding: "5px 0", gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: b.color || "#0B4F3A", flex: "none" }} />
                    <span className="t-sm grow">{(b.emoji || "") + " " + (b.title || "—")}</span>
                    <span className="t-xs dim num">{b.min_score}–{b.max_score}</span>
                  </div>
                ))
              ) : <p className="t-sm dim">لم تُحدد مستويات.</p>}
            </div>
          </div>

          <div className={"note " + (problems.length ? "warn" : "ok")} style={{ marginTop: 16 }}>
            <Icon name={problems.length ? "alert" : "check"} strokeWidth={problems.length ? 1.8 : 2.2} />
            <span>
              {problems.length
                ? problems.map((p, i) => <span key={i}>{p}<br /></span>)
                : "التجربة جاهزة للحفظ والتشغيل."}
            </span>
          </div>

          <div className="row" style={{ marginTop: 16 }}>
            <button className="btn" onClick={save}>حفظ التجربة</button>
            {quiz.id ? <button className="btn ghost" onClick={() => newSession(quiz.id)}>إنشاء جلسة الآن</button> : null}
          </div>
        </div>
      )}

      <div className="wizfoot">
        <button className="btn ghost" style={{ visibility: step === 0 ? "hidden" : "visible" }} onClick={() => goStep(step - 1)}>السابق</button>
        <button className="btn" style={{ visibility: step === 3 ? "hidden" : "visible" }} onClick={() => goStep(step + 1)}>التالي</button>
        <div className="sp row">
          <span className="t-xs dim">{dirty ? "تغييرات غير محفوظة" : saved ? "محفوظ" : ""}</span>
          {quiz.id ? <button className="btn ghost sm" onClick={removeQuiz}>حذف التجربة</button> : null}
          <button className="btn" onClick={save}>حفظ</button>
        </div>
      </div>
    </>
  );
}
