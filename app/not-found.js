'use client';
import React, { useContext, useEffect, useRef } from "react";
import Link from 'next/link';
import { ThemeContext } from "@/contexts/ThemeContext";
import './NotFoundPage.css';

const NotFoundPage = () => {
  const { theme } = useContext(ThemeContext);

  return (
    <div
      className="not-found-container"
      style={{
        backgroundColor: theme.background,
        color: theme.primary,
      }}
    >
      <h1 className="not-found-title">404</h1>
      <h2 className="not-found-subtitle">الصفحة غير موجودة</h2>
      <p className="not-found-message">عذرًا، الصفحة التي تبحث عنها غير موجودة.</p>
      <Link href="/" className="not-found-link" style={{ color: theme.accent }}>العودة إلى الصفحة الرئيسية</Link>
    </div>
  );
};

export default NotFoundPage;
