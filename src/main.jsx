import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { ThemeWrapper } from "./ThemeWrapper.jsx";
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeWrapper />
  </StrictMode>
);
