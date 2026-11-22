/* محرّك الإحصاء — يحوّل نتائج الجلسة الخام إلى بنى جاهزة للعرض.
   دالة خالصة: لا تلمس الواجهة ولا تطلب بيانات، فيسهل اختبارها. */
import { TYPES } from "./config.js";
import { deptKey } from "./format.js";

export function analyze(r) {
  const empty = { qs: [], byPos: {}, dist: {}, topOf: () => null, deptOf: {}, depts: {} };
  if (!r || !r.stats) return empty;

  const qs = (r.stats.questions || []).slice().sort((a, b) => a.position - b.position);
  const byPos = {};
  qs.forEach((q) => { byPos[q.position] = q; });

  const dist = {}, maxVal = {}, deptOf = {};
  const participants = r.participants || [];

  participants.forEach((p) => {
    const raw = String(p.meta || "").trim();
    deptOf[p.id] = { key: raw ? deptKey(raw) : "", label: raw };
    (p.answers || []).forEach((a) => {
      dist[a.position] = dist[a.position] || {};
      dist[a.position][a.label] = (dist[a.position][a.label] || 0) + 1;
      if (a.qtype !== "text") maxVal[a.position] = Math.max(maxVal[a.position] || 0, +a.value || 0);
    });
  });

  /* أعلى درجة ممكنة للسؤال: ثابتة للنوع، وإلا أعلى قيمة لوحظت فعلاً */
  const topOf = (pos) => {
    const q = byPos[pos];
    if (!q) return null;
    const t = TYPES[q.qtype] && TYPES[q.qtype].top;
    return t != null ? t : maxVal[pos] || null;
  };

  /* تجميع الجهات بعد توحيد الإملاء، مع اعتماد أكثر صيغة شائعة اسماً للعرض */
  const depts = {};
  participants.forEach((p) => {
    const d = deptOf[p.id];
    if (!d.key) return;
    depts[d.key] = depts[d.key] || { label: d.label, ids: [], counts: {} };
    depts[d.key].ids.push(p.id);
    depts[d.key].counts[d.label] = (depts[d.key].counts[d.label] || 0) + 1;
  });
  Object.keys(depts).forEach((k) => {
    const c = depts[k].counts;
    depts[k].label = Object.keys(c).sort((a, b) => c[b] - c[a])[0];
  });

  return { qs, byPos, dist, topOf, deptOf, depts };
}

/* نسبة الاتفاق: حصة الخيار الأكثر اختياراً من مجموع الإجابات على السؤال */
export function agreement(distOfQuestion) {
  const vals = Object.values(distOfQuestion || {});
  const tot = vals.reduce((a, b) => a + b, 0);
  if (!tot) return null;
  return Math.round((Math.max(...vals) / tot) * 100);
}

export function topOption(distOfQuestion) {
  const e = Object.entries(distOfQuestion || {});
  if (!e.length) return null;
  return e.sort((a, b) => b[1] - a[1])[0];
}

/* معدّل الجهة في سؤال واحد، كنسبة من أعلى درجة ممكنة */
export function deptQuestionPct(r, an, deptIds, pos) {
  const top = an.topOf(pos);
  if (!top) return { pct: null, n: 0 };
  let sum = 0, n = 0;
  (r.participants || []).forEach((p) => {
    if (!deptIds.includes(p.id)) return;
    const a = (p.answers || []).find((x) => x.position === pos);
    if (!a || a.qtype === "text") return;
    sum += +a.value || 0;
    n += 1;
  });
  if (!n) return { pct: null, n: 0 };
  return { pct: Math.round((sum / n / top) * 100), n };
}
