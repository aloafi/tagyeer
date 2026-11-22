/* مستويات النتيجة: نطاقات الدرجات ورسائلها، مع فحص التغطية والتداخل. */
import Icon from "../../../components/ui/Icon.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";

const PRESET = {
  names: ["مستكشف التغيير", "منفتح على التغيير", "متبنٍّ للتغيير", "صانع أثر"],
  emos: ["🧭", "🌿", "🌳", "🏅"],
  cols: ["#6B7F76", "#12694D", "#0B4F3A", "#B8892B"],
};

export function bandIssues(bands, lo, hi) {
  const bs = bands.slice().sort((a, b) => a.min_score - b.min_score);
  if (!bs.length) return [];
  const out = [];
  bs.forEach((b) => {
    if (b.max_score < b.min_score) out.push("نطاق «" + (b.title || "بدون اسم") + "» نهايته أصغر من بدايته.");
  });
  for (let i = 1; i < bs.length; i++) {
    if (bs[i].min_score <= bs[i - 1].max_score)
      out.push("تداخل بين «" + (bs[i - 1].title || "—") + "» و«" + (bs[i].title || "—") + "».");
    else if (bs[i].min_score > bs[i - 1].max_score + 1)
      out.push("فجوة بين " + bs[i - 1].max_score + " و" + bs[i].min_score + " لا يغطيها أي مستوى.");
  }
  if (bs[0].min_score > lo) out.push("الدرجات من " + lo + " إلى " + (bs[0].min_score - 1) + " بلا مستوى.");
  if (bs[bs.length - 1].max_score < hi) out.push("الدرجات من " + (bs[bs.length - 1].max_score + 1) + " إلى " + hi + " بلا مستوى.");
  return out;
}

export default function BandsEditor({ bands, setBands, lo, hi }) {
  const toast = useToast();
  const issues = bandIssues(bands, lo, hi);

  const patch = (i, p) => setBands(bands.map((b, k) => (k === i ? { ...b, ...p } : b)));

  function split4() {
    if (hi <= lo) { toast("أضف الأسئلة ودرجاتها أولاً", true); return; }
    const step = (hi - lo + 1) / 4;
    const next = [];
    for (let i = 0; i < 4; i++) {
      const a = Math.round(lo + step * i);
      const z = i === 3 ? hi : Math.round(lo + step * (i + 1)) - 1;
      next.push({ min_score: a, max_score: z, title: PRESET.names[i], message: "", emoji: PRESET.emos[i], color: PRESET.cols[i], celebrate: i >= 2 });
    }
    setBands(next);
    toast("تم التقسيم — اكتب رسالة كل مستوى");
  }

  function eachScore() {
    if (hi - lo > 30) { toast("عدد الدرجات كبير — استخدم التقسيم إلى مستويات", true); return; }
    const next = [];
    for (let s = lo; s <= hi; s++)
      next.push({ min_score: s, max_score: s, title: s + " من " + hi, message: "", emoji: "⭐", color: "#0B4F3A", celebrate: true });
    setBands(next);
    toast("تم إنشاء مستوى لكل درجة");
  }

  const span = hi - lo + 1;

  return (
    <div className="card pad">
      <div className="sechead">
        <h2 className="t-lg">مستويات النتيجة</h2>
        <span className="chip gold">النطاق: {lo} – {hi}</span>
        <div className="sp row">
          <button className="btn ghost sm" onClick={split4}>تقسيم إلى 4 مستويات</button>
          <button className="btn ghost sm" onClick={eachScore}>مستوى لكل درجة</button>
          <button
            className="btn ghost sm"
            onClick={() => setBands([...bands, { min_score: 0, max_score: 0, title: "", message: "", emoji: "⭐", color: "#0B4F3A", celebrate: true }])}
          >
            + نطاق
          </button>
        </div>
      </div>

      {bands.length > 0 && hi > lo && (
        <div className="bandline">
          {bands.slice().sort((a, b) => a.min_score - b.min_score).map((b, i) => (
            <div key={i} style={{ background: b.color || "#0B4F3A", flex: `0 0 ${(Math.max(1, b.max_score - b.min_score + 1) / span) * 100}%` }}>
              {b.title || "—"}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        {bands.length > 0 && (
          issues.length ? (
            <div className="note warn">
              <Icon name="alert" strokeWidth={1.8} />
              <span>{issues.slice(0, 4).map((t, i) => <span key={i}>{t}<br /></span>)}</span>
            </div>
          ) : (
            <div className="note ok">
              <Icon name="alert" strokeWidth={1.8} />
              <span>المستويات تغطي النطاق كاملاً بلا تداخل ولا فجوات.</span>
            </div>
          )
        )}
      </div>

      <div className="bandhead">
        <span>من</span><span>إلى</span><span>اسم المستوى</span><span>الرسالة للمشارك</span>
        <span>أيقونة</span><span>اللون</span><span>احتفال</span><span />
      </div>

      {!bands.length ? (
        <p className="t-sm dim">لا توجد مستويات بعد. استخدم «تقسيم إلى 4 مستويات» أو أضف نطاقاً يدوياً.</p>
      ) : (
        bands.map((b, i) => (
          <div className="band" key={i}>
            <input className="inp num" type="number" value={b.min_score} placeholder="من" onChange={(e) => patch(i, { min_score: +e.target.value || 0 })} />
            <input className="inp num" type="number" value={b.max_score} placeholder="إلى" onChange={(e) => patch(i, { max_score: +e.target.value || 0 })} />
            <input className="inp" value={b.title || ""} placeholder="اسم المستوى" onChange={(e) => patch(i, { title: e.target.value })} />
            <textarea className="inp wide" style={{ minHeight: 48 }} placeholder="الرسالة التي تظهر للمشارك" value={b.message || ""} onChange={(e) => patch(i, { message: e.target.value })} />
            <input className="inp" value={b.emoji || ""} style={{ textAlign: "center" }} onChange={(e) => patch(i, { emoji: e.target.value })} />
            <input type="color" value={b.color || "#0B4F3A"} onChange={(e) => patch(i, { color: e.target.value })} />
            <button
              className={"cel " + (b.celebrate === false ? "off" : "on")}
              title="احتفال عند هذا المستوى"
              onClick={() => patch(i, { celebrate: b.celebrate === false })}
            >
              🎉
            </button>
            <button className="iconbtn danger" onClick={() => setBands(bands.filter((_, k) => k !== i))}>
              <Icon name="plus" strokeWidth={2} style={{ transform: "rotate(45deg)" }} />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
