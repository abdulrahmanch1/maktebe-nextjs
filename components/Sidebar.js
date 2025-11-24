'use client';
import React, { useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeContext } from '@/contexts/ThemeContext';
import { AuthContext } from '@/contexts/AuthContext';
import './Sidebar.css';

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
      <nav className="sidebar-nav">
        <Link href="/" onClick={toggle} className={getLinkClassName('/')}>الرئيسية</Link>
        {isLoggedIn && <Link href="/suggest-book" onClick={toggle} className={getLinkClassName('/suggest-book')}>اقترح كتاباً</Link>}
        <Link href="/settings" onClick={toggle} className={getLinkClassName('/settings')}>الإعدادات</Link>
        <Link href="/favorites" onClick={toggle} className={getLinkClassName('/favorites')}>المفضلة</Link>
        <Link href="/reading-list" onClick={toggle} className={getLinkClassName('/reading-list')}>قائمة القراءة</Link>
        {isLoggedIn && user && user.role === 'admin' && (
          <>
            <Link href="/admin" onClick={toggle} className={getLinkClassName('/admin')}>لوحة التحكم</Link>
            <Link href="/admin/analytics" onClick={toggle} className={getLinkClassName('/admin/analytics')}>الإحصائيات</Link>
            <Link href="/admin/suggested-books" onClick={toggle} className={getLinkClassName('/admin/suggested-books')}>الكتب المقترحة</Link>
          </>
        )}
      </nav>
      {isLoggedIn && (
        <button onClick={() => { logout(); toggle(); }} className="sidebar-logout-button themed-button-accent">تسجيل الخروج</button>
      )}
    </div>
  );
};

export default Sidebar;
