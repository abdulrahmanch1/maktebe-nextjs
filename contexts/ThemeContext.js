"use client";
import React, { createContext, useState, useMemo, useEffect } from "react";
import { themes } from "@/data/themes";

export const ThemeContext = createContext({ toggleTheme: (themeName) => {}, theme: themes.theme2 });

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // During SSR, return a default theme to prevent mismatch
    if (typeof window === 'undefined') {
      return themes.theme2;
    }

    // 1. Check for a theme saved in localStorage
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return JSON.parse(savedTheme);
    }

    // 2. If no saved theme, check system preference
    const userPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (userPrefersDark) {
      return themes.theme4; // "فولاذي داكن" (Steel Dark)
    }

    // 3. Fallback to the default light theme
    return themes.theme2; // "أزرق سماوي" (Sky Blue)
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("theme", JSON.stringify(theme));
    }
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
