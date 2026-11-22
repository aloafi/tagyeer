/* روابط المشاركة. العنوان قابل للتعديل من الإعدادات لحالات النطاق المخصّص،
   وإلا يُشتق من العنوان الذي تعمل عليه المنصة الآن. */
import { JOIN_URL } from "./config.js";
import { LS, KEYS } from "./storage.js";

export function participantUrl() {
  const s = LS.get(KEYS.joinUrl);
  if (s && !/^file:/i.test(s)) return s.replace(/\/+$/, "");
  if (typeof window !== "undefined" && /^https?:/i.test(window.location.origin)) return window.location.origin;
  return JOIN_URL;
}

export const joinLink = (code) => participantUrl() + "/join/" + code;
