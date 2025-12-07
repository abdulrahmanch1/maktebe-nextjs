'use client';
import React, { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { ThemeContext } from "@/contexts/ThemeContext";
import { AuthContext } from "@/contexts/AuthContext";
import axios from "axios";
import { toast } from 'react-toastify';
import { API_URL } from "@/constants";
import Image from "next/image";
import '../AdminPage.css';
import { FaPlus, FaEdit, FaTrash, FaUserTie } from 'react-icons/fa';

const AdminAuthorsPage = () => {
    const { theme } = useContext(ThemeContext);
    const { user, session, isLoggedIn } = useContext(AuthContext);
    const [authors, setAuthors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAuthors = async () => {
            if (!session?.access_token) return;
            try {
                const { data } = await axios.get(`${API_URL}/api/authors`, {
                    headers: { Authorization: `Bearer ${session.access_token}` }
                });
                setAuthors(data || []);
            } catch (error) {
                console.error("Error fetching authors:", error);
                toast.error("فشل جلب قائمة المؤلفين");
            } finally {
                setLoading(false);
            }
        };
        fetchAuthors();
    }, [session]);

    const handleDelete = async (id) => {
        if (!window.confirm("هل أنت متأكد من حذف هذا المؤلف؟")) return;
        try {
            await axios.delete(`${API_URL}/api/authors/${id}`, {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });
            setAuthors(authors.filter(author => author.id !== id));
            toast.success("تم حذف المؤلف بنجاح");
        } catch (error) {
            console.error("Error deleting author:", error);
            toast.error("فشل حذف المؤلف");
        }
    };

    if (!isLoggedIn || user?.role !== 'admin') {
        return (
            <div className="admin-page-container">
                <div className="access-denied">
                    <div className="access-denied-icon">🚫</div>
                    <h1>غير مصرح لك بالوصول</h1>
                    <p>يجب أن تكون مسؤولاً للوصول إلى هذه الصفحة.</p>
                    <Link href="/" className="admin-form-button" style={{ display: 'inline-block', marginTop: '1rem', width: 'auto' }}>
                        العودة للرئيسية
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page-container">
            <div className="admin-books-list-container">
                <h1 className="admin-page-title">إدارة المؤلفين والعلماء</h1>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
                    <Link href="/admin/authors/add" className="admin-form-button" style={{ maxWidth: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <FaPlus /> إضافة مؤلف جديد
                    </Link>
                </div>

                <div className="admin-books-list">
                    {loading ? (
                        <div className="admin-loading">جاري تحميل قائمة المؤلفين...</div>
                    ) : authors.length === 0 ? (
                        <div className="admin-empty">لا يوجد مؤلفين حالياً. ابدأ بإضافة مؤلف جديد!</div>
                    ) : (
                        authors.map((author) => (
                            <div key={author.id} className="admin-book-item">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--primary-color)' }}>
                                        <Image
                                            src={author.image_url || '/imgs/default_author.png'}
                                            alt={author.name}
                                            fill
                                            style={{ objectFit: 'cover' }}
                                            onError={(e) => { e.target.src = '/imgs/default_author.png'; }}
                                        />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', color: 'var(--primary-color)' }}>{author.name}</h3>
                                        <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <FaUserTie /> {author.role}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <Link href={`/admin/authors/add?edit=${author.id}`} className="reply-button">
                                        <FaEdit /> تعديل
                                    </Link>
                                    <button onClick={() => handleDelete(author.id)} className="delete">
                                        <FaTrash /> حذف
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                    <Link href="/admin" className="admin-nav-link" style={{ maxWidth: '200px' }}>
                        ← العودة للوحة التحكم
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminAuthorsPage;
