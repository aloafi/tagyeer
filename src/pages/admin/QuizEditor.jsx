/* محرر التجربة — التحرير يجري على محاكاة شاشة المشارك نفسها،
   ومعها تبويبان للمستويات والمراجعة. */
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
import Simulator from "./editor/Simulator.jsx";
import { blankQuiz, qtypeOf, TYPES } from "../../lib/config.js";
import { getQuiz, saveQuiz, deleteQuiz, createSession } from "../../lib/api.js";
import { participantUrl } from "../../lib/links.js";

const TABS = ["المحاكاة", "المستويات", "المراجعة"];
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
  const [tab, setTab] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [openSet, setOpenSet] = useState(() => new Set());
  const [focusIdx, setFocusIdx] = useState(0);
  /* الشاشة المعروضة في المحاكاة: "start" أو رقم السؤال أو "result" */
  const [sel, setSel] = useState("start");
  const [listView, setListView] = useState(false);

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

  const goTab = useCallback((n) => {
    setTab(Math.max(0, Math.min(TABS.length - 1, n)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const save = useCallback(async () => {
    if (!quiz) return null;
    if (!String(quiz.title || "").trim()) {
      toast("اكتب اسم التجربة على شاشة البداية", true);
      goTab(0); setSel("start"); return null;
    }
    if (!quiz.questions.length) { toast("أضف سؤالاً واحداً على الأقل", true); goTab(0); return null; }
    const bad = quiz.questions.findIndex((x) => !String(x.text || "").trim());
    if (bad > -1) {
      toast("السؤال رقم " + (bad + 1) + " بلا نص", true);
      goTab(0); setSel(bad); setOpenSet(new Set([bad])); return null;
    }
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
  }, [quiz, pw, toast, goTab, refreshQuizzes, id, nav]);

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
          <button className="btn ghost sm" onClick={preview}>فتح على الجوال</button>
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
  if (!quiz.title) problems.push("التجربة بلا اسم.");
  if (!quiz.questions.length) problems.push("لا توجد أسئلة.");
  (quiz.questions || []).forEach((x, i) => { if (!String(x.text || "").trim()) problems.push("السؤال رقم " + (i + 1) + " بلا نص."); });
  if (quiz.questions.some(scored) && !quiz.bands.length)
    problems.push("لا توجد مستويات نتيجة — سيرى المشارك درجته بلا رسالة.");

  return (
    <>
      <div className="steps">
        {TABS.map((label, i) => (
          <button key={i} className={"step" + (i === tab ? " on" : "")} onClick={() => goTab(i)}>
            <span className="n">{i + 1}</span>{label}
          </button>
        ))}
        {tab === 0 && (
          <div className="seg sp simview">
            <button className={listView ? "" : "on"} onClick={() => setListView(false)} title="محاكاة الجهاز">
              <Icon name="present" strokeWidth={1.8} />
            </button>
            <button className={listView ? "on" : ""} onClick={() => setListView(true)} title="قائمة الأسئلة">
              <Icon name="rows" strokeWidth={1.8} />
            </button>
          </div>
        )}
      </div>

      {tab === 0 && (
        <div className="wizpane on">
          {listView ? (
            <QuestionList
              questions={quiz.questions || []}
              setQuestions={setQuestions}
              openSet={openSet}
              setOpenSet={setOpenSet}
              onFocus={(i) => { setFocusIdx(i); setSel(i); }}
            />
          ) : (
            <Simulator quiz={quiz} patch={patch} sel={sel} setSel={setSel} lo={lo} hi={hi} />
          )}
        </div>
      )}

      {tab === 1 && (
        <div className="wizpane on">
          <BandsEditor bands={quiz.bands || []} setBands={setBands} lo={lo} hi={hi} />
        </div>
      )}

      {tab === 2 && (
        <div className="wizpane on">
          <div className="chartgrid">
            <div className="card pad">
              <div style={{ fontSize: 28 }}>{quiz.cover_emoji || "🌱"}</div>
              <h3 className="t-lg" style={{ margin: "6px 0 3px" }}>{quiz.title || "تجربة بدون اسم"}</h3>
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
        <button className="btn ghost" style={{ visibility: tab === 0 ? "hidden" : "visible" }} onClick={() => goTab(tab - 1)}>السابق</button>
        <button className="btn" style={{ visibility: tab === TABS.length - 1 ? "hidden" : "visible" }} onClick={() => goTab(tab + 1)}>التالي</button>
        <div className="sp row">
          <span className="t-xs dim">{dirty ? "تغييرات غير محفوظة" : saved ? "محفوظ" : ""}</span>
          {quiz.id ? <button className="btn ghost sm" onClick={removeQuiz}>حذف التجربة</button> : null}
          <button className="btn" onClick={save}>حفظ</button>
        </div>
      </div>
    </>
  );
}
