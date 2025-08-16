'use client';
import React, { useContext, useState } from "react";
import Link from "next/link";
// import { ThemeContext } from "@/contexts/ThemeContext";
// import { AuthContext } from "@/contexts/AuthContext";
import Image from 'next/image';
import { FaBars } from 'react-icons/fa';
import Sidebar from '@/components/Sidebar';
import Overlay from '@/components/Overlay';
import './Header.css';

const Header = () => {
  // const { theme } = useContext(ThemeContext); // Commented out for testing
  // const { isLoggedIn, user, logout } = useContext(AuthContext); // Commented out for testing
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="menu-icon" onClick={toggleSidebar}>
          <FaBars />
        </div>
        <nav className="header-nav">
          <Link href="/" className="header-link">الرئيسية</Link>
          <Link href="/settings" className="header-link">الإعدادات</Link>
          <Link href="/favorites" className="header-link">المفضلة</Link>
          <Link href="/reading-list" className="header-link">قائمة القراءة</Link>
        </nav>
        
        {/* <div className="header-user-section">
          Auth section commented out for testing
        </div> */}
      </div>
      <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} isLoggedIn={isLoggedIn} logout={logout} />
      <Overlay isOpen={isSidebarOpen} onClick={toggleSidebar} />
    </header>
  );
};

export default Header;
