import App from "./App.jsx";
import { useThemeStore } from "./stores/themeStore.js";

export const ThemeWrapper = () => {
  useThemeStore();

  return (
    <div className="min-h-screen">
      <App />
    </div>
  );
};
