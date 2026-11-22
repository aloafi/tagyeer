/* تنسيق التواريخ والأرقام والنصوص المشتركة. */

export const fmtTime = (s) =>
  s
    ? new Date(s).toLocaleString("ar-SA", {
        hour: "2-digit", minute: "2-digit", day: "numeric", month: "numeric",
      })
    : "—";

export function ago(s) {
  if (!s) return "—";
  const d = (Date.now() - new Date(s).getTime()) / 1000;
  if (d < 60) return "الآن";
  if (d < 3600) return Math.floor(d / 60) + " دقيقة";
  if (d < 86400) return Math.floor(d / 3600) + " ساعة";
  if (d < 2592000) return Math.floor(d / 86400) + " يوم";
  return fmtTime(s);
}

export const pct = (n, of) => (of ? Math.round((n / of) * 100) : 0);

export const initialOf = (name) => String(name || "؟").trim()[0] || "؟";

/* توحيد كتابة أسماء الجهات العربية حتى تُجمَّع الإدارة الواحدة في صف واحد */
export function deptKey(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[ـً-ْ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .toLowerCase();
}

export function heatColor(p) {
  if (p == null) return "#F2F4F3";
  if (p >= 85) return "#0B4F3A";
  if (p >= 70) return "#2C7257";
  if (p >= 55) return "#4E9077";
  if (p >= 40) return "#B8892B";
  if (p >= 25) return "#C99A45";
  return "#B35549";
}
