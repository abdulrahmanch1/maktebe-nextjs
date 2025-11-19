'use client';
import React from "react";
import { usePathname } from 'next/navigation';
import './Footer.css'; // Import the CSS file

const Footer = () => {
  const pathname = usePathname();
  const isHiddenRoute = pathname?.startsWith('/read');
  if (isHiddenRoute) {
    return null;
  }

  return (
    <footer className="footer">
      <p>جميع الحقوق محفوظة © 2025</p>
    </footer>
  );
};

export default Footer;
