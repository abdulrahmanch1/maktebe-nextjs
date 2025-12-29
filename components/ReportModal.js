import React, { useState } from 'react';
import { toast } from 'react-toastify';

const ReportModal = ({ isOpen, onClose, onSubmit }) => {
    const [step, setStep] = useState(1); // 1: select type, 2: select reason/details
    const [reportType, setReportType] = useState(''); // 'problem' or 'complaint'
    const [selectedReason, setSelectedReason] = useState('');
    const [customDetails, setCustomDetails] = useState('');

    const problemReasons = [
        { value: 'image_not_showing', label: 'الصورة لا تظهر' },
        { value: 'pdf_error', label: 'ملف PDF لا يعمل' },
        { value: 'wrong_author', label: 'اسم الكاتب خاطئ' },
        { value: 'wrong_title', label: 'عنوان الكتاب خاطئ' },
        { value: 'copyright', label: 'هذا الكتاب عليه حقوق نشر' },
        { value: 'missing_pages', label: 'صفحات ناقصة' },
        { value: 'broken_link', label: 'رابط التحميل لا يعمل' },
        { value: 'other', label: 'أخرى' },
    ];

    const complaintReasons = [
        { value: 'inappropriate', label: 'محتوى غير لائق' },
        { value: 'spam', label: 'محتوى إعلاني/مزعج' },
        { value: 'wrong_category', label: 'تصنيف خاطئ' },
        { value: 'duplicate', label: 'كتاب مكرر' },
        { value: 'other', label: 'أخرى' },
    ];

    const handleReasonSelect = (reason) => {
        setSelectedReason(reason);
        if (reason !== 'other') {
            setCustomDetails('');
        }
    };

    const handleSubmit = () => {
        if (!selectedReason) {
            toast.error('الرجاء اختيار سبب البلاغ');
            return;
        }
        if (selectedReason === 'other' && !customDetails.trim()) {
            toast.error('الرجاء كتابة تفاصيل المشكلة');
            return;
        }

        const reasons = reportType === 'problem' ? problemReasons : complaintReasons;
        const reasonLabel = reasons.find(r => r.value === selectedReason)?.label || selectedReason;

        onSubmit(selectedReason, customDetails || reasonLabel);

        // Reset state
        setStep(1);
        setReportType('');
        setSelectedReason('');
        setCustomDetails('');
    };

    const handleClose = () => {
        setStep(1);
        setReportType('');
        setSelectedReason('');
        setCustomDetails('');
        onClose();
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
            setSelectedReason('');
            setCustomDetails('');
        }
    };

    if (!isOpen) return null;

    const currentReasons = reportType === 'problem' ? problemReasons : complaintReasons;

    return (
        <div className="report-modal-overlay" onClick={handleClose}>
            <div className="report-modal-sheet" onClick={e => e.stopPropagation()}>
                <div className="report-modal-handle"></div>

                <div className="report-modal-header">
                    <h3 className="report-modal-title">
                        {step === 1 ? 'الإبلاغ عن الكتاب' : reportType === 'problem' ? 'ما هي المشكلة؟' : 'ما هي الشكوى؟'}
                    </h3>
                    <button onClick={handleClose} className="report-close-button">✕</button>
                </div>

                <div className="report-modal-content">
                    {step === 1 ? (
                        <div className="report-type-selection">
                            <button
                                className="report-type-card"
                                onClick={() => { setReportType('problem'); setStep(2); }}
                            >
                                <span className="report-type-title">مشكلة تقنية</span>
                                <span className="report-type-desc">خطأ في الملف، الصورة، أو المعلومات</span>
                            </button>

                            <button
                                className="report-type-card"
                                onClick={() => { setReportType('complaint'); setStep(2); }}
                            >
                                <span className="report-type-title">شكوى</span>
                                <span className="report-type-desc">محتوى غير لائق أو مخالف</span>
                            </button>
                        </div>
                    ) : (
                        <div className="report-reasons-selection">
                            <div className="report-reasons-grid">
                                {currentReasons.map((reason) => (
                                    <button
                                        key={reason.value}
                                        className={`report-reason-card ${selectedReason === reason.value ? 'selected' : ''}`}
                                        onClick={() => handleReasonSelect(reason.value)}
                                    >
                                        <span className="report-reason-label">{reason.label}</span>
                                    </button>
                                ))}
                            </div>

                            {selectedReason === 'other' && (
                                <div className="report-custom-input">
                                    <label>تفاصيل المشكلة:</label>
                                    <textarea
                                        value={customDetails}
                                        onChange={(e) => setCustomDetails(e.target.value)}
                                        placeholder="اشرح المشكلة بالتفصيل..."
                                        rows="4"
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                className="report-submit-button"
                                disabled={!selectedReason}
                            >
                                إرسال البلاغ
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportModal;
