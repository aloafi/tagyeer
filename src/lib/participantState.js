/* حالة المشارك أثناء التجربة — تبقى في sessionStorage حتى لا يضيع تقدّمه
   إذا حدّث الصفحة أو أُغلق المتصفح لحظة. */
const KEY = "cmq_session_state";

export function readState() {
  try { return JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch { return null; }
}

export function writeState(s) {
  try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch { /* تجاهل */ }
}

export function clearState() {
  try { sessionStorage.removeItem(KEY); } catch { /* تجاهل */ }
}

export const PARTICIPANT_ERRORS = {
  session_not_found: "لا توجد جلسة بهذا الرمز. تأكد من الرمز المعروض على الشاشة.",
  session_closed: "هذه الجلسة مغلقة حالياً.",
  name_required: "الرجاء كتابة الاسم.",
  meta_required: "الرجاء تعبئة جميع الحقول المطلوبة.",
  participant_not_found: "انتهت صلاحية الجلسة، ابدأ من جديد.",
};

/* رسائل الخادم تُترجم إلى عربية مفهومة للمشارك */
export function friendly(err) {
  const raw = String(err?.raw || err?.message || err || "");
  const key = Object.keys(PARTICIPANT_ERRORS).find((k) => raw.includes(k));
  return key ? PARTICIPANT_ERRORS[key] : raw || "تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.";
}
