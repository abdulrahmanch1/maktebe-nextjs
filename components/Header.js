'use client';
import React, { useContext, useState } from "react";
import Link from "next/link";
import { ThemeContext } from "@/contexts/ThemeContext";
import { AuthContext } from "@/contexts/AuthContext";
import Image from 'next/image';
import { FaBars } from 'react-icons/fa';
import Sidebar from '@/components/Sidebar';
import Overlay from '@/components/Overlay';
import './Header.css';

const Header = () => {
  const { theme } = useContext(ThemeContext);
  const { isLoggedIn, user, logout } = useContext(AuthContext);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <header className="header themed-header">
      <div className="header-content">
        <div className="menu-icon" onClick={toggleSidebar}>
          <FaBars className="menu-icon themed-icon" />
        </div>
        <nav className="header-nav">
          <Link href="/" className="header-link themed-link">الرئيسية</Link>
          {isLoggedIn && <Link href="/suggest-book" className="header-link themed-link">اقترح كتاباً</Link>}
          <Link href="/settings" className="header-link themed-link">الإعدادات</Link>
          <Link href="/favorites" className="header-link themed-link">المفضلة</Link>
          <Link href="/reading-list" className="header-link themed-link">قائمة القراءة</Link>
          {isLoggedIn && user && user.role === 'admin' && (
            <Link href="/admin" className="header-link themed-link">لوحة التحكم</Link>
          )}
        </nav>
        
        <div className="header-user-section">
          {isLoggedIn ? (
            <>
              <Link href="/settings" className="header-link themed-link">{user ? user.username : "اسم المستخدم"}</Link>
              <Image
                src={user && user.profilePicture ? user.profilePicture : '/imgs/user.jpg'}
                alt="صورة المستخدم"
                width={40}
                height={40}
                className="header-user-avatar"
              />
              <button onClick={logout} className="header-button logout-button-header" style={{ backgroundColor: theme.accent, color: theme.primary }}>تسجيل الخروج</button>
            </>
          ) : (
            <>
              <Link href="/login" className="header-link themed-link-fixed-color" style={{ marginLeft: "10px" }}>تسجيل الدخول</Link>
              <Link href="/register" className="header-button header-link themed-button-accent">إنشاء حساب</Link>
            </>
          )}
        </div>
      </div>
      <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} isLoggedIn={isLoggedIn} logout={logout} />
      <Overlay isOpen={isSidebarOpen} onClick={toggleSidebar} />
    </header>
  );
};

export default Header;
