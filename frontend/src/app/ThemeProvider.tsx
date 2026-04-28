/**
 * Theme Provider - Phase 1
 * Menyediakan tema dasar untuk aplikasi Hydra.
 */

import React from "react";

export const useTheme = () => ({
  mode: "dark" as const,
  colors: {
    background: "#0f172a",
    surface: "#1e293b",
    border: "#334155",
    textPrimary: "#f1f5f9",
    textSecondary: "#94a3b8",
    accent: "#3b82f6",
    error: "#ef4444",
  },
});

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

export default ThemeProvider;
