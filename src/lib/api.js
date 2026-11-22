/* طبقة الوصول إلى البيانات — كل نداء يمرّ عبر دوال RPC المحروسة في قاعدة البيانات.
   لا توجد كلمات مرور محفوظة هنا؛ تُمرَّر من سياق الجلسة عند كل نداء. */
import { CFG } from "./config.js";

export class ApiError extends Error {}

export async function rpc(fn, args, { signal } = {}) {
  let r;
  try {
    r = await fetch(CFG.URL + "/rest/v1/rpc/" + fn, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: CFG.KEY,
        Authorization: "Bearer " + CFG.KEY,
      },
      body: JSON.stringify(args || {}),
      signal,
    });
  } catch (e) {
    if (e && e.name === "AbortError") throw e;
    throw new ApiError("تعذر الاتصال بالخادم. تحقق من الشبكة وحاول مجدداً.");
  }

  const t = await r.text();
  let d = null;
  try { d = t ? JSON.parse(t) : null; } catch { /* استجابة غير JSON */ }

  if (!r.ok) {
    const m = String((d && (d.message || d.details || d.hint)) || t || "");
    if (m.includes("unauthorized")) throw new ApiError("كلمة المرور غير صحيحة.");
    if (m.includes("weak_password")) throw new ApiError("كلمة المرور الجديدة قصيرة جداً.");
    const e = new ApiError("تعذر تنفيذ الطلب. تحقق من الاتصال وحاول مجدداً.");
    e.raw = m;          /* السبب الأصلي يبقى متاحاً لترجمة رسائل المشارك */
    e.status = r.status;
    throw e;
  }
  return d;
}

/* ---------- المشارِك ----------
   أسماء المعاملات هنا يجب أن تطابق توقيع الدالة في قاعدة البيانات حرفاً بحرف،
   وإلا ردّ PostgREST بأن الدالة غير موجودة. راجع scripts/check-rpc.mjs */
export const getSession   = (code)            => rpc("cmq_get_session", { code });
export const joinSession  = (code, name, meta)=> rpc("cmq_join", { code, p_name: name, p_meta: meta });
export const submitAnswers= (pid, answers)    => rpc("cmq_submit", { p_participant: pid, answers });

/* ---------- المسؤول ---------- */
export const adminLogin     = (pw)                 => rpc("cmq_admin_login", { pw });
export const listQuizzes    = (pw)                 => rpc("cmq_admin_list_quizzes", { pw });
export const listSessions   = (pw, quizId = null)  => rpc("cmq_admin_list_sessions", { pw, p_quiz: quizId });
export const getQuiz        = (pw, id)             => rpc("cmq_admin_get_quiz", { pw, p_quiz: id });
export const saveQuiz       = (pw, payload)        => rpc("cmq_admin_save_quiz", { pw, payload });
export const deleteQuiz     = (pw, id)             => rpc("cmq_admin_delete_quiz", { pw, p_quiz: id });
export const createSession  = (pw, quizId, title)  => rpc("cmq_admin_create_session", { pw, p_quiz: quizId, p_title: title || "" });
export const setSessionStatus = (pw, id, status)   => rpc("cmq_admin_set_session_status", { pw, p_session: id, p_status: status });
export const deleteSession  = (pw, id)             => rpc("cmq_admin_delete_session", { pw, p_session: id });
export const resetSession   = (pw, id)             => rpc("cmq_admin_reset_session", { pw, p_session: id });
export const changePassword = (pw, next)           => rpc("cmq_admin_change_password", { pw, new_pw: next });
export const sessionResults = (pw, id, opts)       => rpc("cmq_admin_session_results", { pw, p_session: id }, opts);
