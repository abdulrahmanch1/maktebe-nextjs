'use client';

import { useContext, useEffect } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";

const hexToRgb = (hex) => {
  if (!hex) return null;
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return null;
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
};

const ThemeBodyStyle = ({ children }) => {
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    document.documentElement.style.setProperty('--background-color', theme.background);
    document.documentElement.style.setProperty('--primary-color', theme.primary);
    document.documentElement.style.setProperty('--secondary-color', theme.secondary);
    document.documentElement.style.setProperty('--accent-color', theme.accent);
    document.documentElement.setAttribute('data-theme', theme.isDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme-key', theme.name || '');
    const accentRgb = hexToRgb(theme.accent);
    if (accentRgb) {
      document.documentElement.style.setProperty('--accent-rgb', accentRgb);
    }

    const placeholderColor = theme.isDark ? '#999' : '#a9a9a9';
    document.documentElement.style.setProperty('--placeholder-color', placeholderColor);
  }, [theme]);

  return <>{children}</>; // This component doesn't render anything
};

export default ThemeBodyStyle;
