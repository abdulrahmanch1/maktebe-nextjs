'use client';
import React, { useEffect, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeContext } from '@/contexts/ThemeContext';
import { API_URL } from "@/constants";
import axios from 'axios';
import './VerifyEmailPage.css';

const VerifyEmailPage = ({ params }) => {
  const { token } = params;
  const router = useRouter();
  const { theme } = useContext(ThemeContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('جاري تأكيد بريدك الإلكتروني...');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setMessage('رمز التحقق مفقود.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/users/verify-email/${token}`);
        setMessage(response.data.message);
        setLoading(false);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (err) {
        setError(err);
        setMessage(err.response?.data?.message || 'فشل تأكيد البريد الإلكتروني.');
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div
      className="verify-email-container"
      style={{
        backgroundColor: theme.background,
        color: theme.primary,
      }}
    >
      <h1 className="verify-email-message" style={{ color: error ? 'red' : theme.accent }}>{message}</h1>
      {!error && !loading && <p className="verify-email-redirect-message" style={{ color: theme.primary }}>سيتم توجيهك إلى صفحة تسجيل الدخول قريبًا...</p>}
      {error && <a href="/register" className="verify-email-link" style={{ color: theme.accent }}>إعادة التسجيل</a>}
    </div>
  );
};

export default VerifyEmailPage;
