'use client';
import Link from 'next/link';
import { FaHome, FaChevronLeft } from 'react-icons/fa';
import './Breadcrumbs.css';

export default function Breadcrumbs({ items }) {
    if (!items || items.length === 0) return null;

    return (
        <nav className="breadcrumbs" aria-label="مسار التنقل">
            <ol className="breadcrumbs-list">
                <li className="breadcrumb-item">
                    <Link href="/" className="breadcrumb-link">
                        <FaHome className="breadcrumb-icon" />
                        <span>الرئيسية</span>
                    </Link>
                </li>

                {items.map((item, index) => (
                    <li key={index} className="breadcrumb-item">
                        <FaChevronLeft className="breadcrumb-separator" />
                        {item.href ? (
                            <Link href={item.href} className="breadcrumb-link">
                                {item.label}
                            </Link>
                        ) : (
                            <span className="breadcrumb-current">{item.label}</span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
