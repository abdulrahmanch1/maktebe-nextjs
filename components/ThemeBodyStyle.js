'use client';

import { useContext, useEffect } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";

const ThemeBodyStyle = () => {
  const { currentThemeName } = useContext(ThemeContext);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentThemeName);
  }, [currentThemeName]);

  return null;
};

export default ThemeBodyStyle;
