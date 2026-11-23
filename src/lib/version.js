/* يراقب صدور نسخة جديدة من المنصة.
   التبويب الذي يبقى مفتوحاً أياماً يحمل شيفرة قديمة؛ بدل أن ننتظر أول
   عطل، نسأل الخادم عن ملف البداية ونقارن اسمه باسم الملف العامل الآن.
   الفحص خفيف (ملف صغير بلا تخزين) ويجري عند العودة إلى التبويب فقط
   وكل ربع ساعة، فلا يُثقل الشبكة أثناء الجلسات. */

const EVERY = 15 * 60 * 1000;   /* فحص دوري */
const GAP = 60 * 1000;          /* أقل فاصل بين فحصين */

const currentEntry = () => {
  const s = document.querySelector('script[type="module"][src*="/assets/index-"]');
  const src = s && s.getAttribute("src");
  if (!src) return null;
  const m = src.match(/\/assets\/index-[A-Za-z0-9_-]+\.js/);
  return m ? m[0] : null;
};

async function latestEntry() {
  const r = await fetch("/index.html", { cache: "no-store" });
  if (!r.ok) return null;
  const html = await r.text();
  const m = html.match(/\/assets\/index-[A-Za-z0-9_-]+\.js/);
  return m ? m[0] : null;
}

/* تستدعي onNew مرة واحدة حين تختلف النسخة المنشورة عن العاملة */
export default function watchBuild(onNew) {
  const mine = currentEntry();
  if (!mine) return () => {};        /* وضع التطوير: لا ملفات مجمّعة */

  let last = 0;
  let done = false;

  const check = async () => {
    if (done || document.hidden) return;
    if (Date.now() - last < GAP) return;
    last = Date.now();
    try {
      const out = await latestEntry();
      if (out && out !== mine) { done = true; onNew(); }
    } catch { /* الشبكة منقطعة — نحاول لاحقاً */ }
  };

  const onVisible = () => { if (!document.hidden) check(); };
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("focus", onVisible);
  const timer = setInterval(check, EVERY);

  return () => {
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("focus", onVisible);
    clearInterval(timer);
  };
}
