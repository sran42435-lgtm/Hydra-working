import React from "react";
import ThemeProvider from "./ThemeProvider";
import { AppRoutes } from "./AppRoutes";

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  );
};
