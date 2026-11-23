/* شاشة العرض أمام الحضور: الرمز كبير، رمز QR، وعدّاد المنضمين يتحدث مباشرة.
   مسار مستقل، فيمكن فتحها في شاشة ثانية أو مشاركتها مع المنسّق. */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import qrcode from "qrcode-generator";
import { useAuth } from "../../lib/auth.jsx";
import { useAdminData } from "../../hooks/useAdminData.jsx";
import { sessionResults } from "../../lib/api.js";
import { joinLink } from "../../lib/links.js";
import useDocumentTitle from "../../hooks/useDocumentTitle.js";
import { Spinner, Empty } from "../../components/ui/Primitives.jsx";
import Wordmark from "../../components/ui/Wordmark.jsx";

const POLL_MS = 5000;

/* خلفية شاشة العرض: علامات «تغيير» مائلة 45° تنزل ببطء.
   قيم ثابتة لا عشوائية، حتى يكون التوزيع متوازناً ويتكرّر كما هو:
   x موضعها الأفقي · w عرضها · o شفافيتها · d زمن النزول · s بداية مزاحة
   للخلف ليبدأ المشهد موزّعاً · f انحراف أفقي خفيف · y موضع ثابت حين
   يطلب الجهاز تقليل الحركة. */
const MARKS = [
  { x: 1,  w: 111, o: 0.097, d: 36, s: -25, f: 0.8,  y: 45 },
  { x: 5,  w: 83,  o: 0.078, d: 42, s: -19, f: 3.2,  y: 35 },
  { x: 6,  w: 78,  o: 0.086, d: 41, s: -21, f: -0.4, y: 70 },
  { x: 8,  w: 125, o: 0.097, d: 44, s: -10, f: 0.2,  y: 43 },
  { x: 18, w: 64,  o: 0.082, d: 47, s: -13, f: -3.4, y: 64 },
  { x: 20, w: 98,  o: 0.091, d: 46, s: -11, f: 3.8,  y: 83 },
  { x: 25, w: 122, o: 0.091, d: 41, s: -25, f: -0.8, y: 68 },
  { x: 26, w: 59,  o: 0.079, d: 45, s: -27, f: 2.8,  y: 39 },
  { x: 30, w: 90,  o: 0.084, d: 47, s: -7,  f: 1.8,  y: 3  },
  { x: 35, w: 118, o: 0.094, d: 45, s: -10, f: 3.5,  y: 74 },
  { x: 42, w: 97,  o: 0.085, d: 45, s: -42, f: -3.2, y: 2  },
  { x: 43, w: 62,  o: 0.080, d: 46, s: -14, f: -0.8, y: 17 },
  { x: 46, w: 129, o: 0.097, d: 39, s: -15, f: 2.3,  y: 32 },
  { x: 50, w: 76,  o: 0.084, d: 49, s: -34, f: -2.9, y: 27 },
  { x: 51, w: 70,  o: 0.079, d: 50, s: -11, f: -3.2, y: 30 },
  { x: 57, w: 150, o: 0.111, d: 35, s: -13, f: -1.9, y: 71 },
  { x: 62, w: 78,  o: 0.080, d: 43, s: -11, f: 2.7,  y: 27 },
  { x: 68, w: 89,  o: 0.085, d: 40, s: -15, f: -2.8, y: 28 },
  { x: 66, w: 145, o: 0.099, d: 37, s: -11, f: -2.1, y: 54 },
  { x: 76, w: 85,  o: 0.089, d: 48, s: -13, f: -0.9, y: 74 },
  { x: 74, w: 82,  o: 0.086, d: 39, s: -23, f: -2.0, y: 59 },
  { x: 84, w: 120, o: 0.100, d: 38, s: 0,   f: 3.6,  y: 65 },
  { x: 84, w: 64,  o: 0.083, d: 46, s: -4,  f: 2.9,  y: 89 },
  { x: 91, w: 71,  o: 0.081, d: 48, s: -10, f: -1.7, y: 41 },
  { x: 95, w: 124, o: 0.096, d: 35, s: -20, f: -1.6, y: 46 },
  { x: 97, w: 99,  o: 0.093, d: 45, s: -23, f: 1.9,  y: 11 },
];

export default function Projection() {
  const { code } = useParams();
  const { pw } = useAuth();
  const { sessions, loaded } = useAdminData();
  const nav = useNavigate();
  const [count, setCount] = useState(0);
  const timer = useRef(null);

  const session = useMemo(
    () => sessions.find((s) => String(s.code).toUpperCase() === String(code).toUpperCase()) || null,
    [sessions, code]
  );

  useDocumentTitle(session ? "شاشة العرض — " + session.code : "شاشة العرض");

  const url = session ? joinLink(session.code) : "";

  const qrSvg = useMemo(() => {
    if (!url) return "";
    try {
      const q = qrcode(0, "M");
      q.addData(url);
      q.make();
      return q.createSvgTag({ cellSize: 6, margin: 1, scalable: true });
    } catch { return ""; }
  }, [url]);

  useEffect(() => {
    if (!session) return;
    const tick = () =>
      sessionResults(pw, session.id).then((r) => setCount(r.stats.joined)).catch(() => {});
    tick();
    timer.current = setInterval(tick, POLL_MS);
    return () => clearInterval(timer.current);
  }, [session, pw]);

  /* الخروج بمفتاح Escape كما في شاشات العرض المعتادة */
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  function close() {
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    nav(session ? "/sessions/" + session.code : "/sessions");
  }

  if (!loaded) return <div className="admin-root"><Spinner big /></div>;
  if (!session)
    return (
      <div className="admin-root" style={{ padding: 24 }}>
        <Empty icon="alert" title="الجلسة غير موجودة" action={<button className="btn" onClick={() => nav("/sessions")}>كل الجلسات</button>}>
          لا توجد جلسة بالرمز «{code}».
        </Empty>
      </div>
    );

  return (
    <div className="admin-root">
      <div id="proj" className="on">
        {/* زينة فقط — لا تتلقّى ضغطاً ولا يقرأها القارئ الصوتي */}
        <div className="projfall" aria-hidden="true">
          {MARKS.map((m, i) => (
            <span
              key={i}
              style={{
                "--x": m.x + "%",
                "--w": m.w + "px",
                "--o": m.o,
                "--dur": m.d + "s",
                "--delay": m.s + "s",
                "--drift": m.f + "vw",
                "--y": m.y + "%",
              }}
            >
              <Wordmark title="" />
            </span>
          ))}
        </div>

        <button className="closex" onClick={close} aria-label="إغلاق">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="pgrid">
          <div>
            <h2>{session.quiz_title || ""}</h2>
            <p style={{ color: "#A9CDBB", margin: 0 }}>ادخل على الرابط وأدخل الرمز</p>
            <div className="bigcode">{session.code}</div>
            <div className="purl">{url}</div>
            <div className="livec"><span className="d" /><span>{count}</span> مشارك انضم</div>
          </div>
          <div className="qrbox" dangerouslySetInnerHTML={{ __html: qrSvg }} />
        </div>
      </div>
    </div>
  );
}
