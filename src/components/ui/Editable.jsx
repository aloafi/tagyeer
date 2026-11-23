/* نص قابل للتحرير في مكانه.
   يرث خطّ العنصر الذي يحلّ محلّه (عنوان، نص سؤال، خيار…) فتبدو الكتابة
   كأنها تجري على شاشة المشارك نفسها، لا في نموذج منفصل. */
import { useCallback, useEffect, useRef } from "react";

export default function Editable({
  value,
  onChange,
  placeholder,
  multiline = true,
  maxLength,
  className = "",
  ariaLabel,
  onFocus,
}) {
  const ref = useRef(null);

  /* يضبط الارتفاع على مقدار النص فلا يظهر شريط تمرير داخل الحقل */
  const grow = useCallback(() => {
    const el = ref.current;
    if (!el || !multiline) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [multiline]);

  useEffect(() => { grow(); }, [grow, value]);

  /* تغيّر عرض الحاوية (تدوير الشاشة، فتح لوحة الضبط) يغيّر عدد الأسطر */
  useEffect(() => {
    if (!multiline) return;
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", grow);
      return () => window.removeEventListener("resize", grow);
    }
    const ro = new ResizeObserver(grow);
    ro.observe(el);
    return () => ro.disconnect();
  }, [grow, multiline]);

  const props = {
    ref,
    value: value ?? "",
    placeholder,
    maxLength,
    spellCheck: false,
    "aria-label": ariaLabel || placeholder || undefined,
    className: ("ed " + className).trim(),
    onChange: (e) => onChange(e.target.value),
    onFocus,
  };

  if (!multiline) return <input type="text" {...props} />;

  return <textarea rows={1} {...props} onInput={grow} />;
}
