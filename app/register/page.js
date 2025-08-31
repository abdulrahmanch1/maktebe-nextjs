'use client';
import React, { useContext, useState } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from 'react-toastify';
import { API_URL } from "@/constants";
import './AuthPage.css';

import { AuthContext } from "@/contexts/AuthContext";
import { FaGoogle } from 'react-icons/fa';

const RegisterPage = () => {
  const { theme } = useContext(ThemeContext);
  const { loginWithGoogle } = useContext(AuthContext);
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const errors = {};
    if (!username) errors.username = 'اسم المستخدم مطلوب.';
    if (!email || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) errors.email = 'البريد الإلكتروني غير صالح.';
    if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) errors.password = 'كلمة المرور لا تفي بمتطلبات الأمان.';

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
    // No need to set loading to false here, as the page will redirect
  };

  return (
    <div className="auth-container" style={{ backgroundColor: theme.background, color: theme.primary }}>
      <h1 className="auth-title" style={{ color: theme.primary }}>إنشاء حساب</h1>
      <form onSubmit={handleSubmit} className="auth-form" style={{ backgroundColor: theme.secondary, color: theme.primary }}>
        <label>اسم المستخدم:</label>
        <input
          type="text"
          placeholder="اسم المستخدم"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ backgroundColor: theme.background, color: theme.primary, borderColor: theme.accent }}
        />
        <label>البريد الإلكتروني:</label>
        <input
          type="email"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ backgroundColor: theme.background, color: theme.primary, borderColor: theme.accent }}
        />
        <label>كلمة المرور:</label>
        <input
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ backgroundColor: theme.background, color: theme.primary, borderColor: theme.accent }}
        />
        <button type="submit" disabled={loading} className="themed-button-accent">{loading ? 'جاري الإنشاء...' : 'إنشاء'}</button>
        <div className="auth-divider">
          <span style={{ backgroundColor: theme.secondary }}>أو</span>
        </div>
        <button type="button" disabled={loading} className="google-login-button" onClick={handleGoogleLogin}>
          <FaGoogle style={{ marginLeft: '10px' }} />
          إنشاء حساب عبر جوجل
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;