"use client";
import React, { createContext, useState, useMemo, useEffect } from "react";
import { themes } from "@/data/themes";

// Helper to get cookie value
const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i=0;i < ca.length;i++) {
    let c = ca[i];
    while (c.charAt(0)===' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
};

// Helper to set cookie value
const setCookie = (name, value, days) => {
  if (typeof document === 'undefined') return;
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days*24*60*60*1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "")  + expires + "; path=/";
};

export const ThemeContext = createContext({ toggleTheme: (themeName) => {}, theme: themes.theme2, currentThemeName: 'theme2' });

export const ThemeProvider = ({ children }) => {
  const [currentThemeName, setCurrentThemeName] = useState(() => {
    const savedThemeName = getCookie("themeName");
    return savedThemeName || 'theme2';
  });

  const theme = useMemo(() => themes[currentThemeName], [currentThemeName]);

  useEffect(() => {
    setCookie("themeName", currentThemeName, 365); // Save for 365 days
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
