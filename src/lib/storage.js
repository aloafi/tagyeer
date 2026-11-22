/* تخزين محلي آمن — يفشل بهدوء في المتصفحات التي تمنعه (نافذة خاصة، إعدادات مشدّدة). */

export const LS = {
  get(k) {
    try { return localStorage.getItem(k) ?? sessionStorage.getItem(k); } catch { return null; }
  },
  set(k, v, persist) {
    try { (persist ? localStorage : sessionStorage).setItem(k, v); } catch { /* تجاهل */ }
  },
  del(k) {
    try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch { /* تجاهل */ }
  },
};

export const KEYS = {
  pw: "cmq_pw",
  joinUrl: "cmq_join_url",
  slim: "cmq_slim",
  minN: "cmq_min_n",
};
