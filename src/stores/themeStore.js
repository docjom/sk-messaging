import { create } from "zustand";

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
  toggleDarkMode: () => {
    // Immediately toggle class and localStorage outside set
    const newTheme = !document.documentElement.classList.contains("dark");
    if (newTheme) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", newTheme);

    // Then update Zustand state
    set({ isDarkMode: newTheme });
  },
}));
