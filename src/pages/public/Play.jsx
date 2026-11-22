/* تشغيل التجربة أمام المشارك: سؤال تلو الآخر، ثم شاشة النتيجة.
   يستأنف من حيث توقّف إذا حدّث الصفحة، ويعود إلى الدخول إذا ضاعت الحالة. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Shell, { Loading } from "./Shell.jsx";
import useDocumentTitle from "../../hooks/useDocumentTitle.js";
import party from "../../components/participant/confetti.js";
import { getSession, submitAnswers } from "../../lib/api.js";
import { clearState, friendly, readState, writeState } from "../../lib/participantState.js";
import { SHAPES, TEXT_MAX, TRUEFALSE } from "../../lib/config.js";

const qtypeOf = (q) => {
  const t = q?.qtype ? String(q.qtype) : "likert5";
  return t === "choice" || t === "truefalse" || t === "text" ? t : "likert5";
};

const Tick = () => (
  <span className="tick">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  </span>
);

function CountUp({ to, ms = 950 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / ms);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return <b>{n}</b>;
}

export default function Play() {
  const { code } = useParams();
  const nav = useNavigate();

  const [bundle, setBundle] = useState(null);
  const [pid, setPid] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const badgeRef = useRef(null);

  useDocumentTitle(result ? "نتيجتك" : bundle ? bundle.quiz.title : "التجربة");

  /* استعادة الحالة ثم جلب التجربة؛ بلا معرّف مشارك نعود إلى صفحة الدخول */
  useEffect(() => {
    let alive = true;
    const saved = readState();
    if (!saved?.pid || String(saved.code).toUpperCase() !== String(code).toUpperCase()) {
      nav("/join/" + code, { replace: true });
      return;
    }
    getSession(saved.code)
      .then((b) => {
        if (!alive) return;
        setBundle(b);
        setPid(saved.pid);
        setIdx(saved.idx || 0);
        setAnswers(saved.answers || []);
      })
      .catch(() => { clearState(); nav("/join/" + code, { replace: true }); });
    return () => { alive = false; };
  }, [code, nav]);

  const questions = bundle?.quiz?.questions || [];
  const q = questions[idx];
  const type = q ? qtypeOf(q) : null;
  const prev = useMemo(() => answers.find((a) => a.question_id === q?.id), [answers, q]);

  useEffect(() => {
    if (type === "text") setDraft(prev ? prev.label || "" : "");
  }, [type, prev, idx]);

  const persist = useCallback((next) => { writeState({ code, pid, ...next }); }, [code, pid]);

  const submit = useCallback(
    async (finalAnswers) => {
      setSending(true);
      try {
        const r = await submitAnswers(pid, finalAnswers);
        clearState();
        setResult(r);
      } catch (e) {
        setError(friendly(e));
        setLeaving(false);
      } finally {
        setSending(false);
      }
    },
    [pid]
  );

  const advance = useCallback(
    (nextAnswers) => {
      const list = nextAnswers ?? answers;
      setLeaving(true);
      setTimeout(() => {
        if (idx < questions.length - 1) {
          const n = idx + 1;
          setIdx(n);
          persist({ idx: n, answers: list });
          setLeaving(false);
        } else {
          submit(list);
        }
      }, 230);
    },
    [answers, idx, questions.length, persist, submit]
  );

  function saveText() {
    const v = draft.trim().slice(0, TEXT_MAX);
    const list = answers.filter((a) => a.question_id !== q.id);
    if (v) list.push({ question_id: q.id, value: 0, label: v, position: q.position, qtype: "text" });
    setAnswers(list);
    persist({ idx, answers: list });
    return list;
  }

  function pick(o) {
    const list = answers.filter((a) => a.question_id !== q.id);
    list.push({ question_id: q.id, value: o.score, label: o.label, position: q.position, qtype: type });
    setAnswers(list);
    persist({ idx, answers: list });
    setTimeout(() => advance(list), 420);
  }

  function back() {
    if (idx === 0) return;
    const list = type === "text" ? saveText() : answers;
    const n = idx - 1;
    setIdx(n);
    persist({ idx: n, answers: list });
  }

  /* ------------------------- النتيجة ------------------------- */
  const lowest = useMemo(
    () =>
      questions.reduce((sum, x) => {
        const vals = (x.options || []).map((o) => +o.score);
        return sum + (vals.length ? Math.min(...vals) : 0);
      }, 0),
    [questions]
  );

  useEffect(() => {
    if (!result || !bundle) return;
    const band = result.band;
    const local = (bundle.quiz.bands || []).find((x) => result.total >= x.min_score && result.total <= x.max_score);
    const cheer = !(band?.celebrate === false || local?.celebrate === false);
    const strong = (result.percent || 0) >= 60;
    const t = setTimeout(() => party(badgeRef.current, strong, cheer), 380);
    return () => clearTimeout(t);
  }, [result, bundle]);

  if (!bundle) return <Shell><Loading text="جارٍ فتح الجلسة…" /></Shell>;

  if (sending && !result) return <Shell title={bundle.quiz.title}><Loading text="جارٍ حساب نتيجتك…" /></Shell>;

  if (result) {
    const quiz = bundle.quiz;
    const band = result.band;
    const hi = result.max || quiz.max_score || 1;
    const hideScore = quiz.show_score === false || hi <= 0;
    const pct = hi > lowest ? Math.max(4, Math.round(((result.total - lowest) / (hi - lowest)) * 100)) : 100;

    return (
      <Shell title={quiz.title}>
        <section className="screen on">
          <div className="result">
            <p className="rkicker">{quiz.title}</p>
            <div className="rbadge" ref={badgeRef}>{band?.emoji || quiz.cover_emoji || "🌿"}</div>
            <h2 className="rlevel" style={band?.color ? { color: band.color } : undefined}>
              {band?.title || "تم تسجيل إجاباتك"}
            </h2>
            {!hideScore && (
              <div className="rscore" style={{ display: "inline-flex" }}>
                نتيجتك: <CountUp to={result.total} /> من <span>{hi}</span>
              </div>
            )}
            <p className="rmsg">{band?.message || "شكراً لمشاركتك في التجربة."}</p>

            {!hideScore && (
              <div className="gauge">
                <div className="gtrack">
                  {(quiz.bands || []).map((b, i) => (
                    <span key={i} style={{ background: b.color || "var(--green)", flex: Math.max(1, b.max_score - b.min_score + 1) }} />
                  ))}
                  <div className="gfill" style={{ width: pct + "%" }} />
                </div>
                <div className="gends"><span>{lowest}</span><span>{hi}</span></div>
              </div>
            )}

            <p className="rfoot">{quiz.footer_note || "التغيير يبدأ بك 🌱"}</p>
            <div className="btn-row">
              <button className="btn btn-ghost" onClick={() => { clearState(); nav("/join/" + code); }}>أعد التجربة</button>
            </div>
          </div>
        </section>
      </Shell>
    );
  }

  if (!q) return <Shell><Loading /></Shell>;

  const kind = type === "likert5" ? "العبارة" : "السؤال";
  const last = idx === questions.length - 1;
  const opts = q.options?.length ? q.options : type === "truefalse" ? TRUEFALSE : [];
  const showNext = type === "text" || !!prev;

  return (
    <Shell title={bundle.quiz.title} steps={idx + 1 + " من " + questions.length}>
      <section className="screen on">
        <div className="progress"><i style={{ width: (idx / questions.length) * 100 + "%" }} /></div>
        <div className="qwrap">
          <div className={"card qcard" + (leaving ? " out" : "")} key={idx}>
            <div className="qnum">{kind} <b>{idx + 1}</b> من {questions.length}</div>
            <p className="qtext">{q.text}</p>

            {type === "text" ? (
              <>
                <textarea
                  className="ta" maxLength={TEXT_MAX} placeholder="اكتب إجابتك هنا…"
                  value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus
                />
                <div className="tacount">{draft.length} / {TEXT_MAX}</div>
                <p className="qnote">إجابة حرّة — اكتب ما تراه، ولك أن تتركها فارغة.</p>
              </>
            ) : (
              <div className={"opts" + (type === "truefalse" ? " tf" : "")}>
                {opts.map((o, i) => {
                  const sel = prev && prev.label === o.label;
                  return (
                    <button
                      key={i}
                      className={"opt" + (type === "truefalse" ? " tfopt" : "") + (sel ? " sel" : "")}
                      onClick={() => pick(o)}
                    >
                      {type === "truefalse" ? (
                        <span className="badge" style={{ background: i === 0 ? "#1E7A52" : "#A4342C" }}>{i === 0 ? "✓" : "✕"}</span>
                      ) : type === "choice" ? (
                        <span className="shape" style={{ background: SHAPES[i % SHAPES.length].c }}>{SHAPES[i % SHAPES.length].s}</span>
                      ) : (
                        <Tick />
                      )}
                      <span>{o.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {error ? <p className="msg" style={{ textAlign: "center" }}>{error}</p> : null}

            <div className="qfoot">
              <button className="link" hidden={idx === 0} onClick={back}>‹ السابق</button>
              <button
                className="link"
                hidden={!showNext}
                style={{ color: "var(--green)", fontWeight: 600 }}
                onClick={() => advance(type === "text" ? saveText() : answers)}
              >
                {last ? "إنهاء ›" : "التالي ›"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}
