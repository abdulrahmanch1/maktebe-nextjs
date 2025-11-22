'use client';
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_URL } from '@/constants';
import AnalyticsCard from '@/components/admin/AnalyticsCard';
import './AnalyticsPage.css';

const AnalyticsPage = () => {
    const { user, isLoggedIn, loading } = useContext(AuthContext);
    const router = useRouter();
    const [analyticsData, setAnalyticsData] = useState(null);
    const [booksData, setBooksData] = useState([]);
    const [pagesData, setPagesData] = useState([]);
    const [usersData, setUsersData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!loading && (!isLoggedIn || user?.role !== 'admin')) {
            router.push('/');
        }
    }, [isLoggedIn, user, loading, router]);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const [overviewRes, booksRes, pagesRes, usersRes] = await Promise.all([
                    axios.get(`${API_URL}/api/admin/analytics/overview`),
                    axios.get(`${API_URL}/api/admin/analytics/books`),
                    axios.get(`${API_URL}/api/admin/analytics/pages`),
                    axios.get(`${API_URL}/api/admin/analytics/users`),
                ]);

                setAnalyticsData(overviewRes.data);
                setBooksData(booksRes.data.books || []);
                setPagesData(pagesRes.data.pages || []);
                setUsersData(usersRes.data.users || []);
            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (isLoggedIn && user?.role === 'admin') {
            fetchAnalytics();
        }
    }, [isLoggedIn, user]);

    if (loading || isLoading) {
        return <div className="analytics-container">جاري التحميل...</div>;
    }

    if (!isLoggedIn || user?.role !== 'admin') {
        return null;
    }

    return (
        <div className="analytics-container">
            <h1 className="analytics-title">لوحة الإحصائيات</h1>

            {/* Overview Cards */}
            <div className="analytics-cards-grid">
                <AnalyticsCard
                    title="إجمالي الأحداث"
                    value={analyticsData?.overview?.totalEvents || 0}
                    icon="📊"
                />
                <AnalyticsCard
                    title="المستخدمون النشطون"
                    value={analyticsData?.overview?.uniqueUsers || 0}
                    icon="👥"
                />
                <AnalyticsCard
                    title="مشاهدات الصفحات"
                    value={analyticsData?.overview?.pageViews || 0}
                    icon="👁️"
                />
                <AnalyticsCard
                    title="مشاهدات الكتب"
                    value={analyticsData?.overview?.bookViews || 0}
                    icon="📚"
                />
                <AnalyticsCard
                    title="قراءات الكتب"
                    value={analyticsData?.overview?.bookReads || 0}
                    icon="📖"
                />
            </div>

            {/* Top Books */}
            <div className="analytics-section">
                <h2 className="analytics-section-title">أكثر الكتب مشاهدة</h2>
                <div className="analytics-table-container">
                    <table className="analytics-table">
                        <thead>
                            <tr>
                                <th>العنوان</th>
                                <th>المؤلف</th>
                                <th>المشاهدات</th>
                                <th>القراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {booksData.slice(0, 10).map((book, index) => (
                                <tr key={book.book_id || index}>
                                    <td>{book.title || 'غير معروف'}</td>
                                    <td>{book.author || 'غير معروف'}</td>
                                    <td>{book.views}</td>
                                    <td>{book.reads}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top Pages */}
            <div className="analytics-section">
                <h2 className="analytics-section-title">أكثر الصفحات زيارة</h2>
                <div className="analytics-table-container">
                    <table className="analytics-table">
                        <thead>
                            <tr>
                                <th>المسار</th>
                                <th>الزيارات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagesData.slice(0, 10).map((page, index) => (
                                <tr key={page.path || index}>
                                    <td>{page.path}</td>
                                    <td>{page.views}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top Users */}
            <div className="analytics-section">
                <h2 className="analytics-section-title">أكثر المستخدمين نشاطاً</h2>
                <div className="analytics-table-container">
                    <table className="analytics-table">
                        <thead>
                            <tr>
                                <th>اسم المستخدم</th>
                                <th>إجمالي الأحداث</th>
                                <th>مشاهدات الصفحات</th>
                                <th>مشاهدات الكتب</th>
                                <th>آخر نشاط</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usersData.slice(0, 10).map((user, index) => (
                                <tr key={user.user_id || index}>
                                    <td>{user.username}</td>
                                    <td>{user.total_events}</td>
                                    <td>{user.page_views}</td>
                                    <td>{user.book_views}</td>
                                    <td>{new Date(user.last_activity).toLocaleDateString('ar-EG')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
