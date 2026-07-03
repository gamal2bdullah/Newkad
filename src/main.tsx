import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { defaultLocale, isRTL, type ThemeMode, type Language } from "./core/i18n/types";

// Pre-mount: apply saved theme + dir to <html> to prevent flash
const STORAGE_KEY = "kad-locale-v1";
try {
  const raw = localStorage.getItem(STORAGE_KEY);
  const stored = raw ? JSON.parse(raw) : defaultLocale;
  const lang: Language = stored.language || defaultLocale.language;
  const theme: ThemeMode = stored.theme || defaultLocale.theme;
  const html = document.documentElement;
  html.setAttribute("lang", lang);
  html.setAttribute("dir", isRTL(lang) ? "rtl" : "ltr");
  html.setAttribute("data-theme", theme);
  if (theme === "custom" && stored.customAccent) {
    html.style.setProperty("--accent-custom", stored.customAccent);
  }
} catch {}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
