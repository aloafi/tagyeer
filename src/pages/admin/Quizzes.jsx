import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageHead } from "../../layouts/AdminLayout.jsx";
import { useAdminData } from "../../hooks/useAdminData.jsx";
import useNewSession from "../../hooks/useNewSession.js";
import { useAuth } from "../../lib/auth.jsx";
import { useAsk } from "../../components/ui/Dialog.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { Empty, ErrorBox, Spinner } from "../../components/ui/Primitives.jsx";
import Icon from "../../components/ui/Icon.jsx";
import { getQuiz, saveQuiz, deleteQuiz } from "../../lib/api.js";
import { ago } from "../../lib/format.js";

function CardMenu({ onPick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  const item = (k, label, icon, danger) => (
    <button
      className={danger ? "danger" : undefined}
      onClick={(e) => { e.stopPropagation(); setOpen(false); onPick(k); }}
    >
      <Icon name={icon} />{label}
    </button>
  );

  return (
    <div
      ref={ref}
      className={"menu" + (open ? " open" : "")}
      style={{ position: "absolute", top: 10, insetInlineStart: 10 }}
      onClick={(e) => e.stopPropagation()}
    >
      <button className="iconbtn" aria-label="إجراءات" onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>
        <Icon name="dots" filled />
      </button>
      <div className="pop">
        {item("open", "فتح وتعديل", "edit")}
        {item("session", "إنشاء جلسة", "plusCircle")}
        {item("dup", "نسخ التجربة", "copy")}
        <hr />
        {item("del", "حذف", "trash", true)}
      </div>
    </div>
  );
}

export default function Quizzes() {
  const nav = useNavigate();
  const { pw } = useAuth();
  const { quizzes, loaded, error, refreshQuizzes } = useAdminData();
  const newSession = useNewSession();
  const ask = useAsk();
  const toast = useToast();

  const [term, setTerm] = useState("");
  const [sort, setSort] = useState("updated");
  const [view, setView] = useState("grid");

  usePageHead(
    {
      title: "التجارب",
      actions: <button className="btn" onClick={() => nav("/quizzes/new")}>+ تجربة جديدة</button>,
    },
    [nav]
  );

  const list = useMemo(() => {
    let l = quizzes.slice();
    const t = term.trim();
    if (t) l = l.filter((q) => (q.title + " " + (q.subtitle || "")).includes(t));
    l.sort((a, b) =>
      sort === "title" ? String(a.title).localeCompare(String(b.title), "ar")
      : sort === "responses" ? (b.responses_count || 0) - (a.responses_count || 0)
      : sort === "sessions" ? (b.sessions_count || 0) - (a.sessions_count || 0)
      : new Date(b.updated_at) - new Date(a.updated_at)
    );
    return l;
  }, [quizzes, term, sort]);

  async function duplicate(id) {
    try {
      const q = await getQuiz(pw, id);
      q.id = null;
      q.title = q.title + " — نسخة";
      const saved = await saveQuiz(pw, q);
      await refreshQuizzes();
      toast("تم إنشاء نسخة");
      nav("/quizzes/" + saved.id + "/edit");
    } catch (e) { toast(e.message, true); }
  }

  async function remove(id) {
    const q = quizzes.find((x) => x.id === id);
    const ok = await ask({
      title: "حذف التجربة",
      text: "سيتم حذف «" + (q ? q.title : "") + "» وكل جلساتها ونتائجها نهائياً.",
      yes: "حذف", danger: true,
    });
    if (!ok) return;
    try { await deleteQuiz(pw, id); toast("تم الحذف"); await refreshQuizzes(); }
    catch (e) { toast(e.message, true); }
  }

  const pick = (k, id) => {
    if (k === "open") nav("/quizzes/" + id + "/edit");
    else if (k === "session") newSession(id);
    else if (k === "dup") duplicate(id);
    else if (k === "del") remove(id);
  };

  if (error) return <ErrorBox message={error} />;
  if (!loaded) return <Spinner big />;

  if (!quizzes.length)
    return (
      <Empty
        icon="plus"
        title="لا توجد تجارب بعد"
        action={<button className="btn" onClick={() => nav("/quizzes/new")}>+ تجربة جديدة</button>}
      >
        التجربة أصل قابل لإعادة الاستخدام: اسم وأسئلة ومستويات نتيجة، تُشغَّل في أي عدد من الجلسات.
      </Empty>
    );

  return (
    <>
      <div className="toolbar sec">
        <input className="inp sm grow" placeholder="ابحث في التجارب…" value={term} onChange={(e) => setTerm(e.target.value)} />
        <select className="inp sm" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="الترتيب">
          <option value="updated">الأحدث تحديثاً</option>
          <option value="title">الاسم</option>
          <option value="responses">الأكثر مشاركة</option>
          <option value="sessions">الأكثر جلسات</option>
        </select>
        <div className="seg">
          <button className={view === "grid" ? "on" : ""} onClick={() => setView("grid")} aria-label="شبكة"><Icon name="grid4" /></button>
          <button className={view === "list" ? "on" : ""} onClick={() => setView("list")} aria-label="قائمة"><Icon name="rows" /></button>
        </div>
      </div>

      {!list.length ? (
        <Empty title="لا نتائج">لا توجد تجربة مطابقة لبحثك.</Empty>
      ) : (
        <div className={"qgrid" + (view === "list" ? " list" : "")}>
          {list.map((q) => (
            <div className="qcard" key={q.id} onClick={() => nav("/quizzes/" + q.id + "/edit")}>
              <div className="cover"><span className="emo">{q.cover_emoji || "🌱"}</span></div>
              <div className="qpad">
                <div className="body">
                  <h3>{q.title}</h3>
                  {q.subtitle ? <p className="sub">{q.subtitle}</p> : null}
                </div>
                <div className="meta">
                  <span className="chip grey">{q.questions_count} سؤال</span>
                  <span className="chip">{q.sessions_count} جلسة</span>
                  <span className="chip gold">{q.responses_count} مشاركة</span>
                  <span className="when">{ago(q.updated_at)}</span>
                </div>
              </div>
              <CardMenu onPick={(k) => pick(k, q.id)} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
