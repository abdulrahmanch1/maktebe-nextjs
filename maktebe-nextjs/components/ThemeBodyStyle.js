'use client';

import { useContext, useEffect } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";

const ThemeBodyStyle = () => {
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    document.documentElement.style.setProperty('--background-color', theme.background);
    document.documentElement.style.setProperty('--primary-color', theme.primary);
    document.documentElement.style.setProperty('--secondary-color', theme.secondary); // Add secondary color
    document.documentElement.style.setProperty('--accent-color', theme.accent); // Add accent color

    const placeholderColor = theme.isDark ? '#999' : '#a9a9a9';
    document.documentElement.style.setProperty('--placeholder-color', placeholderColor);
  }, [theme]);

  return null; // This component doesn't render anything
};

export default ThemeBodyStyle;
