/* جدول المسارات — مصدر الحقيقة الوحيد لبنية الروابط في المنصة.
   كل صفحة تُحمَّل كسولاً (lazy) فلا ينتظر المشارك شيفرة لوحة التحكم. */
import { lazy, Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout.jsx";
import { useAuth } from "./lib/auth.jsx";
import { AdminDataProvider } from "./hooks/useAdminData.jsx";

const Join        = lazy(() => import("./pages/public/Join.jsx"));
const Play        = lazy(() => import("./pages/public/Play.jsx"));
const Login       = lazy(() => import("./pages/admin/Login.jsx"));
const Overview    = lazy(() => import("./pages/admin/Overview.jsx"));
const Quizzes     = lazy(() => import("./pages/admin/Quizzes.jsx"));
const QuizEditor  = lazy(() => import("./pages/admin/QuizEditor.jsx"));
const Sessions    = lazy(() => import("./pages/admin/Sessions.jsx"));
const SessionPage = lazy(() => import("./pages/admin/session/SessionPage.jsx"));
const SessionOverview     = lazy(() => import("./pages/admin/session/TabOverview.jsx"));
const SessionParticipants = lazy(() => import("./pages/admin/session/TabParticipants.jsx"));
const SessionAnalytics    = lazy(() => import("./pages/admin/session/TabAnalytics.jsx"));
const SessionMatrix       = lazy(() => import("./pages/admin/session/TabMatrix.jsx"));
const SessionAnswers      = lazy(() => import("./pages/admin/session/TabAnswers.jsx"));
const SessionSettings     = lazy(() => import("./pages/admin/session/TabSettings.jsx"));
const Projection  = lazy(() => import("./pages/admin/Projection.jsx"));
const Settings    = lazy(() => import("./pages/admin/Settings.jsx"));
const NotFound    = lazy(() => import("./pages/NotFound.jsx"));

export function Fallback() {
  return (
    <div className="route-fallback"><span className="ring" />جارٍ التحميل…</div>
  );
}

/* يحمي مسارات الإدارة ويحفظ الوجهة حتى يعود إليها بعد الدخول */
function RequireAuth() {
  const { authed, checking } = useAuth();
  const loc = useLocation();
  if (checking) return <Fallback />;
  if (!authed) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />;
  return (
    <AdminDataProvider>
      <Outlet />
    </AdminDataProvider>
  );
}

const page = (el) => <Suspense fallback={<Fallback />}>{el}</Suspense>;

export const routes = [
  { path: "/", element: page(<Join />) },
  { path: "/join/:code", element: page(<Join />) },
  { path: "/play/:code", element: page(<Play />) },
  { path: "/login", element: page(<Login />) },

  {
    element: <RequireAuth />,
    children: [
      /* شاشة العرض تملأ الشاشة، فتقع خارج هيكل اللوحة */
      { path: "/projection/:code", element: page(<Projection />) },
      {
        element: <AdminLayout />,
        children: [
          { path: "/dashboard", element: page(<Overview />) },
          { path: "/quizzes", element: page(<Quizzes />) },
          { path: "/quizzes/new", element: page(<QuizEditor />) },
          { path: "/quizzes/:id/edit", element: page(<QuizEditor />) },
          { path: "/sessions", element: page(<Sessions />) },
          {
            path: "/sessions/:code",
            element: page(<SessionPage />),
            children: [
              { index: true, element: page(<SessionOverview />) },
              { path: "participants", element: page(<SessionParticipants />) },
              { path: "analytics", element: page(<SessionAnalytics />) },
              { path: "matrix", element: page(<SessionMatrix />) },
              { path: "answers", element: page(<SessionAnswers />) },
              { path: "settings", element: page(<SessionSettings />) },
            ],
          },
          { path: "/settings", element: page(<Settings />) },
        ],
      },
    ],
  },

  { path: "*", element: page(<NotFound />) },
];
