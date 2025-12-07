'use client';
import React, { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { ThemeContext } from "@/contexts/ThemeContext";
import { AuthContext } from "@/contexts/AuthContext";
import axios from "axios";
import { API_URL } from "@/constants";
import './DashboardPage.css';

const DashboardPage = () => {
    const { theme } = useContext(ThemeContext);
    const { user, session, isLoggedIn } = useContext(AuthContext);
    const [stats, setStats] = useState({
        totalBooks: { current: 0, trend: 0 },
        totalMessages: { current: 0, trend: 0 },
        totalSuggestions: { current: 0, trend: 0 },
        totalUsers: { current: 0, trend: 0 }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!session?.access_token) return;

            try {
                // Calculate dates for current and last month
                const now = new Date();
                const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

                const headers = { Authorization: `Bearer ${session.access_token}` };

                // Fetch all data
                const [booksRes, messagesRes] = await Promise.all([
                    axios.get(`${API_URL}/api/books`, { headers }),
                    axios.get(`${API_URL}/api/contact/messages`, { headers })
                ]);

                const books = booksRes.data || [];
                const messages = messagesRes.data || [];

                // Calculate current month stats
                const currentMonthBooks = books.filter(book =>
                    new Date(book.created_at) >= currentMonthStart
                ).length;

                const currentMonthMessages = messages.filter(msg =>
                    new Date(msg.created_at) >= currentMonthStart
                ).length;

                // Calculate last month stats
                const lastMonthBooks = books.filter(book => {
                    const date = new Date(book.created_at);
                    return date >= lastMonthStart && date <= lastMonthEnd;
                }).length;

                const lastMonthMessages = messages.filter(msg => {
                    const date = new Date(msg.created_at);
                    return date >= lastMonthStart && date <= lastMonthEnd;
                }).length;

                // Calculate trends (percentage change)
                const calculateTrend = (current, last) => {
                    if (last === 0) return current > 0 ? 100 : 0;
                    return Math.round(((current - last) / last) * 100);
                };

                setStats({
                    totalBooks: {
                        current: books.length,
                        trend: calculateTrend(currentMonthBooks, lastMonthBooks)
                    },
                    totalMessages: {
                        current: messages.length,
                        trend: calculateTrend(currentMonthMessages, lastMonthMessages)
                    },
                    totalSuggestions: {
                        current: 0,
                        trend: 0
                    },
                    totalUsers: {
                        current: 0,
                        trend: 0
                    }
                });
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [session]);

    if (!isLoggedIn || user?.role !== 'admin') {
        return (
            <div className="dashboard-container">
                <div className="access-denied">
                    <div className="access-denied-icon">🔒</div>
                    <h1>غير مصرح لك بالوصول</h1>
                    <p>يجب أن تكون مسؤولاً لعرض لوحة التحكم</p>
                </div>
            </div>
        );
    }

    const quickLinks = [
        {
            title: "إضافة كتاب جديد",
            description: "أضف كتاباً جديداً للمكتبة",
            icon: "📚",
            href: "/admin/add-book",
            color: "primary"
        },
        {
            title: "إدارة الكتب",
            description: "عرض وتعديل جميع الكتب",
            icon: "📖",
            href: "/admin/books",
            color: "info"
        },
        {
            title: "رسائل التواصل",
            description: "عرض رسائل المستخدمين",
            icon: "📬",
            href: "/admin/contact-messages",
            color: "success"
        },
        {
            title: "إدارة المؤلفين",
            description: "إضافة وتعديل المؤلفين",
            icon: "✍️",
            href: "/admin/authors",
            color: "info"
        },
        {
            title: "الكتب المقترحة",
            description: "إدارة اقتراحات الكتب",
            icon: "💡",
            href: "/admin/suggested-books",
            color: "warning"
        },
        {
            title: "مراقبة النشاط",
            description: "إحصائيات وتحليلات الموقع",
            icon: "📊",
            href: "/admin/analytics",
            color: "primary"
        }
    ];

    const statsCards = [
        {
            title: "إجمالي الكتب",
            value: stats.totalBooks.current,
            icon: "📚",
            color: "primary",
            trend: stats.totalBooks.trend
        },
        {
            title: "الرسائل",
            value: stats.totalMessages.current,
            icon: "📬",
            color: "success",
            trend: stats.totalMessages.trend
        },
        {
            title: "الاقتراحات",
            value: stats.totalSuggestions.current,
            icon: "💡",
            color: "warning",
            trend: stats.totalSuggestions.trend
        },
        {
            title: "المستخدمون",
            value: stats.totalUsers.current,
            icon: "👥",
            color: "info",
            trend: stats.totalUsers.trend
        }
    ];

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">لوحة التحكم</h1>
                    <p className="dashboard-subtitle">مرحباً بك، {user?.user_metadata?.username || 'المسؤول'} 👋</p>
                </div>
                <div className="dashboard-date">
                    {new Date().toLocaleDateString('ar-EG', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {statsCards.map((stat, index) => (
                    <div key={index} className={`stat-card stat-${stat.color}`}>
                        <div className="stat-icon">{stat.icon}</div>
                        <div className="stat-content">
                            <h3 className="stat-title">{stat.title}</h3>
                            <div className="stat-value">
                                {loading ? (
                                    <div className="stat-loading"></div>
                                ) : (
                                    <>
                                        <span className="stat-number">{stat.value}</span>
                                        <span className={`stat-trend ${stat.trend >= 0 ? 'trend-positive' : 'trend-negative'}`}>
                                            {stat.trend > 0 ? '+' : ''}{stat.trend}%
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Links */}
            <div className="quick-links-section">
                <h2 className="section-title">الوصول السريع</h2>
                <div className="quick-links-grid">
                    {quickLinks.map((link, index) => (
                        <Link key={index} href={link.href} className={`quick-link-card quick-link-${link.color}`}>
                            <div className="quick-link-icon">{link.icon}</div>
                            <div className="quick-link-content">
                                <h3 className="quick-link-title">{link.title}</h3>
                                <p className="quick-link-description">{link.description}</p>
                            </div>
                            <div className="quick-link-arrow">←</div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity-section">
                <h2 className="section-title">النشاط الأخير</h2>
                <div className="activity-card">
                    <div className="activity-item">
                        <div className="activity-icon activity-icon-success">✓</div>
                        <div className="activity-content">
                            <p className="activity-text">تم إضافة كتاب جديد</p>
                            <span className="activity-time">منذ ساعتين</span>
                        </div>
                    </div>
                    <div className="activity-item">
                        <div className="activity-icon activity-icon-info">📧</div>
                        <div className="activity-content">
                            <p className="activity-text">رسالة جديدة من مستخدم</p>
                            <span className="activity-time">منذ 3 ساعات</span>
                        </div>
                    </div>
                    <div className="activity-item">
                        <div className="activity-icon activity-icon-warning">💡</div>
                        <div className="activity-content">
                            <p className="activity-text">اقتراح كتاب جديد</p>
                            <span className="activity-time">منذ 5 ساعات</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
