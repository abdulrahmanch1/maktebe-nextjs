"use client";
import React, { createContext, useState, useMemo, useEffect } from "react";
import { themes } from "@/data/themes";

export const ThemeContext = createContext({ toggleTheme: (themeName) => {}, theme: themes.theme2, currentThemeName: 'theme2' });

export const ThemeProvider = ({ children }) => {
  const [currentThemeName, setCurrentThemeName] = useState(() => {
    if (typeof window === 'undefined') {
      return 'theme2';
    }
    const savedThemeName = localStorage.getItem("themeName");
    return savedThemeName || 'theme2';
  });

  const theme = useMemo(() => themes[currentThemeName], [currentThemeName]);

  useEffect(() => {
    localStorage.setItem("themeName", currentThemeName);
  }, [currentThemeName]);

  const toggleTheme = (themeName) => {
    setCurrentThemeName(themeName);
  };

  const themeValues = useMemo(() => ({ theme, toggleTheme, currentThemeName }), [theme, currentThemeName]);

  return (
    <ThemeContext.Provider value={themeValues}>
      {children}
    </ThemeContext.Provider>
  );
};
