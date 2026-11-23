/* بطاقة تجربة مختصرة — تظهر في «نظرة عامة» داخل شريط أفقي فوق الجلسات. */
import { useNavigate } from "react-router-dom";

export default function QuizTile({ q }) {
  const nav = useNavigate();

  return (
    <button
      className="qtile"
      title={q.title}
      onClick={() => nav("/quizzes/" + q.id + "/edit")}
    >
      <span className="qtemo" aria-hidden="true">{q.cover_emoji || "🌱"}</span>
      <span className="qtbody">
        <span className="qtname">{q.title}</span>
        <span className="qtmeta">
          <span><b>{q.questions_count}</b> سؤال</span>
          <i aria-hidden="true" />
          <span><b>{q.sessions_count}</b> جلسة</span>
          <i aria-hidden="true" />
          <span className="gold"><b>{q.responses_count}</b> مشاركة</span>
        </span>
      </span>
    </button>
  );
}
