import { useMemo, useState } from "react";
import useDocumentTitle from "../../../hooks/useDocumentTitle.js";
import { useSession } from "./SessionPage.jsx";
import { Empty } from "../../../components/ui/Primitives.jsx";
import { PAGE_SIZE } from "../../../lib/config.js";
import { fmtTime } from "../../../lib/format.js";

export default function TabParticipants() {
  const { session, results: r, exportCsv } = useSession();
  useDocumentTitle("المشاركون — " + session.code);

  const [term, setTerm] = useState("");
  const [sort, setSort] = useState({ k: "time", dir: -1 });
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(() => new Set());

  const list = useMemo(() => {
    const t = term.trim();
    let l = r.participants.slice();
    if (t) l = l.filter((p) => ((p.name || "") + " " + (p.meta || "")).includes(t));
    const { k, dir } = sort;
    l.sort((a, b) => {
      const v =
        k === "name" ? String(a.name || "").localeCompare(String(b.name || ""), "ar")
        : k === "dept" ? String(a.meta || "").localeCompare(String(b.meta || ""), "ar")
        : k === "score" ? (a.total_score || 0) - (b.total_score || 0)
        : new Date(a.finished_at || a.started_at) - new Date(b.finished_at || b.started_at);
      return v * dir;
    });
    return l;
  }, [r.participants, term, sort]);

  if (!r.participants.length)
    return (
      <Empty icon="clock" title="بانتظار انضمام المشاركين">
        افتحي شاشة العرض ليظهر رمز الجلسة ورمز QR أمام الحضور.
      </Empty>
    );

  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const cur = Math.min(page, pages);
  const slice = list.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);

  const sortBy = (k) => { setSort((s) => (s.k === k ? { k, dir: -s.dir } : { k, dir: 1 })); setPage(1); };
  const Th = ({ k, label }) => (
    <th className="sortable" onClick={() => sortBy(k)}>
      {label}{sort.k === k ? (sort.dir > 0 ? " ↑" : " ↓") : ""}
    </th>
  );

  const toggle = (id) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <>
      <div className="toolbar">
        <div className="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input className="inp" placeholder="ابحث باسم المشارك أو جهته…" value={term} onChange={(e) => { setTerm(e.target.value); setPage(1); }} />
        </div>
        <span className="chip grey">{list.length} من {r.participants.length}</span>
        <button className="btn ghost sm sp" onClick={exportCsv}>تصدير Excel</button>
      </div>

      <div className="tblwrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>#</th>
              <Th k="name" label="الاسم" />
              <Th k="dept" label="الجهة" />
              <Th k="score" label="الدرجة" />
              <th>النسبة</th>
              <th>المستوى</th>
              <Th k="time" label="الوقت" />
            </tr>
          </thead>
          <tbody>
            {slice.flatMap((p, i) => [
              <tr className="clickable" key={p.id} onClick={() => toggle(p.id)}>
                <td className="num">{(cur - 1) * PAGE_SIZE + i + 1}</td>
                <td><b>{p.name}</b></td>
                <td className="t-xs muted">{p.meta || "—"}</td>
                <td className="num">{p.finished_at ? p.total_score + " / " + p.max_score : "—"}</td>
                <td className="num">{p.finished_at ? p.percent + "%" : "—"}</td>
                <td>{p.finished_at ? ((p.band_emoji || "") + " " + (p.band_title || "")).trim() : <span className="chip grey">لم يكمل</span>}</td>
                <td className="t-xs muted">{fmtTime(p.finished_at || p.started_at)}</td>
              </tr>,
              open.has(p.id) ? (
                <tr key={p.id + "-a"}>
                  <td colSpan={7} className="ansbox">
                    {(p.answers || []).length ? (
                      p.answers.map((a, j) => (
                        <div className="a" key={j}>
                          {a.position}. {a.question_text} — <b>{a.label}</b>
                          {a.qtype === "text" ? null : <span className="dim num"> ({a.value})</span>}
                        </div>
                      ))
                    ) : (
                      <span className="t-xs dim">لا توجد إجابات بعد.</span>
                    )}
                  </td>
                </tr>
              ) : null,
            ])}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="pager">
          <button className="btn ghost sm" disabled={cur <= 1} onClick={() => setPage(cur - 1)}>السابق</button>
          <span className="t-sm muted num">{cur} من {pages}</span>
          <button className="btn ghost sm" disabled={cur >= pages} onClick={() => setPage(cur + 1)}>التالي</button>
        </div>
      )}
    </>
  );
}
