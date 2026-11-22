import { useNavigate } from "react-router-dom";
import useDocumentTitle from "../../../hooks/useDocumentTitle.js";
import { useSession } from "./SessionPage.jsx";
import { useAsk } from "../../../components/ui/Dialog.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { useAuth } from "../../../lib/auth.jsx";
import { useAdminData } from "../../../hooks/useAdminData.jsx";
import { deleteSession, resetSession } from "../../../lib/api.js";
import { joinLink } from "../../../lib/links.js";

export default function TabSettings() {
  const { session, results, toggle, reload } = useSession();
  useDocumentTitle("إعدادات الجلسة — " + session.code);
  const ask = useAsk();
  const toast = useToast();
  const nav = useNavigate();
  const { pw } = useAuth();
  const { refreshSessions } = useAdminData();

  const url = joinLink(session.code);
  const open = session.status === "open";

  const copy = () =>
    navigator.clipboard?.writeText(url).then(() => toast("تم النسخ"), () => toast("تعذر النسخ", true));

  async function reset() {
    const n = results?.stats?.joined || 0;
    if (!n) { toast("لا توجد نتائج لحذفها", true); return; }
    const v = await ask({
      title: "حذف نتائج الجلسة",
      text: "سيتم حذف نتائج " + n + " مشارك نهائياً.\nرمز الجلسة " + session.code + " يبقى كما هو.\n\nاكتبي كلمة «حذف» للتأكيد.",
      input: true, placeholder: "حذف", yes: "تأكيد الحذف", danger: true,
    });
    if (v !== "حذف") { if (v !== null) toast("تم إلغاء الحذف"); return; }
    try { await resetSession(pw, session.id); await refreshSessions(); reload(); toast("تم تصفير نتائج الجلسة"); }
    catch (e) { toast(e.message, true); }
  }

  async function remove() {
    const ok = await ask({
      title: "حذف الجلسة",
      text: "سيتم حذف الجلسة «" + session.code + "» وكل نتائجها نهائياً.",
      yes: "حذف", danger: true,
    });
    if (!ok) return;
    try { await deleteSession(pw, session.id); await refreshSessions(); toast("تم الحذف"); nav("/sessions"); }
    catch (e) { toast(e.message, true); }
  }

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 640 }}>
      <div className="card pad">
        <h3 className="t-md" style={{ marginBottom: 4 }}>رابط الدخول</h3>
        <p className="t-sm muted" style={{ marginBottom: 12 }}>أرسليه للمشاركين، أو اعرضي شاشة العرض ليمسحوا رمز QR.</p>
        <div className="row">
          <input className="inp grow" value={url} readOnly />
          <button className="btn sm" onClick={copy}>نسخ</button>
        </div>
      </div>

      <div className="card pad">
        <h3 className="t-md" style={{ marginBottom: 4 }}>حالة الجلسة</h3>
        <p className="t-sm muted" style={{ marginBottom: 12 }}>الجلسة المغلقة ترفض أي دخول جديد، والنتائج تبقى كما هي.</p>
        <button className="btn ghost sm" onClick={toggle}>{open ? "إغلاق الجلسة" : "إعادة فتح الجلسة"}</button>
      </div>

      <div className="card pad">
        <h3 className="t-md" style={{ marginBottom: 4 }}>تصفير النتائج</h3>
        <p className="t-sm muted" style={{ marginBottom: 12 }}>يحذف نتائج المشاركين ويُبقي رمز الجلسة كما هو.</p>
        <button className="btn danger sm" onClick={reset}>حذف نتائج الجلسة</button>
      </div>

      <div className="card pad">
        <h3 className="t-md" style={{ marginBottom: 4 }}>حذف الجلسة</h3>
        <p className="t-sm muted" style={{ marginBottom: 12 }}>يحذف الجلسة ورمزها وكل نتائجها نهائياً.</p>
        <button className="btn danger sm" onClick={remove}>حذف الجلسة</button>
      </div>
    </div>
  );
}
