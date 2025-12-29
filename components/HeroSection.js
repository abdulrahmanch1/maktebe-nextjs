'use client';
import React, { useState, useEffect } from 'react';
import './HeroSection.css';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { API_URL } from '@/constants';

const HeroSection = () => {
    const [greeting, setGreeting] = useState('أهلاً بك');
    const [featuredBook, setFeaturedBook] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('صباح القراءة ☀️');
        else if (hour < 18) setGreeting('طاب مساؤك 🌤️');
        else setGreeting('سهرة ممتعة 🌙');

        // Fetch featured book
        fetchFeaturedBook();
    }, []);

    const fetchFeaturedBook = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/admin/featured-book`);
            setFeaturedBook(response.data);
        } catch (error) {
            console.error('Error fetching featured book:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="hero-container">
            <div className="hero-bg-pattern"></div>

            <div className="hero-content">
                <span className="hero-greeting">{greeting}</span>
                <h1 className="hero-title">اكتشف عالمك<br />التالي بين السطور.</h1>
                <p className="hero-subtitle">
                    آلاف الكتب والروايات العربية بانتظارك. مكتبة "وراق" صممت لتمنحك تجربة قراءة لا تُنسى.
                </p>
            </div>

            <div className="hero-visual">
                <div className="book-3d">
                    {loading ? (
                        <div style={{
                            width: '100%', height: '100%',
                            background: 'var(--secondary-color)',
                            borderRadius: '4px 16px 16px 4px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--primary-color)', fontWeight: 'bold',
                            fontSize: '2rem'
                        }}>
                            ⏳
                        </div>
                    ) : featuredBook ? (
                        <Link href={`/book/${featuredBook.id}`} style={{ width: '100%', height: '100%', display: 'block' }}>
                            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                <Image
                                    src={featuredBook.cover || '/imgs/default-book.jpg'}
                                    alt={featuredBook.title || 'كتاب الأسبوع'}
                                    fill
                                    sizes="180px"
                                    style={{ objectFit: 'cover', borderRadius: '4px 16px 16px 4px' }}
                                    priority
                                />
                                <div className="book-overlay">
                                    <div className="book-badge">
                                        ⭐ كتاب الأسبوع
                                    </div>
                                    <div className="book-title-overlay">
                                        {featuredBook.title}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ) : (
                        <div style={{
                            width: '100%', height: '100%',
                            background: 'var(--secondary-color)',
                            borderRadius: '4px 16px 16px 4px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--primary-color)', fontWeight: 'bold', textAlign: 'center', padding: '10px'
                        }}>
                            كتاب الأسبوع
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HeroSection;
