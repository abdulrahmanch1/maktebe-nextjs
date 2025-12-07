'use client';
import React, { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { ThemeContext } from "@/contexts/ThemeContext";
import axios from "axios";
import { API_URL } from "@/constants";
import { getStorageUrl } from "@/utils/imageUtils";
import './AuthorsPage.css'; // We will create this CSS file

const AuthorsPage = () => {
    const { theme } = useContext(ThemeContext);
    const [authors, setAuthors] = useState([]);
    const [mixedDisplay, setMixedDisplay] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const categories = [
        { value: 'all', label: 'الكل' },
        { value: 'religious_scholar', label: 'علماء الدين' },
        { value: 'scholar', label: 'العلماء' },
        { value: 'author', label: 'الكتّاب' },
        { value: 'poet', label: 'الشعراء' },
        { value: 'thinker', label: 'المفكرون' }
    ];

    useEffect(() => {
        const fetchAuthors = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/api/authors`);
                setAuthors(data || []);
            } catch (error) {
                console.error("Error fetching authors:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAuthors();
    }, []);

    useEffect(() => {
        // Filter authors
        let filtered = authors;
        if (searchTerm) {
            filtered = filtered.filter(author =>
                author.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Create mixed display
        const mixed = [];
        const writerAuthors = filtered.filter(a => a.role === 'author');
        const otherCategories = ['religious_scholar', 'scholar', 'poet', 'thinker'];
        let categoryIndex = 0;

        // Add writers in batches of 30, interspersed with category sections
        for (let i = 0; i < writerAuthors.length; i++) {
            mixed.push(writerAuthors[i]);

            // Every 30 writers, add a category section
            if ((i + 1) % 30 === 0 && categoryIndex < otherCategories.length) {
                const categoryValue = otherCategories[categoryIndex];
                const categoryAuthors = authors
                    .filter(a => a.role === categoryValue)
                    .slice(0, 4); // Show 4 authors per category

                if (categoryAuthors.length > 0) {
                    mixed.push({
                        type: 'category-section',
                        category: categoryValue,
                        categoryLabel: categories.find(c => c.value === categoryValue)?.label,
                        authors: categoryAuthors
                    });
                }
                categoryIndex++;
            }
        }

        // Add remaining non-writer authors at the end
        const nonWriters = filtered.filter(a => a.role !== 'author');
        mixed.push(...nonWriters);

        setMixedDisplay(mixed);
    }, [searchTerm, authors]);

    const getSafeImageUrl = (url) => {
        if (!url || url.trim() === '') return '/imgs/default_author.png';
        const storageUrl = getStorageUrl(url, 'author-images');
        return storageUrl || '/imgs/default_author.png';
    };

    const renderAuthorCard = (author) => (
        <Link href={`/author/${author.id}`} key={author.id} className="author-card">
            <div className="author-image-wrapper">
                <img
                    src={getSafeImageUrl(author.image_url)}
                    alt={author.name}
                    className="author-image"
                    onError={(e) => { e.target.src = '/imgs/default_author.png'; }}
                />
            </div>
            <div className="author-info">
                <h3 className="author-name">{author.name}</h3>
                {author.bio && (
                    <p className="author-description">{author.bio}</p>
                )}
            </div>
        </Link>
    );

    const renderCategorySection = (section) => (
        <div key={`category-${section.category}`} className="category-section">
            <div className="category-header">
                <h2 className="category-title">{section.categoryLabel}</h2>
                <Link
                    href={`/authors?role=${section.category}`}
                    className="view-all-btn"
                >
                    عرض الكل
                </Link>
            </div>
            <div className="authors-grid">
                {section.authors.map(author => renderAuthorCard(author))}
            </div>
        </div>
    );

    return (
        <div className="authors-page-container" style={{ backgroundColor: theme.background, color: theme.primary }}>
            <div className="authors-header">
                <h1>مؤلفو وعلماء المكتبة</h1>
                <p>تعرف على سير العلماء والمؤلفين الذين أثروا المكتبة العربية والإسلامية</p>
            </div>

            <div className="authors-filters">
                <input
                    type="text"
                    placeholder="ابحث عن مؤلف..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="authors-search-input"
                />
            </div>

            {loading ? (
                <div className="loading-spinner-container"><div className="loading-spinner"></div></div>
            ) : (
                <>
                    {mixedDisplay.map((item, index) => {
                        if (item.type === 'category-section') {
                            return renderCategorySection(item);
                        }
                        return null; // Will be handled in grid below
                    })}

                    <div className="authors-grid">
                        {mixedDisplay.filter(item => item.type !== 'category-section').map(author => renderAuthorCard(author))}
                    </div>
                </>
            )}
        </div>
    );
};

export default AuthorsPage;
