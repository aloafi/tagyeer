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
import { WM_PATH, WM_VIEWBOX } from "../../components/ui/Wordmark.jsx";

const POLL_MS = 5000;

/* خلفية شاشة العرض: شبكة منتظمة من علامة «أثر» مائلة 20°.
   تُبنى بلاطةً واحدة من مسار العلامة نفسه (مصدر واحد في Wordmark)،
   وتتكرّر تلقائياً بانتظام، ثم تُزاح الطبقة بمقدار بلاطة كاملة فتبدو
   الشبكة نازلة بلا بداية ولا نهاية. */
const TILE_W = 1670;              /* عرض البلاطة في إحداثيات الرسم */
const TILE_H = 1705;              /* ارتفاعها — النسبة نفسها في CSS */

/* مركز العلامة يُحسب من إطارها المُصدَّر، فلا يحتاج ضبطاً يدوياً إن
   تغيّرت العلامة يوماً */
const [VB_X, VB_Y, VB_W, VB_H] = WM_VIEWBOX.split(" ").map(Number);
const CX = VB_X + VB_W / 2;
const CY = VB_Y + VB_H / 2;

const TILE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + TILE_W + ' ' + TILE_H + '">' +
  '<g transform="rotate(20 ' + TILE_W / 2 + ' ' + TILE_H / 2 + ') translate(' +
  (TILE_W / 2 - CX) + ' ' + (TILE_H / 2 - CY) + ')">' +
  '<path fill="#ffffff" fill-rule="evenodd" d="' + WM_PATH + '"/>' +
  "</g></svg>";

const TILE_URL = 'url("data:image/svg+xml,' + encodeURIComponent(TILE_SVG) + '")';

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
          <div className="projgrid" style={{ backgroundImage: TILE_URL }} />
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
