/* إنشاء جلسة جديدة: اختيار التجربة من بطاقات، ثم اسم اختياري، ثم فتح شاشة العرض.
   مشتركة بين صفحة التجارب ومركز الجلسات حتى لا يتكرّر المنطق. */
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAsk } from "../components/ui/Dialog.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import { useAuth } from "../lib/auth.jsx";
import { useAdminData } from "./useAdminData.jsx";
import { createSession } from "../lib/api.js";
import { ago } from "../lib/format.js";

export default function useNewSession() {
  const ask = useAsk();
  const toast = useToast();
  const nav = useNavigate();
  const { pw } = useAuth();
  const { quizzes, refreshSessions } = useAdminData();

  return useCallback(
    async (presetQuizId) => {
      let qid = presetQuizId;

      if (!qid) {
        if (!quizzes.length) { toast("أنشئ تجربة أولاً", true); return; }
        const choices = quizzes.map((q) => ({
          v: q.id,
          title: q.title,
          emoji: q.cover_emoji || "🌱",
          sub: [
            (q.questions_count || 0) + " سؤال",
            (q.sessions_count || 0) + " جلسة",
            "آخر تحديث " + ago(q.updated_at),
          ].join(" · "),
        }));
        qid = await ask({ title: "اختر التجربة", text: "اختر التجربة التي ستُبنى عليها الجلسة.", choices, yes: "متابعة" });
        if (!qid) return;
      }

      const title = await ask({
        title: "اسم الجلسة",
        text: "اختياري — مثال: اجتماع سفراء التغيير",
        input: true,
        placeholder: "اسم الجلسة",
        yes: "إنشاء",
      });
      if (title === null) return;

      try {
        const s = await createSession(pw, qid, title);
        await refreshSessions();
        toast("رمز الجلسة " + s.code);
        nav("/projection/" + s.code);
      } catch (e) {
        toast(e.message, true);
      }
    },
    [ask, toast, nav, pw, quizzes, refreshSessions]
  );
}
