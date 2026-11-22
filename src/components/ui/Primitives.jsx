/* لبنات صغيرة متكرّرة عبر الصفحات. */
import Icon from "./Icon.jsx";

export function Kpi({ label, value, sub, icon }) {
  return (
    <div className="kpi" title={label + " — " + sub}>
      <div className="k"><Icon name={icon} />{label}</div>
      <div className="v">{String(value)}</div>
      <div className="s">{sub}</div>
    </div>
  );
}

export function Empty({ icon = "alert", title, children, action }) {
  return (
    <div className="empty">
      <div className="ic"><Icon name={icon} strokeWidth={1.7} /></div>
      <h3>{title}</h3>
      {children ? <p>{children}</p> : null}
      {action}
    </div>
  );
}

export function ErrorBox({ message }) {
  return <Empty icon="alert" title="تعذر تحميل البيانات">{message}</Empty>;
}

export function Spinner({ big }) {
  return <div className={"spin" + (big ? " big" : "")} aria-label="جارٍ التحميل" />;
}

export function ChartCard({ title, desc, legend, children }) {
  return (
    <div className="chartcard">
      <h3>{title}</h3>
      {desc ? <p className="cdesc">{desc}</p> : null}
      {children}
      {legend}
    </div>
  );
}

export function Legend({ items }) {
  return (
    <div className="legend">
      {items.map((it, i) => (
        <span key={i}><i style={{ background: it.c }} />{it.k}</span>
      ))}
    </div>
  );
}

export function Chip({ kind = "", dot, children }) {
  return (
    <span className={"chip" + (kind ? " " + kind : "")}>
      {dot ? <span className={"dot" + (dot === "pulse" ? " pulse" : "")} /> : null}
      {children}
    </span>
  );
}
