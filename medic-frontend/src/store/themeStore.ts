import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light";

interface ThemeStore {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
}

const applyTheme = (theme: Theme) => {
  // Option 1: using data-theme attribute (recommended with CSS variables)
  document.documentElement.setAttribute("data-theme", theme);

  // Option 2: using a class "dark" (uncomment if your CSS uses .dark)
  // if (theme === 'dark') {
  //   document.documentElement.classList.add('dark');
  // } else {
  //   document.documentElement.classList.remove('dark');
  // }
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: "dark", // default (will be overridden by stored value on init)
      toggle: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        applyTheme(next);
        set({ theme: next });
      },
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: "medic-theme",
      onRehydrateStorage: () => (state) => {
        // Apply the persisted theme after rehydration
        if (state) applyTheme(state.theme);
      },
    },
  ),
);

// Also apply the current theme immediately when the module loads,
// in case the store is used before rehydration (rare, but safe)
const currentTheme = localStorage.getItem("medic-theme");
if (currentTheme) {
  try {
    const parsed = JSON.parse(currentTheme);
    if (parsed.state?.theme) applyTheme(parsed.state.theme);
  } catch (e) {
    // fallback – ignore
  }
}
