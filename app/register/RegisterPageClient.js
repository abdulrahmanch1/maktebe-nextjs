'use client';
import React, { useContext, useState } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { toast } from 'react-toastify';
import { API_URL } from "@/constants";
import { AuthContext } from "@/contexts/AuthContext";
import Image from "next/image";
import { FaGoogle, FaUser, FaEnvelope, FaLock, FaArrowLeft } from 'react-icons/fa';
import './register.css';

const RegisterPageClient = () => {
  const { theme } = useContext(ThemeContext);
  const { loginWithGoogle } = useContext(AuthContext);
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const errors = {};
    if (!username) errors.username = 'اسم المستخدم مطلوب.';
    if (!email || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) errors.email = 'البريد الإلكتروني غير صالح.';
    if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      errors.password = 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير، حرف صغير، رقم، ورمز خاص.';
    }

    if (Object.keys(errors).length > 0) {
      Object.values(errors).forEach(error => toast.error(error));
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API_URL}/api/users/register`, {
        username,
        email,
        password,
      });
      toast.success("تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني لتأكيد حسابك.");
      router.push("/login");
    } catch (err) {
      console.error("Registration failed:", err);
      toast.error(err.response?.data?.message || "فشل التسجيل");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await loginWithGoogle();
  };

  return (
    <div className="register-page">
      <div className="register-container">
        {/* Left Side - Branding */}
        <div className="register-brand-side">
          <div className="brand-content">
            <div className="brand-logo">
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <Image
                  src="/icons/icon-192.png"
                  alt="دار القرّاء"
                  width={192}
                  height={192}
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </div>
            </div>
            <h1 className="brand-title">دار القرّاء</h1>
            <p className="brand-description">
              انضم إلى مجتمع القراء واستمتع بآلاف الكتب والمقالات المميزة
            </p>
            <div className="brand-features">
              <div className="feature-item">
                <div className="feature-icon">📚</div>
                <span>آلاف الكتب المجانية</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🎯</div>
                <span>توصيات مخصصة</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">💬</div>
                <span>مجتمع نشط</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="register-form-side">
          <div className="form-wrapper">
            <div className="form-header">
              <h2>إنشاء حساب جديد</h2>
              <p>ابدأ رحلتك في عالم القراءة</p>
            </div>

            <form onSubmit={handleSubmit} className="register-form">
              <div className={`input-group ${focusedField === 'username' ? 'focused' : ''}`}>
                <div className="input-icon">
                  <FaUser />
                </div>
                <input
                  type="text"
                  placeholder="اسم المستخدم"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  required
                />
              </div>

              <div className={`input-group ${focusedField === 'email' ? 'focused' : ''}`}>
                <div className="input-icon">
                  <FaEnvelope />
                </div>
                <input
                  type="email"
                  placeholder="البريد الإلكتروني"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                />
              </div>

              <div className={`input-group ${focusedField === 'password' ? 'focused' : ''}`}>
                <div className="input-icon">
                  <FaLock />
                </div>
                <input
                  type="password"
                  placeholder="كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  <>
                    <span>إنشاء حساب</span>
                    <FaArrowLeft />
                  </>
                )}
              </button>

              <div className="divider">
                <span>أو</span>
              </div>

              <button type="button" disabled={loading} className="google-btn" onClick={handleGoogleLogin}>
                <FaGoogle />
                <span>التسجيل عبر جوجل</span>
              </button>
            </form>

            <div className="form-footer">
              <p>
                لديك حساب بالفعل؟{' '}
                <Link href="/login">سجل دخولك</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPageClient;
