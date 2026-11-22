/* يمنع خطأ في صفحة واحدة من إسقاط التطبيق كله على شاشة بيضاء. */
import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }

  static getDerivedStateFromError(err) {
    return { err };
  }

  componentDidCatch(err, info) {
    if (import.meta.env.DEV) console.error("[tagyeer]", err, info);
  }

  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="admin-root">
        <div style={{ maxWidth: 520, margin: "14vh auto", padding: "0 20px", textAlign: "center" }}>
          <h1 className="t-xl" style={{ marginBottom: 10 }}>حدث خطأ غير متوقع</h1>
          <p className="t-sm dim" style={{ marginBottom: 18 }}>
            تعذّر عرض هذه الصفحة. يمكنك إعادة التحميل أو العودة إلى لوحة التحكم.
          </p>
          <div className="row" style={{ justifyContent: "center" }}>
            <button className="btn" onClick={() => window.location.reload()}>إعادة التحميل</button>
            <button className="btn ghost" onClick={() => { window.location.href = "/dashboard"; }}>لوحة التحكم</button>
          </div>
        </div>
      </div>
    );
  }
}
