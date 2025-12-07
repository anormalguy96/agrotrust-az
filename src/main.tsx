// agrotrust-az/src/main.tsx


import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "@/app/App";
import { AuthProvider } from "@/app/providers/AuthProvider";
import { QueryProvider } from "@/app/providers/QueryProvider";
import { ThemeProvider } from "@/app/providers/ThemeProvider";

import "@/styles/globals.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  // This should never happen if index.html is correct,
  // but it makes the error clearer during setup.
  throw new Error("Root element #root not found. Check index.html.");
}

<Route path="/auth/callback" element={<AuthCallback/>} />

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  </React.StrictMode>
);
