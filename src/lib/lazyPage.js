/* تحميل الصفحات كسولاً مع تعافٍ ذاتي.
   المشكلة التي يعالجها: كل نشر جديد يغيّر أسماء ملفات الصفحات، فأي تبويب
   مفتوح من نسخة سابقة يطلب ملفاً لم يعد موجوداً، فتسقط الصفحة على شاشة
   «حدث خطأ غير متوقع». الحل: محاولة ثانية (لعلّه انقطاع عابر)، ثم إعادة
   تحميل الصفحة مرة واحدة لجلب النسخة الجديدة — إلا إن كان في الصفحة عمل
   غير محفوظ، فلا نُعيد التحميل أبداً ونترك الرسالة تظهر. */
import { lazy } from "react";

const RELOAD_KEY = "cmq_chunk_reload";
const RELOAD_WINDOW = 20000;   /* لا نُعيد التحميل مرتين خلال هذه المدة */

/* أخطاء تعذّر تحميل ملف الصفحة تختلف صيغتها بين المتصفحات */
export function isChunkError(err) {
  const m = String((err && (err.message || err.name)) || "");
  return (
    /dynamically imported module/i.test(m) ||
    /Importing a module script failed/i.test(m) ||
    /error loading dynamically imported/i.test(m) ||
    /ChunkLoadError/i.test(m) ||
    /Loading chunk \d+ failed/i.test(m) ||
    /Failed to fetch dynamically imported module/i.test(m)
  );
}

/* هل في الصفحة تعديل لم يُحفظ؟ المحرر يرفع هذه الراية */
export const hasUnsavedWork = () => window.__cmqDirty === true;

export function recoverFromStaleBuild() {
  if (hasUnsavedWork()) return false;
  let last = 0;
  try { last = +sessionStorage.getItem(RELOAD_KEY) || 0; } catch { /* وضع التصفّح الخاص */ }
  if (Date.now() - last < RELOAD_WINDOW) return false;      /* سبق أن أعدنا التحميل */
  try { sessionStorage.setItem(RELOAD_KEY, String(Date.now())); } catch { /* تجاهل */ }
  window.location.reload();
  return true;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function lazyPage(loader) {
  return lazy(() =>
    loader().catch(async (first) => {
      /* محاولة ثانية بعد مهلة قصيرة: تكفي لانقطاع شبكة عابر */
      try {
        await wait(500);
        return await loader();
      } catch (err) {
        if (isChunkError(err) && recoverFromStaleBuild()) {
          /* الصفحة تُعاد الآن — نُعيد وعداً معلّقاً فلا تومض شاشة الخطأ */
          return new Promise(() => {});
        }
        throw err;
      }
    })
  );
}
