/* رفع شاشة البداية.

   لا نرفعها بمجرّد إقلاع React، لأن أول ما يُرسم حينها هو مؤشّر تحميل الصفحة
   نفسها — فيرى الزائر مؤشّرين متتاليين. ننتظر ظهور محتوى حقيقي داخل الجذر،
   مع حدّ أدنى لزمن الظهور حتى لا تومض، وحدّ أعلى حتى لا تعلق إن تأخّر شيء. */

const MIN_VISIBLE = 550;
const MAX_WAIT = 6000;

export default function hideSplash() {
  const el = document.getElementById("splash");
  const root = document.getElementById("root");
  if (!el || el.classList.contains("gone")) return;

  let done = false;

  const remove = () => {
    if (done) return;
    done = true;
    observer.disconnect();
    clearTimeout(cap);
    const shown = Number(window.__splashShown) || Date.now();
    const wait = Math.max(0, MIN_VISIBLE - (Date.now() - shown));
    setTimeout(() => {
      el.classList.add("gone");
      setTimeout(() => el.remove(), 600);
    }, wait);
  };

  /* محتوى حقيقي = شيء داخل الجذر ليس مؤشّر تحميل المسار */
  const hasContent = () =>
    !!root && !!root.firstElementChild && !root.querySelector(".route-fallback");

  const observer = new MutationObserver(() => { if (hasContent()) remove(); });
  const cap = setTimeout(remove, MAX_WAIT);

  if (hasContent()) remove();
  else observer.observe(root, { childList: true, subtree: true });
}
