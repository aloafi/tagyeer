/* إعدادات المنصة وثوابتها — مصدر واحد لكل الصفحات. */

export const CFG = {
  URL: "https://lsvzudrcmjxeerarfevw.supabase.co",
  /* مفتاح anon عام مخصّص للمتصفح — الصلاحيات كلها محروسة داخل قاعدة البيانات */
  KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxzdnp1ZHJjbWp4ZWVyYXJmZXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNjAxMjgsImV4cCI6MjEwMzgzNjEyOH0.7DO2jXleTwIfMf6ZEy-SZg4pOVGIuEalTPzIzKL6XZo",
};

export const JOIN_URL = "https://tagyeer.site";
export const PAGE_SIZE = 25;
export const TEXT_MAX = 1500;

export const LIKERT = [
  { label: "لا أوافق بشدة", score: 1 },
  { label: "لا أوافق", score: 2 },
  { label: "محايد", score: 3 },
  { label: "أوافق", score: 4 },
  { label: "أوافق بشدة", score: 5 },
];

export const TRUEFALSE = [
  { label: "صح", score: 1 },
  { label: "خطأ", score: 0 },
];

export const SHAPES = [
  { s: "◆", c: "#0B4F3A" }, { s: "●", c: "#B8892B" }, { s: "▲", c: "#12694D" },
  { s: "■", c: "#8A6A1F" }, { s: "★", c: "#4A6D5E" }, { s: "✦", c: "#93701F" },
];

export const SCALE = ["#0B4F3A", "#12694D", "#4E9077", "#B8892B", "#D4AC63", "#8A6A1F"];

/* أنواع الأسئلة المدعومة · top = أعلى درجة ممكنة (null يعني تُحسب من الخيارات) */
export const TYPES = {
  likert5:  { name: "مقياس خماسي", desc: "من «لا أوافق بشدة» إلى «أوافق بشدة»", top: 5 },
  choice:   { name: "اختيارات",    desc: "خيارات متعددة بدرجة لكل خيار",        top: null },
  truefalse:{ name: "صح / خطأ",    desc: "خياران فقط لسؤال معرفي",              top: 1 },
  text:     { name: "سؤال تعبير",  desc: "إجابة مكتوبة حرّة، بلا درجة",         top: null },
};

export const TYPE_KEYS = Object.keys(TYPES);

export function qtypeOf(q) {
  const t = q && q.qtype ? String(q.qtype) : "likert5";
  return TYPES[t] ? t : "likert5";
}

export function freshQuestion(t) {
  if (t === "likert5") return { text: "", qtype: "likert5", options: LIKERT.map((o) => ({ ...o })) };
  if (t === "choice")
    return { text: "", qtype: "choice", options: [{ label: "إجابة صحيحة", score: 1 }, { label: "إجابة أخرى", score: 0 }] };
  if (t === "truefalse") return { text: "", qtype: "truefalse", options: TRUEFALSE.map((o) => ({ ...o })) };
  return { text: "", qtype: "text", options: [] };
}

export function blankQuiz() {
  return {
    id: null,
    title: "",
    subtitle: "",
    intro: "لا توجد إجابة صحيحة أو خاطئة — اختر ما يعبّر عنك فعلاً.",
    cover_emoji: "🌱",
    footer_note: "التغيير يبدأ بك 🌱",
    show_score: true,
    ask_name: true,
    ask_meta: false,
    meta_label: "الإدارة / الجهة",
    questions: [],
    bands: [],
  };
}
