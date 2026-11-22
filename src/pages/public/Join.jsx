/* دخول المشارك: رمز الجلسة ثم الاسم والجهة. ينتقل بعدها إلى /play/<الرمز>. */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Shell, { Loading } from "./Shell.jsx";
import QrScanner from "../../components/participant/QrScanner.jsx";
import useDocumentTitle, { SITE } from "../../hooks/useDocumentTitle.js";
import { getSession, joinSession } from "../../lib/api.js";
import { clearState, friendly, writeState } from "../../lib/participantState.js";

export default function Join() {
  const { code: codeParam } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();

  /* دعم الروابط القديمة ?c=ABC123 إلى جانب /join/ABC123 */
  const initial = (codeParam || sp.get("c") || sp.get("code") || "").toUpperCase();

  const [stage, setStage] = useState(initial ? "loading" : "code");
  const [code, setCode] = useState(initial);
  const [bundle, setBundle] = useState(null);
  const [msg, setMsg] = useState("");
  const [name, setName] = useState("");
  const [meta, setMeta] = useState("");
  const [busy, setBusy] = useState(false);
  const [scan, setScan] = useState(false);
  const codeRef = useRef(null);
  const nameRef = useRef(null);
  const metaRef = useRef(null);

  useDocumentTitle(bundle ? bundle.quiz.title : "انضم إلى تجربة");

  const open = useCallback(
    async (raw) => {
      const c = String(raw || "").trim().toUpperCase();
      if (c.length < 4) { setMsg("أدخل رمز الجلسة كاملاً."); setStage("code"); return; }
      setBusy(true);
      setStage("loading");
      try {
        const b = await getSession(c);
        if (!b) throw new Error("session_not_found");
        if (b.status !== "open") throw new Error("session_closed");
        setBundle(b);
        setCode(b.code);
        setStage("name");
        setMsg("");
        setTimeout(() => {
          if (b.quiz.ask_name !== false) nameRef.current?.focus();
          else if (b.quiz.ask_meta) metaRef.current?.focus();
        }, 250);
      } catch (e) {
        setMsg(friendly(e));
        setStage("code");
      } finally {
        setBusy(false);
      }
    },
    []
  );

  useEffect(() => {
    if (initial) open(initial);
    else setTimeout(() => codeRef.current?.focus(), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  async function start() {
    const askName = bundle && bundle.quiz.ask_name !== false;
    const n = askName ? name.trim() : "";
    if (askName && !n) { setMsg("الرجاء كتابة الاسم."); nameRef.current?.focus(); return; }
    const m = meta.trim();
    if (bundle.quiz.ask_meta && !m) {
      setMsg("الرجاء تعبئة: " + (bundle.quiz.meta_label || "الإدارة / الجهة"));
      metaRef.current?.focus();
      return;
    }
    setBusy(true);
    try {
      const j = await joinSession(code, n, m);
      clearState();
      writeState({ code, pid: j.participant_id, idx: 0, answers: [] });
      nav("/play/" + code);
    } catch (e) {
      setMsg(friendly(e));
    } finally {
      setBusy(false);
    }
  }

  if (stage === "loading") return <Shell><Loading text="جارٍ فتح الجلسة…" /></Shell>;

  if (stage === "name" && bundle) {
    const q = bundle.quiz;
    return (
      <Shell title={q.title || SITE}>
        <section className="screen on">
          <div className="hero">
            <div className="emblem" style={{ fontSize: 40 }}>{q.cover_emoji || "🌱"}</div>
            <h1>{q.title}</h1>
            <p className="lede">{q.subtitle || ""}</p>
            <div className="field">
              {q.ask_name !== false && (
                <div>
                  <label className="label" htmlFor="in-name">الاسم</label>
                  <input
                    ref={nameRef} id="in-name" className="input" placeholder="اكتب اسمك هنا"
                    autoComplete="name" maxLength={80} value={name}
                    onChange={(e) => { setName(e.target.value); setMsg(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") start(); }}
                  />
                </div>
              )}
              {q.ask_meta && (
                <div style={{ marginTop: 14 }}>
                  <label className="label" htmlFor="in-meta">
                    {q.meta_label || "الإدارة / الجهة"} <span style={{ color: "#A4342C" }}>*</span>
                  </label>
                  <input
                    ref={metaRef} id="in-meta" className="input" placeholder="اكتب هنا" maxLength={120}
                    value={meta} onChange={(e) => { setMeta(e.target.value); setMsg(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") start(); }}
                  />
                </div>
              )}
              <div className="msg">{msg}</div>
            </div>
            <button className="btn" onClick={start} disabled={busy}>ابدأ</button>
            <p className="hint">{q.intro || ""}</p>
          </div>
        </section>
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="screen on">
        <div className="hero">
          <div className="emblem">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 21c4.5-2 7-5.5 7-10a7 7 0 0 0-14 0c0 4.5 2.5 8 7 10z" />
              <path d="M12 21V9" /><path d="M12 13c-1.8 0-3.2-1.2-3.6-3 1.9-.3 3.2.8 3.6 3z" />
            </svg>
          </div>
          <h1>أهلاً بك 👋</h1>
          <p className="lede">أدخل رمز الجلسة الظاهر على الشاشة للانضمام.</p>

          <div className="field">
            <input
              ref={codeRef}
              className="input code"
              maxLength={6}
              inputMode="latin"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="ABC123"
              aria-label="رمز الجلسة"
              value={code}
              onChange={(e) => {
                const v = e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6);
                setCode(v);
                setMsg("");
                if (v.length === 6) open(v);
              }}
              onKeyDown={(e) => { if (e.key === "Enter") open(code); }}
            />
            <div className="msg">{msg}</div>
          </div>

          <button className="btn" onClick={() => open(code)} disabled={busy}>دخول</button>
          <button className="btn btn-scan" onClick={() => setScan(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 8V5a2 2 0 0 1 2-2h3" /><path d="M16 3h3a2 2 0 0 1 2 2v3" />
              <path d="M21 16v3a2 2 0 0 1-2 2h-3" /><path d="M8 21H5a2 2 0 0 1-2-2v-3" /><path d="M7 12h10" />
            </svg>
            امسح رمز QR
          </button>
          <p className="hint">وجّه الكاميرا للرمز المعروض على الشاشة، أو اكتب الرمز يدوياً.</p>
        </div>
      </section>

      <QrScanner open={scan} onClose={() => setScan(false)} onCode={(c) => { setScan(false); setCode(c); open(c); }} />
    </Shell>
  );
}
