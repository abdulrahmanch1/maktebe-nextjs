"use client";
import React, { createContext, useState, useMemo, useEffect } from "react";
import { themes } from "@/data/themes";

export const ThemeContext = createContext({ toggleTheme: (themeName) => {}, theme: themes.theme2 });

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') {
      return themes.theme2;
    }
    const savedTheme = localStorage.getItem("theme");
    return savedTheme ? JSON.parse(savedTheme) : themes.theme2;
  });

  useEffect(() => {
    localStorage.setItem("theme", JSON.stringify(theme));
  }, [theme]);

  const toggleTheme = (themeName) => {
    setTheme(themes[themeName]);
  };

  const themeValues = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return (
    <ThemeContext.Provider value={themeValues}>
      {children}
    </ThemeContext.Provider>
  );
};
