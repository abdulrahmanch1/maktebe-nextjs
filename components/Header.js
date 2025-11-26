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
        <div className="header-start">
          <button className="menu-icon" onClick={toggleSidebar} aria-label="فتح القائمة">
            <FaBars />
          </button>
          <Link href="/" className="header-logo">
            <Image
              src="/icons/icon-192.png"
              alt="شعار دار القرّاء"
              width={32}
              height={32}
              className="header-logo-image"
            />
            <span className="header-logo-text">دار القرّاء</span>
          </Link>
        </div>

        <div className="header-user-section">
          {isLoggedIn ? (
            <Link href="/settings" className="header-user-link">
              <span className="header-user-name">{user?.username || 'مستخدم'}</span>
              <Image
                src={user && user.profilePicture ? user.profilePicture : '/imgs/user.jpg'}
                alt="صورة المستخدم"
                width={36}
                height={36}
                className="header-user-avatar"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=="
              />
            </Link>
          ) : (
            <>
              <Link href="/register" className="header-button signup-btn">إنشاء حساب</Link>
              <Link href="/login" className="header-button login-btn">تسجيل الدخول</Link>
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
