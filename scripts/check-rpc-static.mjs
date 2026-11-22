import { readFileSync } from "node:fs";
// توقيعات قاعدة البيانات كما قرأتها من pg_proc
const DB = {
  cmq_admin_change_password:["pw","new_pw"], cmq_admin_create_session:["pw","p_quiz","p_title"],
  cmq_admin_delete_quiz:["pw","p_quiz"], cmq_admin_delete_session:["pw","p_session"],
  cmq_admin_get_quiz:["pw","p_quiz"], cmq_admin_list_quizzes:["pw"],
  cmq_admin_list_sessions:["pw","p_quiz"], cmq_admin_login:["pw"],
  cmq_admin_reset_session:["pw","p_session"], cmq_admin_save_quiz:["pw","payload"],
  cmq_admin_session_results:["pw","p_session"], cmq_admin_set_session_status:["pw","p_session","p_status"],
  cmq_get_session:["code"], cmq_join:["code","p_name","p_meta"], cmq_submit:["p_participant","answers"],
};
const src = readFileSync("src/lib/api.js","utf8");
const re = /rpc\(\s*"(cmq_[a-z_]+)"\s*,\s*\{([^}]*)\}/g;
let m, bad = 0, seen = new Set();
while ((m = re.exec(src))) {
  const fn = m[1];
  const keys = m[2].split(",").map(s => s.split(":")[0].trim()).filter(Boolean).sort();
  seen.add(fn);
  const want = (DB[fn] || []).slice().sort();
  const okk = JSON.stringify(keys) === JSON.stringify(want);
  if (!okk) bad++;
  console.log((okk ? "ok    " : "FAIL  ") + fn.padEnd(30) + "code=[" + keys.join(",") + "]" + (okk ? "" : "  db=[" + want.join(",") + "]"));
}
const missing = Object.keys(DB).filter(k => !seen.has(k) && !["cmq_gen_code","cmq_is_admin","cmq_max_score","cmq_quiz_json"].includes(k));
if (missing.length) console.log("\nدوال غير مستدعاة من الواجهة: " + missing.join(", "));
console.log(bad ? "\n" + bad + " mismatch(es)" : "\nكل النداءات مطابقة لتواقيع قاعدة البيانات");
process.exit(bad ? 1 : 0);
