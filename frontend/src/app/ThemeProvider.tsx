/**
 * Theme Provider - Phase 1
 * Menyediakan tema dasar untuk aplikasi Hydra.
 * Di Phase 1 hanya menyediakan tema gelap default (Hydra dark theme).
 * Di Phase 2+ dapat ditambahkan toggle light/dark dan custom theme.
 */

import React, { createContext, useContext, ReactNode } from "react";

export interface ThemeContextValue {
  mode: "dark";
  colors: {
    background: string;
    surface: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    error: string;
  };
}

const defaultTheme: ThemeContextValue = {
  mode: "dark",
  colors: {
    background: "#0f172a", // slate-900
    surface: "#1e293b",    // slate-800
    border: "#334155",     // slate-700
    textPrimary: "#f1f5f9", // slate-100
    textSecondary: "#94a3b8", // slate-400
    accent: "#3b82f6",     // blue-500
    error: "#ef4444",      // red-500
  },
};

const ThemeContext = createContext<ThemeContextValue>(defaultTheme);

export const useTheme = (): ThemeContextValue => {
  return useContext(ThemeContext);
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ThemeContext.Provider value={defaultTheme}>
      {children}
    </ThemeContext.Provider>
  );
};
