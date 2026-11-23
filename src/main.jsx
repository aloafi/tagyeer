import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useRoutes } from "react-router-dom";

import "./styles/fonts.css";
import "./styles/base.css";
import "./styles/admin.scoped.css";
import "./styles/participant.scoped.css";

import { routes } from "./routes.jsx";
import { AuthProvider } from "./lib/auth.jsx";
import { ToastProvider } from "./components/ui/Toast.jsx";
import { DialogProvider } from "./components/ui/Dialog.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import hideSplash from "./lib/splash.js";
import { isChunkError, recoverFromStaleBuild } from "./lib/lazyPage.js";

function Routed() {
  return useRoutes(routes);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <DialogProvider>
              <Routed />
            </DialogProvider>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);

/* وعود مرفوضة لا يلتقطها حدّ الأخطاء: إن كان سببها نسخة قديمة تعافينا،
   وإلا سجّلناها ليمكن تشخيصها بدل أن تمرّ صامتة. */
window.addEventListener("unhandledrejection", (e) => {
  const err = e && e.reason;
  if (isChunkError(err)) { recoverFromStaleBuild(); return; }
  console.error("[tagyeer] وعد مرفوض:", err);
});

/* التطبيق ركّب أول شاشة — نرفع شاشة البداية */
hideSplash();
