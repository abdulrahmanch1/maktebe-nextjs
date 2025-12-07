'use client';
import React, { useContext, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ThemeContext } from "@/contexts/ThemeContext";
import axios from "axios";
import { API_URL } from "@/constants";
import BookCard from "@/components/BookCard";
import { getStorageUrl } from "@/utils/imageUtils";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import './AuthorProfile.css'; // We will create this CSS file

const AuthorProfilePage = () => {
    const { theme } = useContext(ThemeContext);
    const { id } = useParams();
    const [author, setAuthor] = useState(null);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch author details
                const authorRes = await axios.get(`${API_URL}/api/authors/${id}`);
                setAuthor(authorRes.data);

                // Fetch author's books
                // Assuming we can filter books by author name. 
                // Ideally, books should have an author_id, but currently they have author name string.
                // So we use the author's name to fetch books.
                if (authorRes.data?.name) {
                    const booksRes = await axios.get(`${API_URL}/api/books?author=${encodeURIComponent(authorRes.data.name)}`);
                    setBooks(booksRes.data || []);
                }
            } catch (error) {
                console.error("Error fetching author data:", error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchData();
    }, [id]);

    const getSafeImageUrl = (url) => {
        if (!url || url.trim() === '') return '/imgs/default_author.png';
        const storageUrl = getStorageUrl(url, 'author-images');
        return storageUrl || '/imgs/default_author.png';
    };

    if (loading) return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;
    if (!author) return <div className="not-found">المؤلف غير موجود</div>;

    return (
        <div className="author-profile-container" style={{ backgroundColor: theme.background, color: theme.primary }}>
            {/* Hero Section */}
            <div className="author-hero">
                <div className="author-hero-content">
                    <div className="author-profile-image-wrapper">
                        <img
                            src={getSafeImageUrl(author.image_url)}
                            alt={author.name}
                            width="200"
                            height="200"
                            className="author-profile-image"
                            onError={(e) => { e.target.src = '/imgs/default_author.png'; }}
                        />
                    </div>
                    <h1 className="author-profile-name">{author.name}</h1>

                    <div className="author-meta-info">
                        {(author.birth_date || author.death_date) && (
                            <div className="meta-item">
                                <span className="meta-icon">🗓️</span>
                                <span>
                                    {author.birth_date ? author.birth_date : '؟'}
                                    {' - '}
                                    {author.death_date ? author.death_date : 'الآن'}
                                </span>
                            </div>
                        )}
                        {(author.birth_place || author.residence_place) && (
                            <div className="meta-item">
                                <span className="meta-icon">📍</span>
                                <span>
                                    {author.birth_place && `ولد في ${author.birth_place}`}
                                    {author.birth_place && author.residence_place && '، '}
                                    {author.residence_place && `عاش في ${author.residence_place}`}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Warning / Educational Message */}
            <div className="author-warning-section">
                <div className="warning-card">
                    <div className="warning-icon">⚠️</div>
                    <div className="warning-content">
                        <h3>لماذا عليك معرفة الكاتب قبل الكتاب؟</h3>
                        <p>من المهم جداً معرفة خلفية الكاتب، فقد لا يكون عالماً أو متخصصاً، مما قد يؤدي إلى تبني أفكار غير دقيقة بمجرد قراءة كتابه. المعرفة بالكاتب تحميك من المعلومات المغلوطة وتساعدك على فهم السياق الذي كتب فيه.</p>
                    </div>
                </div>
            </div>

            <div className="author-content-layout">
                {/* Main Info */}
                <div className="author-main-info">
                    {author.bio && (
                        <section className="info-section">
                            <h2>السيرة العلمية</h2>
                            <div className="markdown-content">
                                <ReactMarkdown rehypePlugins={[rehypeRaw]}>{author.bio}</ReactMarkdown>
                            </div>
                        </section>
                    )}

                    {author.social_life && (
                        <section className="info-section social-life-section">
                            <h2>الحياة الاجتماعية والنشأة</h2>
                            <div className="markdown-content">
                                <ReactMarkdown rehypePlugins={[rehypeRaw]}>{author.social_life}</ReactMarkdown>
                            </div>
                        </section>
                    )}

                    {author.achievements && (
                        <section className="info-section">
                            <h2>أبرز الإنجازات</h2>
                            <div className="markdown-content">
                                <ReactMarkdown rehypePlugins={[rehypeRaw]}>{author.achievements}</ReactMarkdown>
                            </div>
                        </section>
                    )}
                </div>

                {/* Books Grid */}
                <div className="author-books-section">
                    <h2>كتب {author.name} في المكتبة ({books.length})</h2>
                    {books.length > 0 ? (
                        <div className="books-grid-display">
                            {books.map(book => (
                                <BookCard key={book.id} book={book} />
                            ))}
                        </div>
                    ) : (
                        <p>لا توجد كتب لهذا المؤلف في المكتبة حالياً.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthorProfilePage;
