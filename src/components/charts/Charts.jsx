/* رسوم بيانية بسيطة مرسومة يدوياً بـ SVG — بلا مكتبات، لتبقى الحزمة خفيفة
   وتُورَّث ألوان الهوية من متغيّرات CSS نفسها. */

export function Donut({ segs }) {
  const size = 160, r = 60, cx = size / 2, cy = size / 2, th = 18;
  const live = segs.filter((s) => s.v > 0);
  const total = live.reduce((a, s) => a + s.v, 0) || 1;

  const arcs = [];
  if (live.length === 1) {
    arcs.push(
      <circle key="full" cx={cx} cy={cy} r={r} fill="none" stroke={live[0].c} strokeWidth={th}>
        <title>{live[0].k + ": " + live[0].v + " (100%)"}</title>
      </circle>
    );
  } else {
    let a0 = -Math.PI / 2;
    live.forEach((sg, i) => {
      const a1 = a0 + (sg.v / total) * Math.PI * 2;
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      arcs.push(
        <path
          key={i}
          d={`M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`}
          fill="none" stroke={sg.c} strokeWidth={th} strokeLinecap="butt"
        >
          <title>{`${sg.k}: ${sg.v} (${Math.round((sg.v / total) * 100)}%)`}</title>
        </path>
      );
      a0 = a1;
    });
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="dnt" role="img" aria-label="توزيع المستويات">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#EDF1EF" strokeWidth={th} />
      {arcs}
      <text x={cx} y={cy - 1} textAnchor="middle" style={{ fontSize: 26, fontWeight: 700, fill: "#063528" }}>{total}</text>
      <text x={cx} y={cy + 16} textAnchor="middle" style={{ fontSize: 11, fill: "#87968E" }}>مشارك</text>
    </svg>
  );
}

export function DonutLegend({ segs }) {
  const tot = segs.reduce((a, s) => a + s.v, 0) || 1;
  return (
    <div className="dlegend">
      {segs.map((s, i) => (
        <div className="dlrow" key={i}>
          <i style={{ background: s.c }} />
          <span className="nm">{s.k}</span>
          <b>{s.v}</b>
          <span className="pc">{Math.round((s.v / tot) * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

export function Histogram({ counts, labels }) {
  const W = 520, H = 170, pad = 28;
  const max = Math.max(1, ...counts);
  const bw = (W - pad * 2) / Math.max(1, counts.length);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="توزيع الدرجات">
      {[0, 1, 2, 3].map((g) => {
        const y = pad + ((H - pad * 2) / 3) * g;
        return <line key={g} className="gl" x1={pad} y1={y} x2={W - pad} y2={y} />;
      })}
      {counts.map((c, i) => {
        const h = (c / max) * (H - pad * 2);
        const x = W - pad - (i + 1) * bw + bw * 0.15;
        const w = bw * 0.7;
        const y = H - pad - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={Math.max(h, c ? 2 : 0)} rx="3" fill="#0B4F3A">
              <title>{labels[i] + ": " + c}</title>
            </rect>
            <text className="ax" x={x + w / 2} y={H - pad + 14} textAnchor="middle">{labels[i]}</text>
            {c ? <text className="vl" x={x + w / 2} y={y - 4} textAnchor="middle">{c}</text> : null}
          </g>
        );
      })}
    </svg>
  );
}

export function StackedBars({ rows, keys, colors }) {
  const W = 520, rowH = 38;
  const H = Math.max(40, rows.length * rowH + 14);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="توزيع الخيارات">
      {rows.map((r, i) => {
        const y = i * rowH + 4;
        const total = keys.reduce((a, k) => a + (r.v[k] || 0), 0) || 1;
        let x = W - 2;
        const segs = keys.map((k, j) => {
          const w = ((r.v[k] || 0) / total) * (W - 4);
          if (w <= 0) return null;
          x -= w;
          return (
            <rect key={k} x={x} y={y + 16} width={w} height="11" fill={colors[j % colors.length]}>
              <title>{k + ": " + (r.v[k] || 0)}</title>
            </rect>
          );
        });
        return (
          <g key={i}>
            <text className="ax" x={W - 2} y={y + 11} textAnchor="end">{r.k}</text>
            {segs}
          </g>
        );
      })}
    </svg>
  );
}

/* قائمة ترتيب بأشرطة — أوضح من رسم أعمدة حين تكون التسميات عربية طويلة */
export function RankList({ items, share, max: maxIn, empty = "لا توجد بيانات." }) {
  if (!items.length) return <p className="t-sm dim">{empty}</p>;
  const max = maxIn || Math.max(1, ...items.map((i) => i.v));
  const tot = items.reduce((a, i) => a + i.v, 0);

  return (
    <div className="rank">
      {items.map((it, i) => {
        const w = Math.max(3, Math.round((it.v / max) * 100));
        const sh = share && tot ? Math.round((it.v / tot) * 100) + "%" : "";
        return (
          <div className={"rankrow" + (i === 0 ? " top" : "")} key={i}>
            <span className="rk">{i + 1}</span>
            <div className="grow">
              <div className="rkhead">
                <span className="rklbl" title={it.k}>{it.k}</span>
                {sh ? <span className="rkshare">{sh}</span> : null}
                <b className="rkval">{String(it.t ?? it.v)}</b>
              </div>
              <div className="rktrack">
                <i style={{ width: w + "%", ...(it.c ? { background: it.c } : null) }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
