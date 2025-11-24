'use client';
import React, { useEffect, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeContext } from '@/contexts/ThemeContext';
import { createClient } from '@/utils/supabase/client';
import './VerifyEmailPage.css';

const VerifyEmailPageClient = ({ token }) => {
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
        const supabase = createClient();
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email',
        });

        if (verifyError) {
          throw verifyError;
        }

        setMessage('تم تأكيد بريدك الإلكتروني بنجاح!');
        setLoading(false);
        setTimeout(() => router.push('/login'), 1500);
      } catch (err) {
        console.error('Email verification failed:', err);
        setError(err);
        setMessage(err.message || 'فشل تأكيد البريد الإلكتروني.');
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

export default VerifyEmailPageClient;
