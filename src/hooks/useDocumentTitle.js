/* عنوان تبويب المتصفح يتبع الصفحة الحالية — مهم للتنقّل بالسجل والمفضّلة. */
import { useEffect } from "react";

export const SITE = "أثر";

export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : SITE;
  }, [title]);
}
