'use client';
import React, { useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeContext } from '@/contexts/ThemeContext';
import { AuthContext } from '@/contexts/AuthContext';
import './Sidebar.css';

import { FaHome, FaBookOpen, FaCog, FaHeart, FaList, FaTachometerAlt, FaChartBar, FaBook } from 'react-icons/fa';
import Image from 'next/image';

const Sidebar = ({ isOpen, toggle, isLoggedIn, logout }) => {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const pathname = usePathname();

  const getLinkClassName = (path) => {
    const isActive = pathname === path;
    return `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`;
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''} themed-secondary-background`}>
      <div className="sidebar-header">
        <button onClick={toggle} className="close-btn themed-primary-text" aria-label="إغلاق القائمة الجانبية">&times;</button>
      </div>

      <div className="sidebar-logo-container">
        <Image
          src="/icons/icon-192.png"
          alt="Dar Al-Qurra Logo"
          width={40}
          height={40}
          className="sidebar-logo-img"
          priority
        />
        <h2 className="sidebar-title themed-primary-text">دار القرّاء</h2>
      </div>

      <nav className="sidebar-nav">
        <Link href="/" onClick={toggle} className={getLinkClassName('/')}>
          <FaHome className="sidebar-icon" />
          <span>الرئيسية</span>
        </Link>
        {isLoggedIn && (
          <Link href="/suggest-book" onClick={toggle} className={getLinkClassName('/suggest-book')}>
            <FaBookOpen className="sidebar-icon" />
            <span>اقترح كتاباً</span>
          </Link>
        )}
        <Link href="/favorites" onClick={toggle} className={getLinkClassName('/favorites')}>
          <FaHeart className="sidebar-icon" />
          <span>المفضلة</span>
        </Link>
        <Link href="/reading-list" onClick={toggle} className={getLinkClassName('/reading-list')}>
          <FaList className="sidebar-icon" />
          <span>قائمة القراءة</span>
        </Link>
        <Link href="/settings" onClick={toggle} className={getLinkClassName('/settings')}>
          <FaCog className="sidebar-icon" />
          <span>الإعدادات</span>
        </Link>

        {isLoggedIn && user && user.role === 'admin' && (
          <>
            <div className="sidebar-divider"></div>
            <div className="sidebar-section-title">الإدارة</div>
            <Link href="/admin" onClick={toggle} className={getLinkClassName('/admin')}>
              <FaTachometerAlt className="sidebar-icon" />
              <span>لوحة التحكم</span>
            </Link>
            <Link href="/admin/analytics" onClick={toggle} className={getLinkClassName('/admin/analytics')}>
              <FaChartBar className="sidebar-icon" />
              <span>الإحصائيات</span>
            </Link>
            <Link href="/admin/suggested-books" onClick={toggle} className={getLinkClassName('/admin/suggested-books')}>
              <FaBook className="sidebar-icon" />
              <span>الكتب المقترحة</span>
            </Link>
          </>
        )}
      </nav>
      {isLoggedIn ? (
        <button onClick={() => { logout(); toggle(); }} className="sidebar-logout-button themed-button-accent">
          تسجيل الخروج
        </button>
      ) : (
        <div className="sidebar-auth-buttons">
          <Link href="/login" onClick={toggle} className="sidebar-auth-btn login">
            تسجيل الدخول
          </Link>
          <Link href="/register" onClick={toggle} className="sidebar-auth-btn register">
            إنشاء حساب
          </Link>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
