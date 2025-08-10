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
    <header className="header" style={{
      backgroundColor: theme.primary,
      color: theme.background,
    }}>
      <div className="header-content">
        <div className="menu-icon" onClick={toggleSidebar}>
          <FaBars style={{ color: theme.background }} />
        </div>
        <nav className="header-nav">
          <Link href="/" className="header-link" style={{ color: theme.background }}>الرئيسية</Link>
          <Link href="/settings" className="header-link" style={{ color: theme.background }}>الإعدادات</Link>
          <Link href="/favorites" className="header-link" style={{ color: theme.background }}>المفضلة</Link>
          <Link href="/reading-list" className="header-link" style={{ color: theme.background }}>قائمة القراءة</Link>
        </nav>
        
        <div className="header-user-section">
          {isLoggedIn ? (
            <>
              <Link href="/settings" className="header-link" style={{ color: theme.background }}>{user ? user.username : "اسم المستخدم"}</Link>
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
              <Link href="/login" className="header-link" style={{ color: theme.background, marginLeft: "10px" }}>تسجيل الدخول</Link>
              <Link href="/register" className="header-button header-link" style={{ backgroundColor: theme.accent, color: theme.primary }}>إنشاء حساب</Link>
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
