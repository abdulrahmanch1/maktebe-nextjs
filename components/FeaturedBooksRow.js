'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import BookCard from './BookCard';
import BookCardSkeleton from './BookCardSkeleton';
import { API_URL } from '@/constants';
import { FaFire, FaStar } from 'react-icons/fa';
import './FeaturedBooksRow.css';

const FeaturedBooksRow = ({ title, type }) => {
    const { data: books, isLoading, isError } = useQuery({
        queryKey: ['featuredBooks', type],
        queryFn: async () => {
            const params = { limit: 10 };
            if (type === 'most_read') {
                params.topRead = 'true';
            } else if (type === 'most_favorited') {
                params.topFavorited = 'true';
            }

            const { data } = await axios.get(`${API_URL}/api/books`, { params });
            return data;
        },
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
        refetchOnWindowFocus: false,
    });

    if (isError) return null; // Hide section on error
    if (!isLoading && (!books || books.length === 0)) return null;

    return (
        <div className="featured-books-row">
            <div className="featured-header">
                <h2 className="featured-title">
                    {type === 'most_read' ? <FaFire className="featured-icon fire" /> : <FaStar className="featured-icon star" />}
                    {title}
                </h2>
            </div>

            <div className="featured-scroll-container">
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="featured-card-wrapper">
                            <BookCardSkeleton />
                        </div>
                    ))
                ) : (
                    books.map((book) => (
                        <div key={book.id} className="featured-card-wrapper">
                            <BookCard book={book} />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default FeaturedBooksRow;
