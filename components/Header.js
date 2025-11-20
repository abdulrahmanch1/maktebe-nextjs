'use client';
import React, { useContext, useState } from "react";
import Link from "next/link";
import { usePathname } from 'next/navigation'; // Added import
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
  const pathname = usePathname(); // Added usePathname

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  // Hide header only on book reader pages (e.g., /read/123)
  const isHiddenRoute = /^\/read\/\d+/.test(pathname);
  if (isHiddenRoute) {
    return null;
  }

  return (
    <header className="header">
      <div className="header-content">
        <button className="menu-icon" onClick={toggleSidebar} aria-label="فتح القائمة">
          <FaBars />
        </button>
        <nav className="header-nav">
          <Link href="/" className="header-link">الرئيسية</Link>
          <Link href="/suggest-book" className="header-link">اقترح كتاباً</Link>
          <Link href="/settings" className="header-link">الإعدادات</Link>
          <Link href="/favorites" className="header-link">المفضلة</Link>
          <Link href="/reading-list" className="header-link">قائمة القراءة</Link>
          {isLoggedIn && user?.role === 'admin' && (
            <Link href="/admin" className="header-link">لوحة التحكم</Link>
          )}
        </nav>

        <div className="header-user-section">
          {isLoggedIn ? (
            <>
              <Link href="/settings" className="header-link">{user ? user.username : "اسم المستخدم"}</Link>
              <Image
                src={user && user.profilePicture ? user.profilePicture : '/imgs/user.jpg'}
                alt="صورة المستخدم"
                width={40}
                height={40}
                className="header-user-avatar"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=="
              />
              <button onClick={logout} className="header-button logout-button-header">تسجيل الخروج</button>
            </>
          ) : (
            <>
              <Link href="/login" className="header-link">تسجيل الدخول</Link>
              <Link href="/register" className="header-button header-link">إنشاء حساب</Link>
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
