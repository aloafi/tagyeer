/* احتفال قصير عند ظهور النتيجة — يحترم تفضيل تقليل الحركة ويزيل نفسه بعد انتهائه. */
const COLORS = ["#0B4F3A", "#2F7A5B", "#B8892B", "#E3C77E", "#7EC9A4", "#FFFFFF"];

export default function party(anchorEl, strong, cheer) {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (anchorEl) {
    anchorEl.classList.remove("cheer");
    void anchorEl.offsetWidth;
    anchorEl.classList.add("cheer");
  }
  if (reduce || cheer === false) return () => {};

  try { navigator.vibrate?.(strong ? [40, 60, 40] : 40); } catch { /* تجاهل */ }

  const cv = document.createElement("canvas");
  cv.className = "confetti";
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = innerWidth * dpr;
  cv.height = innerHeight * dpr;
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d");
  ctx.scale(dpr, dpr);

  const pick = () => COLORS[(Math.random() * COLORS.length) | 0];
  const parts = [];
  const r = anchorEl
    ? anchorEl.getBoundingClientRect()
    : { left: innerWidth / 2 - 30, top: innerHeight / 2 - 30, width: 60, height: 60 };
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;

  const burst = strong ? 80 : 46;
  for (let i = 0; i < burst; i++) {
    const a = (Math.PI * 2 * i) / burst + Math.random() * 0.3;
    const sp = (strong ? 5.5 : 4) * (0.55 + Math.random() * 0.75);
    parts.push({
      x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.2,
      w: 4 + Math.random() * 5, h: 6 + Math.random() * 7,
      rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
      g: 0.11, drag: 0.985, c: pick(),
    });
  }
  const rain = strong ? 90 : 40;
  for (let i = 0; i < rain; i++) {
    parts.push({
      x: innerWidth * (0.06 + Math.random() * 0.88), y: -20 - Math.random() * innerHeight * 0.45,
      vx: (Math.random() - 0.5) * 1.5, vy: 1.8 + Math.random() * (strong ? 3.2 : 2),
      w: 5 + Math.random() * 6, h: 8 + Math.random() * 8,
      rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.22,
      g: 0.035, drag: 1, c: pick(),
    });
  }

  const dur = strong ? 3200 : 2300;
  const t0 = performance.now();
  let raf = 0;
  let alive = true;

  (function frame(t) {
    if (!alive) return;
    const el = t - t0;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.g;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - el / dur);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (el < dur) raf = requestAnimationFrame(frame);
    else cv.remove();
  })(t0);

  /* تنظيف عند مغادرة الصفحة قبل انتهاء الحركة */
  return () => { alive = false; cancelAnimationFrame(raf); cv.remove(); };
}
