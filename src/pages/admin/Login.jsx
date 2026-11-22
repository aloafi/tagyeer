import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Icon from "../../components/ui/Icon.jsx";
import { useAuth } from "../../lib/auth.jsx";
import useDocumentTitle from "../../hooks/useDocumentTitle.js";

export default function Login() {
  useDocumentTitle("تسجيل الدخول");
  const { login, authed, checking } = useAuth();
  const [pw, setPw] = useState("");
  const [remember, setRemember] = useState(true);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from || "/dashboard";

  if (checking) return <div className="route-fallback"><span className="ring" />جارٍ التحقق…</div>;
  if (authed) return <Navigate to={from} replace />;

  async function submit(e) {
    e?.preventDefault();
    if (!pw) { setMsg("أدخل كلمة المرور."); return; }
    setBusy(true); setMsg("");
    try {
      await login(pw, remember);
      nav(from, { replace: true });
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-root">
      <div id="login" style={{ display: "flex" }}>
        <form className="box" onSubmit={submit}>
          <div className="logomark"><Icon name="refresh" /></div>
          <h1 style={{ fontSize: 20, color: "var(--brand-800)" }}>منصة تغيير</h1>
          <p className="t-sm muted" style={{ margin: "6px 0 20px" }}>لوحة تحكم التجارب التفاعلية</p>

          <input
            className="inp"
            type="password"
            placeholder="كلمة المرور"
            autoComplete="current-password"
            style={{ textAlign: "center" }}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />

          <label className="sw" style={{ margin: "14px 0 2px" }}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <i /><span>ابقِ الجلسة مفتوحة على هذا الجهاز</span>
          </label>

          <div className="t-xs" style={{ minHeight: 20, color: "var(--danger)" }}>{msg}</div>
          <button className="btn" style={{ width: "100%" }} disabled={busy}>{busy ? "جارٍ الدخول…" : "دخول"}</button>
        </form>
      </div>
    </div>
  );
}
