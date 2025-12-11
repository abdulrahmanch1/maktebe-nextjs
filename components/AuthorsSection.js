'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getStorageUrl } from '@/utils/imageUtils';
import '@/app/authors/AuthorsPage.css';

const AuthorsSection = ({ authors }) => {
    if (!authors || authors.length === 0) return null;

    const getSafeImageUrl = (url) => {
        if (!url || url.trim() === '') return '/imgs/default_author.png';
        const storageUrl = getStorageUrl(url, 'author-images');
        return storageUrl || '/imgs/default_author.png';
    };

    return (
        <div className="authors-section" style={{ width: '100%', marginTop: '2rem', marginBottom: '2rem' }}>
            <h2 className="section-title-authors" style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>مؤلفون مقترحون</h2>

            {/* Use the exact class from CSS: authors-grid */}
            <div className="authors-grid">
                {authors.map((author) => (
                    <Link href={`/author/${author.id}`} key={author.id} className="author-card">
                        <div className="author-image-wrapper">
                            <Image
                                src={getSafeImageUrl(author.image_url)}
                                alt={author.name}
                                fill
                                sizes="(max-width: 768px) 100px, 100px"
                                className="author-image"
                                style={{ objectFit: 'cover' }}
                                onError={(e) => {
                                    // Fallback logic for next/image is tricky without state, 
                                    // but we can try to set the src on the underlying img element if possible,
                                    // or just rely on the initial safe URL.
                                    // For a robust solution, we'd need a small client component for the image,
                                    // but for now let's trust getSafeImageUrl.
                                }}
                            />
                        </div>
                        <div className="author-info">
                            <h3 className="author-name">{author.name}</h3>
                            {author.bio && (
                                <p className="author-description">{author.bio}</p>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default AuthorsSection;
