"use client";
import React, { createContext, useState, useMemo, useEffect } from "react";
import { themes } from "@/data/themes";

export const ThemeContext = createContext({ toggleTheme: (themeName) => {}, theme: themes.theme2 });

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(themes.theme2);
  const [isThemeReady, setIsThemeReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      try {
        setTheme(JSON.parse(savedTheme));
        setIsThemeReady(true);
        return;
      } catch (error) {
        console.warn("Failed to parse saved theme, falling back to defaults", error);
      }
    }

    const userPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (userPrefersDark) {
      setTheme(themes.theme4); // "فولاذي داكن" (Steel Dark)
    }

    setIsThemeReady(true);
  }, []);

  useEffect(() => {
    if (!isThemeReady || typeof window === 'undefined') return;
    localStorage.setItem("theme", JSON.stringify(theme));
  }, [theme, isThemeReady]);

  const toggleTheme = (themeName) => {
    if (themes[themeName]) {
      setTheme(themes[themeName]);
      setIsThemeReady(true);
    }
  };

  const themeValues = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return (
    <ThemeContext.Provider value={themeValues}>
      {children}
    </ThemeContext.Provider>
  );
};
