'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '@/constants';
import Link from 'next/link';
import './FeaturedBookPage.css';

const FeaturedBookPage = () => {
    const router = useRouter();
    const [featuredBook, setFeaturedBook] = useState(null);
    const [allBooks, setAllBooks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [featuredRes, booksRes] = await Promise.all([
                axios.get(`${API_URL}/api/admin/featured-book`),
                axios.get(`${API_URL}/api/books`)
            ]);

            setFeaturedBook(featuredRes.data);
            setAllBooks(booksRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('فشل تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    const handleSetFeatured = async (bookId) => {
        if (updating) return;

        setUpdating(true);
        try {
            const response = await axios.put(`${API_URL}/api/admin/featured-book`, {
                bookId
            });

            toast.success(response.data.message);
            await fetchData(); // Refresh data
        } catch (error) {
            console.error('Error setting featured book:', error);
            toast.error(error.response?.data?.message || 'فشل تحديد الكتاب المميز');
        } finally {
            setUpdating(false);
        }
    };

    const handleRemoveFeatured = async (bookId) => {
        if (updating) return;

        setUpdating(true);
        try {
            const response = await axios.delete(`${API_URL}/api/admin/featured-book`, {
                data: { bookId }
            });

            toast.success(response.data.message);
            await fetchData();
        } catch (error) {
            console.error('Error removing featured:', error);
            toast.error(error.response?.data?.message || 'فشل إلغاء التمييز');
        } finally {
            setUpdating(false);
        }
    };

    const filteredBooks = allBooks.filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="featured-book-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>جاري التحميل...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="featured-book-container">
            {/* Header */}
            <div className="featured-header">
                <div>
                    <h1 className="featured-title">⭐ كتاب الأسبوع</h1>
                    <p className="featured-subtitle">اختر الكتاب المميز الذي سيظهر في الصفحة الرئيسية</p>
                </div>
                <Link href="/admin" className="back-button">
                    ← العودة للوحة التحكم
                </Link>
            </div>

            {/* Current Featured Book */}
            {featuredBook && (
                <div className="current-featured-section">
                    <h2 className="section-title">📖 الكتاب المميز حالياً</h2>
                    <div className="featured-book-card">
                        <div className="featured-book-badge">⭐ مميز</div>
                        <div className="featured-book-content">
                            <div className="featured-book-cover">
                                <Image
                                    src={featuredBook.cover || '/imgs/default-book.jpg'}
                                    alt={featuredBook.title}
                                    width={120}
                                    height={180}
                                    className="book-cover-img"
                                />
                            </div>
                            <div className="featured-book-info">
                                <h3>{featuredBook.title}</h3>
                                <p className="book-author">✍️ {featuredBook.author}</p>
                                <p className="book-category">📚 {featuredBook.category || 'غير محدد'}</p>
                                <div className="book-stats">
                                    <span>👁️ {featuredBook.readcount || 0} قراءة</span>
                                    <span>❤️ {featuredBook.favoritecount || 0} إعجاب</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => handleRemoveFeatured(featuredBook.id)}
                            disabled={updating}
                            className="remove-featured-btn"
                        >
                            {updating ? '⏳ جاري الإلغاء...' : '✖️ إلغاء التمييز'}
                        </button>
                    </div>
                </div>
            )}

            {/* Search and Select */}
            <div className="select-book-section">
                <h2 className="section-title">🔍 اختر كتاب الأسبوع</h2>

                {/* Search Bar */}
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="ابحث عن كتاب (العنوان أو المؤلف)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    <span className="search-icon">🔍</span>
                </div>

                {/* Books Grid */}
                <div className="books-grid">
                    {filteredBooks.length === 0 ? (
                        <div className="no-results">
                            <p>لا توجد كتب تطابق البحث</p>
                        </div>
                    ) : (
                        filteredBooks.map((book) => (
                            <div
                                key={book.id}
                                className={`book-select-card ${book.id === featuredBook?.id ? 'is-featured' : ''}`}
                            >
                                <div className="book-select-cover">
                                    <Image
                                        src={book.cover || '/imgs/default-book.jpg'}
                                        alt={book.title}
                                        width={100}
                                        height={150}
                                        className="book-select-img"
                                    />
                                    {book.id === featuredBook?.id && (
                                        <div className="featured-overlay">⭐ مميز حالياً</div>
                                    )}
                                </div>
                                <div className="book-select-info">
                                    <h4>{book.title}</h4>
                                    <p className="book-select-author">{book.author}</p>
                                    <div className="book-select-stats">
                                        <span>👁️ {book.readcount || 0}</span>
                                        <span>❤️ {book.favoritecount || 0}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleSetFeatured(book.id)}
                                    disabled={updating || book.id === featuredBook?.id}
                                    className="select-book-btn"
                                >
                                    {book.id === featuredBook?.id ? '✓ مميز' : '⭐ اختيار'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeaturedBookPage;
