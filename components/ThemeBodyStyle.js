'use client';

import { useContext, useEffect } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";

const ThemeBodyStyle = () => {
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    document.body.style.backgroundColor = theme.background;
    document.body.style.color = theme.primary;

    const placeholderColor = theme.isDark ? '#999' : '#a9a9a9';
    document.documentElement.style.setProperty('--placeholder-color', placeholderColor);
  }, [theme]);

  return null; // This component doesn't render anything
};

export default ThemeBodyStyle;
