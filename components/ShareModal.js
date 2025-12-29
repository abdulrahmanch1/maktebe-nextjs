import React from 'react';
import { FaWhatsapp, FaFacebook, FaTwitter, FaTelegram, FaCopy } from 'react-icons/fa';
import { toast } from 'react-toastify';

const ShareModal = ({ isOpen, onClose, bookTitle, url }) => {
    if (!isOpen) return null;

    const shareLinks = [
        { name: 'واتساب', icon: <FaWhatsapp />, url: `https://wa.me/?text=${encodeURIComponent(`اقرأ كتاب ${bookTitle} على دار القرّاء: ${url}`)}`, color: '#25D366' },
        { name: 'فيسبوك', icon: <FaFacebook />, url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, color: '#1877F2' },
        { name: 'تويتر', icon: <FaTwitter />, url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`اقرأ كتاب ${bookTitle}`)}&url=${encodeURIComponent(url)}`, color: '#1DA1F2' },
        { name: 'تيليجرام', icon: <FaTelegram />, url: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`اقرأ كتاب ${bookTitle}`)}`, color: '#0088cc' },
    ];

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        toast.success('تم نسخ الرابط!');
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content share-modal-content" onClick={e => e.stopPropagation()}>
                <h3>مشاركة الكتاب</h3>
                <div className="share-options-grid">
                    {shareLinks.map((link) => (
                        <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="share-option-item" style={{ color: link.color }}>
                            <span className="share-icon">{link.icon}</span>
                            <span className="share-name">{link.name}</span>
                        </a>
                    ))}
                    <button onClick={handleCopy} className="share-option-item copy-option">
                        <span className="share-icon"><FaCopy /></span>
                        <span className="share-name">نسخ الرابط</span>
                    </button>
                </div>
                <button onClick={onClose} className="button secondary full-width-button" style={{ marginTop: '15px' }}>إغلاق</button>
            </div>
        </div>
    );
};

export default ShareModal;
