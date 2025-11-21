import React from 'react';
import './BookCardSkeleton.css';

const BookCardSkeleton = () => {
    return (
        <div className="book-card-skeleton">
            <div className="skeleton-cover"></div>
            <div className="skeleton-info">
                <div className="skeleton-title"></div>
                <div className="skeleton-author"></div>
            </div>
        </div>
    );
};

export default BookCardSkeleton;
