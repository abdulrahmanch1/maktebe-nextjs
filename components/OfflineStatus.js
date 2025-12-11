'use client';
import React from 'react';
import { FaWifi } from 'react-icons/fa';
import Link from 'next/link';

const OfflineStatus = () => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
            padding: '20px',
            color: 'var(--text-color)'
        }}>
            <div style={{
                fontSize: '4rem',
                marginBottom: '20px',
                color: 'var(--placeholder-color)',
                position: 'relative'
            }}>
                <FaWifi />
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(45deg)',
                    width: '100%',
                    height: '4px',
                    backgroundColor: 'var(--error-color, #ef4444)',
                    borderRadius: '2px'
                }} />
            </div>

            <h2 style={{ fontSize: '2rem', marginBottom: '15px', fontWeight: 'bold' }}>
                أنت الآن "أوفلاين" 😅
            </h2>

            <p style={{ fontSize: '1.2rem', maxWidth: '500px', lineHeight: '1.6', marginBottom: '30px', opacity: 0.9 }}>
                يبدو أن باقتك انتهت أو أنك في مكان معزول! لا تقلق، نحن نحترم ظروفك (الفقيرة) 😂
                <br />
                يمكنك قراءة الكتب التي قمت بتحميلها مسبقاً.
            </p>

            <Link href="/offline" style={{
                padding: '12px 30px',
                backgroundColor: 'var(--accent-color)',
                color: 'white',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}>
                الذهاب لمكتبتي المحملة
            </Link>
        </div>
    );
};

export default OfflineStatus;
