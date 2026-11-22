/* بطاقة جلسة — تظهر في «نظرة عامة» وفي مركز الجلسات بالشكل نفسه. */
import { useNavigate } from "react-router-dom";
import Icon from "./ui/Icon.jsx";
import { ago } from "../lib/format.js";

export default function SessionCard({ s }) {
  const nav = useNavigate();
  const open = s.status === "open";
  const rate = s.joined ? Math.round((s.finished / s.joined) * 100) : 0;

  return (
    <div className={"scard" + (open ? "" : " closed")}>
      <div className="shd">
        <span className="scode">{s.code}</span>
        <span className={"chip " + (open ? "live" : "off")}>
          <span className={"dot" + (open ? " pulse" : "")} />
          {open ? "مفتوحة" : "مغلقة"}
        </span>
        <span className="sago">{ago(s.created_at)}</span>
      </div>

      <div className="sbd">
        <div className="sinfo">
          <b>{s.title || "جلسة بلا اسم"}</b>
          <span><Icon name="book" />{s.quiz_title}</span>
        </div>
        <div className="sstats">
          <div className="sstat"><b>{s.joined}</b><span>انضم</span></div>
          <div className="sstat"><b>{s.finished}</b><span>أكمل</span></div>
          <div className="sstat"><b>{rate}%</b><span>الإكمال</span></div>
        </div>
        <div className="prog sprog"><i style={{ width: rate + "%" }} /></div>
      </div>

      <div className="sfoot">
        <button className="btn gold sm" onClick={() => nav("/projection/" + s.code)}>شاشة العرض</button>
        <button className="btn ghost sm" onClick={() => nav("/sessions/" + s.code)}>التفاصيل</button>
      </div>
    </div>
  );
}
