/* يمنع خطأ في صفحة واحدة من إسقاط التطبيق كله على شاشة بيضاء.
   ويميّز حالة واحدة شائعة: نشر جديد غيّر أسماء الملفات بينما التبويب
   مفتوح من النسخة السابقة. هذه ليست عطلاً، فنتعافى منها بإعادة تحميل
   واحدة بدل أن نُلقي على المستخدم رسالة خطأ. */
import { Component } from "react";
import { isChunkError, recoverFromStaleBuild, hasUnsavedWork } from "../lib/lazyPage.js";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { err: null, stale: false };
  }

  static getDerivedStateFromError(err) {
    return { err, stale: isChunkError(err) };
  }

  componentDidCatch(err, info) {
    /* نُبقي الأثر في السجلّ دائماً، لا في وضع التطوير فقط — فبدونه
       لا يمكن تشخيص ما حدث على جهاز المستخدم. */
    console.error("[tagyeer]", err, info && info.componentStack);
    if (isChunkError(err)) recoverFromStaleBuild();
  }

  render() {
    const { err, stale } = this.state;
    if (!err) return this.props.children;

    /* نسخة قديمة وعمل غير محفوظ: نطلب إعادة التحميل بدل أن نفرضها */
    const updated = stale && hasUnsavedWork();

    return (
      <div className="admin-root">
        <div style={{ maxWidth: 520, margin: "14vh auto", padding: "0 20px", textAlign: "center" }}>
          <h1 className="t-xl" style={{ marginBottom: 10 }}>
            {stale ? "صدر تحديث للمنصة" : "حدث خطأ غير متوقع"}
          </h1>
          <p className="t-sm dim" style={{ marginBottom: 18 }}>
            {stale
              ? (updated
                  ? "هذه النسخة قديمة. احفظ عملك إن أمكن ثم أعد التحميل لتعمل الصفحة."
                  : "هذه النسخة قديمة — أعد التحميل لتعمل الصفحة.")
              : "تعذّر عرض هذه الصفحة. يمكنك إعادة التحميل أو العودة إلى لوحة التحكم."}
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

/* حدّ أصغر داخل لوحة التحكم: صفحة واحدة تتعطّل فتبقى القائمة والترويسة
   صالحتين، ويكفي الانتقال إلى صفحة أخرى للتعافي. */
export class PaneBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }

  static getDerivedStateFromError(err) {
    return { err };
  }

  componentDidCatch(err, info) {
    console.error("[tagyeer]", err, info && info.componentStack);
    if (isChunkError(err)) recoverFromStaleBuild();
  }

  render() {
    if (!this.state.err) return this.props.children;
    const stale = isChunkError(this.state.err);
    return (
      <div className="note warn" style={{ margin: "18px 0", alignItems: "center" }}>
        <span>
          {stale ? "صدر تحديث للمنصة — أعد التحميل لتعمل هذه الصفحة." : "تعذّر عرض هذه الصفحة."}
          {" "}
          <button
            className="btn ghost xs"
            style={{ marginInlineStart: 8 }}
            onClick={() => window.location.reload()}
          >
            إعادة التحميل
          </button>
        </span>
      </div>
    );
  }
}
