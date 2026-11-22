import { Link } from "react-router-dom";
import useDocumentTitle from "../hooks/useDocumentTitle.js";

export default function NotFound() {
  useDocumentTitle("الصفحة غير موجودة");
  return (
    <div className="admin-root">
      <div style={{ maxWidth: 520, margin: "14vh auto", padding: "0 20px", textAlign: "center" }}>
        <div style={{ fontSize: 52, lineHeight: 1 }}>🧭</div>
        <h1 className="t-xl" style={{ margin: "14px 0 8px" }}>الصفحة غير موجودة</h1>
        <p className="t-sm dim" style={{ marginBottom: 20 }}>
          الرابط الذي فتحته لا يقابل أي صفحة في المنصة. تأكد من الرابط أو ابدأ من إحدى الوجهتين أدناه.
        </p>
        <div className="row" style={{ justifyContent: "center" }}>
          <Link className="btn" to="/">الدخول إلى تجربة</Link>
          <Link className="btn ghost" to="/dashboard">لوحة التحكم</Link>
        </div>
      </div>
    </div>
  );
}
