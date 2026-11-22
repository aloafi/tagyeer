/* يتحقق أن أسماء معاملات كل نداء RPC تطابق توقيع الدالة في قاعدة البيانات.
   خطأ حرف واحد في اسم معامل يجعل PostgREST يردّ «الدالة غير موجودة»، وهو ما لا
   تكشفه الاختبارات التي تزيّف طبقة الشبكة. لذلك يُنادى الخادم الحقيقي هنا.

   كل نداء في هذا الملف آمن: يُمرَّر رمز أو معرّف غير موجود، أو كلمة مرور خاطئة،
   فيفشل منطقياً دون إنشاء أو تعديل أي صف.   التشغيل:  node scripts/check-rpc.mjs
*/
import { CFG } from "../src/lib/config.js";

const NOBODY = "00000000-0000-0000-0000-000000000000";
const NO_CODE = "ZZZZ99";
const NO_PW = "\u0000-not-a-real-password-\u0000";

/* [اسم الدالة, المعاملات كما ترسلها الواجهة] */
const CALLS = [
  ["cmq_get_session", { code: NO_CODE }],
  ["cmq_join", { code: NO_CODE, p_name: "x", p_meta: "" }],
  ["cmq_submit", { p_participant: NOBODY, answers: [] }],
  ["cmq_admin_login", { pw: NO_PW }],
  ["cmq_admin_list_quizzes", { pw: NO_PW }],
  ["cmq_admin_list_sessions", { pw: NO_PW, p_quiz: null }],
  ["cmq_admin_get_quiz", { pw: NO_PW, p_quiz: NOBODY }],
  ["cmq_admin_save_quiz", { pw: NO_PW, payload: {} }],
  ["cmq_admin_delete_quiz", { pw: NO_PW, p_quiz: NOBODY }],
  ["cmq_admin_create_session", { pw: NO_PW, p_quiz: NOBODY, p_title: "" }],
  ["cmq_admin_set_session_status", { pw: NO_PW, p_session: NOBODY, p_status: "open" }],
  ["cmq_admin_delete_session", { pw: NO_PW, p_session: NOBODY }],
  ["cmq_admin_reset_session", { pw: NO_PW, p_session: NOBODY }],
  ["cmq_admin_session_results", { pw: NO_PW, p_session: NOBODY }],
  ["cmq_admin_change_password", { pw: NO_PW, new_pw: "x" }],
];

/* ردّ PostgREST حين لا يطابق اسم المعامل أي توقيع */
const MISSING = /could not find the function|does not exist|PGRST202/i;

let bad = 0;
for (const [fn, args] of CALLS) {
  let line;
  try {
    const r = await fetch(CFG.URL + "/rest/v1/rpc/" + fn, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: CFG.KEY, Authorization: "Bearer " + CFG.KEY },
      body: JSON.stringify(args),
    });
    const t = await r.text();
    if (MISSING.test(t)) {
      bad++;
      line = "FAIL  " + fn + "  ← " + Object.keys(args).join(", ") + "\n      " + t.slice(0, 180);
    } else {
      /* أي ردّ آخر يعني أن التوقيع تطابق ووصل النداء إلى منطق الدالة */
      line = "ok    " + fn + "  (" + Object.keys(args).join(", ") + ")";
    }
  } catch (e) {
    bad++;
    line = "ERROR " + fn + "  " + e.message;
  }
  console.log(line);
}

console.log(bad ? "\n" + bad + " signature mismatch(es)" : "\nكل التواقيع مطابقة");
process.exit(bad ? 1 : 0);
