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
