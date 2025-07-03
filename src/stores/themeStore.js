// stores/themeStore.js
import { create } from "zustand";

// Decide the initial theme
const getInitialTheme = () => {
  const stored = localStorage.getItem("darkMode");
  if (stored === "true") return true;
  if (stored === "false") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const initialTheme = getInitialTheme();

if (initialTheme) {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

export const useThemeStore = create((set) => ({
  isDarkMode: initialTheme,
  toggleDarkMode: () =>
    set((state) => {
      const newTheme = !state.isDarkMode;
      localStorage.setItem("darkMode", newTheme);
      document.documentElement.classList.toggle("dark", newTheme);
      return { isDarkMode: newTheme };
    }),
}));
