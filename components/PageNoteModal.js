'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-toastify';
import { FaStickyNote, FaTrash, FaSave, FaTimes } from 'react-icons/fa';

const PageNoteModal = ({ isOpen, onClose, bookId, pageNumber, initialNote = '', onSave }) => {
    const [note, setNote] = useState(initialNote);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        setNote(initialNote);
    }, [initialNote, isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!note.trim()) {
            handleDelete();
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('يجب تسجيل الدخول لإضافة ملاحظة');
                return;
            }

            const { data: existing } = await supabase
                .from('page_notes')
                .select('id')
                .eq('book_id', bookId)
                .eq('page_number', pageNumber)
                .eq('user_id', user.id)
                .single();

            let error;
            if (existing) {
                const { error: updateError } = await supabase
                    .from('page_notes')
                    .update({ note, updated_at: new Date() })
                    .eq('id', existing.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('page_notes')
                    .insert([{ book_id: bookId, user_id: user.id, page_number: pageNumber, note }]);
                error = insertError;
            }

            if (error) throw error;

            toast.success('تم حفظ ملاحظة الصفحة');
            if (onSave) onSave(note);
            onClose();
        } catch (err) {
            console.error('Error saving page note:', err);
            toast.error('حدث خطأ أثناء حفظ الملاحظة');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!initialNote) {
            onClose();
            return;
        }

        if (!confirm('هل أنت متأكد من حذف ملاحظة هذه الصفحة؟')) return;

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase
                .from('page_notes')
                .delete()
                .eq('book_id', bookId)
                .eq('page_number', pageNumber)
                .eq('user_id', user.id);

            if (error) throw error;

            toast.info('تم حذف الملاحظة');
            if (onSave) onSave('');
            setNote('');
            onClose();
        } catch (err) {
            console.error('Error deleting page note:', err);
            toast.error('فشل حذف الملاحظة');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: 'var(--background-color)',
                color: 'var(--text-color)',
                padding: '24px', borderRadius: '12px',
                width: '90%', maxWidth: '400px',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>

                <button onClick={onClose} style={{
                    position: 'absolute', top: '16px', left: '16px',
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)'
                }}><FaTimes /></button>

                <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaStickyNote color="var(--accent-color)" /> ملاحظة صفحة {pageNumber}
                </h3>

                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="اكتب ملاحظة لهذه الصفحة..."
                    style={{
                        width: '100%', height: '120px', padding: '12px',
                        borderRadius: '8px', border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--secondary-color)', color: 'var(--text-color)',
                        marginTop: '16px', resize: 'vertical', fontFamily: 'inherit'
                    }}
                    disabled={loading}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                    {initialNote && (
                        <button onClick={handleDelete} className="danger-btn" disabled={loading} style={{
                            background: 'none', border: '1px solid #ef4444', color: '#ef4444',
                            padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                            <FaTrash /> حذف
                        </button>
                    )}
                    <button onClick={handleSave} className="primary-btn" disabled={loading} style={{
                        backgroundColor: 'var(--accent-color)', color: 'white', border: 'none',
                        padding: '8px 24px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                        {loading ? '...' : <><FaSave /> حفظ</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PageNoteModal;
