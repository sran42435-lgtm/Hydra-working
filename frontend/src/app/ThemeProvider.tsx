import React from "react";

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

export default ThemeProvider;
