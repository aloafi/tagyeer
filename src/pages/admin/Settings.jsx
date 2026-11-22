import { useState } from "react";
import { usePageHead } from "../../layouts/AdminLayout.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { useAuth } from "../../lib/auth.jsx";
import Icon from "../../components/ui/Icon.jsx";
import { LS, KEYS } from "../../lib/storage.js";
import { participantUrl } from "../../lib/links.js";
import { changePassword } from "../../lib/api.js";

export default function Settings() {
  usePageHead({ title: "الإعدادات" }, []);
  const toast = useToast();
  const { pw, setPw } = useAuth();

  const [url, setUrl] = useState(() => participantUrl());
  const [minN, setMinN] = useState(() => parseInt(LS.get(KEYS.minN) || "3", 10) || 3);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");

  function saveUrl() {
    const v = url.trim();
    if (v) LS.set(KEYS.joinUrl, v, true); else LS.del(KEYS.joinUrl);
    setUrl(participantUrl());
    toast("تم حفظ الرابط");
  }

  function saveMinN() {
    const v = Math.max(1, Math.min(50, parseInt(minN, 10) || 3));
    setMinN(v);
    LS.set(KEYS.minN, String(v), true);
    toast("تم الحفظ — الحد الأدنى " + v);
  }

  async function savePw() {
    if (!cur || !next) { toast("أدخلي كلمتي المرور", true); return; }
    try {
      await changePassword(cur, next);
      LS.set(KEYS.pw, next, true);
      setPw(next);
      setCur(""); setNext("");
      toast("تم تحديث كلمة المرور");
    } catch (e) { toast(e.message, true); }
  }

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 640 }}>
      <div className="card pad">
        <h3 className="t-md" style={{ marginBottom: 4 }}>رابط صفحة المشاركين</h3>
        <p className="t-sm muted" style={{ marginBottom: 12 }}>يُستخدم في رمز QR ورابط الدخول. اتركيه فارغاً للرجوع إلى الافتراضي.</p>
        <div className="row">
          <input className="inp grow" placeholder="https://tagyeer.site" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button className="btn sm" onClick={saveUrl}>حفظ</button>
        </div>
      </div>

      <div className="card pad">
        <h3 className="t-md" style={{ marginBottom: 4 }}>الحد الأدنى لحجم العينة</h3>
        <p className="t-sm muted" style={{ marginBottom: 12 }}>
          أي خلية في المصفوفة تستند إلى عدد أقل من هذا تظهر N/A، لتقليل احتمال التعرف على الأفراد في المجموعات الصغيرة.
        </p>
        <div className="row">
          <input className="inp num" type="number" min="1" max="50" style={{ maxWidth: 110 }} value={minN} onChange={(e) => setMinN(e.target.value)} />
          <button className="btn sm" onClick={saveMinN}>حفظ</button>
        </div>
      </div>

      <div className="card pad">
        <h3 className="t-md" style={{ marginBottom: 12 }}>تغيير كلمة المرور</h3>
        <div className="row">
          <input className="inp grow" type="password" placeholder="كلمة المرور الحالية" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} />
          <input className="inp grow" type="password" placeholder="كلمة المرور الجديدة" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
          <button className="btn sm" onClick={savePw}>تحديث</button>
        </div>
      </div>

      <div className="note info">
        <Icon name="alert" strokeWidth={1.8} />
        <span>
          المنصة مستضافة خارج البنية التقنية للوزارة. يُفضَّل قصر استخدامها على بيانات الرأي والتفاعل دون بيانات شخصية أو تشغيلية حساسة.
        </span>
      </div>
    </div>
  );
}
