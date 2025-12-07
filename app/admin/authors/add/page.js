'use client';
import React, { useContext, useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ThemeContext } from "@/contexts/ThemeContext";
import { AuthContext } from "@/contexts/AuthContext";
import axios from "axios";
import { toast } from 'react-toastify';
import { API_URL } from "@/constants";
import { createClient as createSupabaseClient } from "@/utils/supabase/client";
import '../../AdminPage.css';
import { FaUser, FaBook, FaHistory, FaTrophy, FaTags, FaImage, FaArrowRight } from 'react-icons/fa';

const AdminAddAuthorContent = () => {
    const { theme } = useContext(ThemeContext);
    const { user, session, isLoggedIn } = useContext(AuthContext);
    const searchParams = useSearchParams();
    const router = useRouter();

    const [name, setName] = useState("");
    const [role, setRole] = useState("scholar");
    const [bio, setBio] = useState("");
    const [socialLife, setSocialLife] = useState("");
    const [achievements, setAchievements] = useState("");
    const [keywords, setKeywords] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [deathDate, setDeathDate] = useState("");
    const [birthPlace, setBirthPlace] = useState("");
    const [residencePlace, setResidencePlace] = useState("");
    const [image, setImage] = useState(null);
    const [existingImageUrl, setExistingImageUrl] = useState(null);
    const [editingAuthor, setEditingAuthor] = useState(null);

    const imageInputRef = useRef(null);
    const editAuthorId = searchParams.get('edit');

    const roles = [
        { value: 'scholar', label: 'عالم' },
        { value: 'narrator', label: 'راوي' },
        { value: 'sheikh', label: 'شيخ' },
        { value: 'author', label: 'مؤلف' },
        { value: 'other', label: 'آخر' }
    ];

    useEffect(() => {
        if (editAuthorId && session?.access_token) {
            axios.get(`${API_URL}/api/authors/${editAuthorId}`, {
                headers: { Authorization: `Bearer ${session.access_token}` }
            })
                .then(response => {
                    const author = response.data;
                    setEditingAuthor(author);
                    setName(author.name);
                    setRole(author.role || 'scholar');
                    setBio(author.bio || '');
                    setSocialLife(author.social_life || '');
                    setAchievements(author.achievements || '');
                    setKeywords(author.keywords ? author.keywords.join(', ') : '');
                    setBirthDate(author.birth_date || '');
                    setDeathDate(author.death_date || '');
                    setBirthPlace(author.birth_place || '');
                    setResidencePlace(author.residence_place || '');
                    setExistingImageUrl(author.image_url);
                })
                .catch(error => {
                    toast.error("المؤلف المراد تعديله غير موجود");
                    router.push('/admin/authors');
                });
        }
    }, [editAuthorId, session, router]);

    const directUpload = async (file, bucket) => {
        if (!file || !(file instanceof File)) return null;
        const supabase = createSupabaseClient();
        const fileExt = file.name.split('.').pop();
        const fileName = `${bucket}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, file, { upsert: false });

            if (uploadError) throw new Error(`Supabase upload error: ${uploadError.message}`);

            const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            if (!urlData || !urlData.publicUrl) throw new Error('Failed to get public URL.');
            return `${urlData.publicUrl}?t=${Date.now()}`;
        } catch (error) {
            throw new Error(`Failed to upload: ${error.message}`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!session?.access_token) return;

        try {
            let imageUrl = existingImageUrl;
            if (image) {
                imageUrl = await directUpload(image, 'author-images');
            }

            const authorData = {
                name,
                role,
                bio,
                social_life: socialLife,
                achievements,
                keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
                birth_date: birthDate,
                death_date: deathDate,
                birth_place: birthPlace,
                residence_place: residencePlace,
                image_url: imageUrl
            };

            const url = editingAuthor ? `${API_URL}/api/authors/${editingAuthor.id}` : `${API_URL}/api/authors`;
            const method = editingAuthor ? 'patch' : 'post';

            await axios({
                method,
                url,
                data: authorData,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            toast.success(editingAuthor ? "تم تحديث المؤلف بنجاح!" : "تم إضافة المؤلف بنجاح!");
            router.push('/admin/authors');
        } catch (error) {
            console.error("Error submitting author:", error);
            toast.error(error.response?.data?.message || "فشل حفظ المؤلف.");
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
            <h1 className="admin-page-title">{editingAuthor ? "تعديل بيانات المؤلف" : "إضافة مؤلف جديد"}</h1>

            <div className="admin-form-container">
                <h2 className="admin-form-title">
                    {editingAuthor ? `تعديل: ${editingAuthor.name}` : "بيانات المؤلف الجديد"}
                </h2>

                <form onSubmit={handleSubmit}>
                    <div className="admin-form-group">
                        <label><FaUser style={{ marginLeft: '8px' }} /> اسم المؤلف</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="أدخل اسم المؤلف الكامل"
                        />
                    </div>

                    <div className="admin-form-group">
                        <label><FaBook style={{ marginLeft: '8px' }} /> التصنيف (الدور)</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="admin-form-group">
                            <label><FaHistory style={{ marginLeft: '8px' }} /> تاريخ الميلاد</label>
                            <input
                                type="text"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                placeholder="مثال: 1350 هـ / 1931 م"
                            />
                        </div>
                        <div className="admin-form-group">
                            <label><FaHistory style={{ marginLeft: '8px' }} /> تاريخ الوفاة</label>
                            <input
                                type="text"
                                value={deathDate}
                                onChange={(e) => setDeathDate(e.target.value)}
                                placeholder="مثال: 1420 هـ / 1999 م (اتركه فارغاً إذا كان حياً)"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="admin-form-group">
                            <label><FaTags style={{ marginLeft: '8px' }} /> مكان الولادة</label>
                            <input
                                type="text"
                                value={birthPlace}
                                onChange={(e) => setBirthPlace(e.target.value)}
                                placeholder="مثال: دمشق، سوريا"
                            />
                        </div>
                        <div className="admin-form-group">
                            <label><FaTags style={{ marginLeft: '8px' }} /> مكان الإقامة / الوفاة</label>
                            <input
                                type="text"
                                value={residencePlace}
                                onChange={(e) => setResidencePlace(e.target.value)}
                                placeholder="مثال: الرياض، السعودية"
                            />
                        </div>
                    </div>

                    <div className="admin-form-group">
                        <label><FaHistory style={{ marginLeft: '8px' }} /> السيرة الذاتية (العلمية)</label>
                        <textarea
                            rows="5"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="اكتب نبذة عن السيرة العلمية للمؤلف..."
                        ></textarea>
                    </div>

                    <div className="admin-form-group">
                        <label><FaUser style={{ marginLeft: '8px' }} /> الحياة الاجتماعية والنشأة</label>
                        <textarea
                            rows="5"
                            value={socialLife}
                            onChange={(e) => setSocialLife(e.target.value)}
                            placeholder="تحدث عن نشأته، أسرته، وحياته الشخصية..."
                        ></textarea>
                    </div>

                    <div className="admin-form-group">
                        <label><FaTrophy style={{ marginLeft: '8px' }} /> أبرز الإنجازات</label>
                        <textarea
                            rows="3"
                            value={achievements}
                            onChange={(e) => setAchievements(e.target.value)}
                            placeholder="اذكر أهم إنجازات المؤلف..."
                        ></textarea>
                    </div>

                    <div className="admin-form-group">
                        <label><FaTags style={{ marginLeft: '8px' }} /> الكلمات المفتاحية</label>
                        <input
                            type="text"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            placeholder="تاريخ, فقه, حديث... (افصل بينها بفاصلة)"
                        />
                    </div>

                    <div className="admin-form-group">
                        <label><FaImage style={{ marginLeft: '8px' }} /> صورة المؤلف</label>
                        {existingImageUrl && !image && (
                            <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                                <Image
                                    src={existingImageUrl}
                                    alt="Current"
                                    width={100}
                                    height={100}
                                    style={{ borderRadius: '50%', border: '2px solid var(--primary-color)' }}
                                />
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImage(e.target.files[0])}
                            ref={imageInputRef}
                            style={{ padding: '0.5rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button type="submit" className="admin-form-button">
                            {editingAuthor ? "حفظ التغييرات" : "إضافة المؤلف"}
                        </button>
                        <Link href="/admin/authors" className="admin-form-button cancel" style={{ textAlign: 'center' }}>
                            إلغاء
                        </Link>
                    </div>
                </form>
            </div>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <Link href="/admin/authors" className="admin-nav-link" style={{ maxWidth: '200px' }}>
                    <FaArrowRight style={{ marginLeft: '8px' }} /> العودة للقائمة
                </Link>
            </div>
        </div>
    );
};

const AdminAddAuthorPage = () => {
    return (
        <Suspense fallback={<div className="loading-spinner">جاري التحميل...</div>}>
            <AdminAddAuthorContent />
        </Suspense>
    );
};

export default AdminAddAuthorPage;
