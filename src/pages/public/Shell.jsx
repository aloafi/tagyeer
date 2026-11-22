/* الإطار المشترك لصفحات المشارك: الخلفية، الشريط العلوي، ومنطقة الشاشة. */
export default function Shell({ title = "تجربة تفاعلية", steps = "", children }) {
  return (
    <div className="participant-root">
      <div className="stage">
        <div className="topbar">
          <div className="mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 11a8 8 0 1 0-2.3 6.1" /><path d="M20 5v6h-6" />
            </svg>
            <span>{title}</span>
          </div>
          <div className="steps">{steps}</div>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Loading({ text = "جارٍ التحميل…" }) {
  return (
    <section className="screen on">
      <div className="hero"><div className="spinner" /><p className="lede">{text}</p></div>
    </section>
  );
}
