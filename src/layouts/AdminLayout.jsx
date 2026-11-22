/* الهيكل الثابت للوحة التحكم: قائمة جانبية + ترويسة صفحة + منطقة المحتوى.
   الصفحات تضخّ عنوانها وفتات الخبز وأزرارها عبر PageHeadContext. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import { useAuth } from "../lib/auth.jsx";
import { useAdminData } from "../hooks/useAdminData.jsx";
import useDocumentTitle from "../hooks/useDocumentTitle.js";
import { LS, KEYS } from "../lib/storage.js";

const HeadCtx = createContext({ setHead: () => {} });

/* تستدعيها كل صفحة لتصف نفسها في الترويسة وفي عنوان التبويب */
export function usePageHead(head, deps = []) {
  const { setHead } = useContext(HeadCtx);
  const title = head.title;
  useDocumentTitle(title);
  useEffect(() => {
    setHead(head);
    return () => setHead(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

const NAV = [
  { to: "/dashboard", icon: "grid",  label: "نظرة عامة" },
  { to: "/quizzes",   icon: "book",  label: "التجارب", count: "quizzes" },
  { to: "/sessions",  icon: "wifi",  label: "الجلسات", count: "sessions" },
];

export default function AdminLayout() {
  const [head, setHead] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const [slim, setSlim] = useState(() => LS.get(KEYS.slim) === "1");
  const { logout } = useAuth();
  const data = useAdminData();
  const loc = useLocation();
  const navigate = useNavigate();

  /* إغلاق القائمة الجانبية عند كل انتقال على الشاشات الصغيرة */
  useEffect(() => { setNavOpen(false); }, [loc.pathname]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [loc.pathname]);

  const toggleSlim = useCallback(() => {
    setSlim((s) => { LS.set(KEYS.slim, s ? "0" : "1", true); return !s; });
  }, []);

  const ctx = useMemo(() => ({ setHead }), []);
  const counts = { quizzes: data?.quizzes.length || 0, sessions: data?.sessions.length || 0 };

  return (
    <HeadCtx.Provider value={ctx}>
      <div className={"admin-root" + (slim ? " slim" : "")}>
        <div className="app on">
          <div className={"scrim" + (navOpen ? " on" : "")} onClick={() => setNavOpen(false)} />

          <aside className={"sidebar" + (navOpen ? " open" : "")}>
            <div className="brandbox">
              <div className="bm"><Icon name="refresh" /></div>
              <div><b>منصة تغيير</b><span>إدارة التغيير والثقافة المؤسسية</span></div>
            </div>

            <div className="navgrp">العمل</div>
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                title={n.label}
                className={({ isActive }) => "navitem" + (isActive ? " on" : "")}
              >
                <Icon name={n.icon} />
                <span className="lbltxt">{n.label}</span>
                {n.count ? <span className="count">{counts[n.count] || ""}</span> : null}
              </NavLink>
            ))}

            <div className="navgrp">النظام</div>
            <NavLink to="/settings" title="الإعدادات" className={({ isActive }) => "navitem" + (isActive ? " on" : "")}>
              <Icon name="gear" />
              <span className="lbltxt">الإعدادات</span>
            </NavLink>

            <div className="sidefoot">
              <button className="navitem" id="slim-toggle" onClick={toggleSlim} title="طي القائمة">
                <Icon name="panel" />
                <span className="lbltxt">طي القائمة</span>
              </button>
              <button className="navitem" onClick={() => { logout(); navigate("/login", { replace: true }); }} title="خروج">
                <Icon name="logout" />
                <span className="lbltxt">خروج</span>
              </button>
            </div>
          </aside>

          <div className="main">
            <div className="mobar">
              <button className="iconbtn" onClick={() => setNavOpen(true)} aria-label="القائمة">
                <Icon name="menu" strokeWidth={1.8} />
              </button>
              <b style={{ fontSize: 15, color: "var(--brand-800)" }}>منصة تغيير</b>
            </div>

            <div className="pagehead">
              <div style={{ minWidth: 0 }}>
                <div className="crumb">
                  {head?.crumb?.map((c, i) => (
                    <span key={i} style={{ display: "contents" }}>
                      {c.to ? <button onClick={() => navigate(c.to)}>{c.label}</button> : <span>{c.label}</span>}
                      {i < head.crumb.length - 1 ? <span>›</span> : null}
                    </span>
                  ))}
                </div>
                <h1 className="t-xl ellip">{head?.title || ""}</h1>
              </div>
              <div className="sp row">{head?.actions}</div>
            </div>

            <div className="content">
              {/* المفتاح يعيد تشغيل حركة الظهور عند كل انتقال */}
              <div className="view on" key={loc.pathname}>
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </div>
    </HeadCtx.Provider>
  );
}
