/* عنوان تبويب المتصفح يتبع الصفحة الحالية — مهم للتنقّل بالسجل والمفضّلة. */
import { useEffect } from "react";

export const SITE = "منصة تغيير";

export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : SITE;
  }, [title]);
}
