'use client';
import React, { useContext, useState } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";
import { AuthContext } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FaGoogle, FaEnvelope, FaLock, FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa';
import './login.css';

const LoginPageClient = () => {
  const { theme } = useContext(ThemeContext);
  const { login, loginWithGoogle } = useContext(AuthContext);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(email, password);
    if (success) {
      router.push("/");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await loginWithGoogle();
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Side - Branding */}
        <div className="login-brand-side">
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
            <h1 className="brand-title">مرحباً بعودتك</h1>
            <p className="brand-description">
              سجل دخولك للوصول إلى مكتبتك الشخصية ومتابعة قراءاتك
            </p>
            <div className="brand-features">
              <div className="feature-item">
                <div className="feature-icon">📖</div>
                <span>استكمل قراءاتك</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">⭐</div>
                <span>مفضلاتك بانتظارك</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🎯</div>
                <span>توصيات جديدة</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="login-form-side">
          <div className="form-wrapper">
            <div className="form-header">
              <h2>تسجيل الدخول</h2>
              <p>أدخل بياناتك للمتابعة</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className={`input-group ${focusedField === 'email' ? 'focused' : ''}`}>
                <div className="input-icon">
                  <FaEnvelope />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="البريد الإلكتروني"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className={`input-group ${focusedField === 'password' ? 'focused' : ''}`}>
                <div className="input-icon">
                  <FaLock />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  <>
                    <span>تسجيل الدخول</span>
                    <FaArrowLeft />
                  </>
                )}
              </button>

              <div className="divider">
                <span>أو</span>
              </div>

              <button type="button" disabled={loading} className="google-btn" onClick={handleGoogleLogin}>
                <FaGoogle />
                <span>الدخول عبر جوجل</span>
              </button>
            </form>

            <div className="form-footer">
              <p>
                ليس لديك حساب؟{' '}
                <Link href="/register">أنشئ حساباً الآن</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPageClient;
