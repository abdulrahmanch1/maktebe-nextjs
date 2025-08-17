'use client';
import React, { useContext } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";
import './Footer.css'; // Import the CSS file

const Footer = () => {
  const { theme } = useContext(ThemeContext);

  return (
    <footer className="footer" style={{
      backgroundColor: theme.primary,
      color: theme.background,
    }}>
      <p>جميع الحقوق محفوظة © 2025</p>
    </footer>
  );
};

export default Footer;
