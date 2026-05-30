import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Read persisted theme from localStorage (Zustand persist key: 'medic-theme')
const getPersistedTheme = (): "dark" | "light" => {
  try {
    const raw = localStorage.getItem("medic-theme");
    if (!raw) return "dark";
    const parsed = JSON.parse(raw);
    // Zustand persist v2 structure: { state: { theme: 'dark' } }
    const theme = parsed.state?.theme;
    return theme === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
};

const theme = getPersistedTheme();
document.documentElement.setAttribute("data-theme", theme);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
