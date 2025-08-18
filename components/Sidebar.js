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

  const getLinkStyle = (path) => {
    const isActive = pathname === path;
    return {
      color: isActive ? theme.primary : theme.primary,
      backgroundColor: isActive ? theme.accent : 'transparent',
      fontWeight: isActive ? 'bold' : 'normal',
      width: '80%',
      borderRadius: isActive ? '25px' : '0',
      textAlign: 'center',
    };
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`} style={{ backgroundColor: theme.secondary }}>
      <div className="sidebar-header">
        <button onClick={toggle} className="close-btn" style={{ color: theme.primary }}>&times;</button>
      </div>
      <nav className="sidebar-nav">
        <Link href="/" onClick={toggle} style={getLinkStyle('/')}>الرئيسية</Link>
        <Link href="/settings" onClick={toggle} style={getLinkStyle('/settings')}>الإعدادات</Link>
        <Link href="/favorites" onClick={toggle} style={getLinkStyle('/favorites')}>المفضلة</Link>
        <Link href="/reading-list" onClick={toggle} style={getLinkStyle('/reading-list')}>قائمة القراءة</Link>
        {isLoggedIn && user && user.role === 'admin' && (
          <Link href="/admin" onClick={toggle} style={getLinkStyle('/admin')}>لوحة التحكم</Link>
        )}
      </nav>
      {isLoggedIn && (
        <button onClick={() => { logout(); toggle(); }} className="sidebar-logout-button" style={{ backgroundColor: theme.accent, color: theme.primary }}>تسجيل الخروج</button>
      )}
    </div>
  );
};

export default Sidebar;
