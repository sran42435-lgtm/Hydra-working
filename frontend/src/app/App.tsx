/**
 * App Root Component - Phase 1
 * Root komponen aplikasi Hydra AI.
 * Membungkus seluruh aplikasi dengan ThemeProvider.
 */

import React from "react";
import { ThemeProvider } from "./ThemeProvider";
import { AppRoutes } from "./AppRoutes";

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  );
};
