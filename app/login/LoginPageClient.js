'use client';
import React, { useContext, useState } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";
import { AuthContext } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import './AuthPage.css';
import { FaGoogle } from 'react-icons/fa';

const LoginPageClient = () => {
  const { theme } = useContext(ThemeContext);
  const { login, loginWithGoogle } = useContext(AuthContext);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="auth-container" style={{ backgroundColor: theme.background, color: theme.primary }}>
      <h1 className="auth-title" style={{ color: theme.primary }}>تسجيل الدخول</h1>
      <form onSubmit={handleSubmit} className="auth-form" style={{ backgroundColor: theme.secondary, color: theme.primary }}>
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
        <button type="submit" disabled={loading} className="themed-button-accent">
          {loading ? 'جاري الدخول...' : 'دخول'}
        </button>
        <div className="auth-divider">
          <span style={{ backgroundColor: theme.secondary }}>أو</span>
        </div>
        <button type="button" disabled={loading} className="google-login-button" onClick={handleGoogleLogin}>
          <FaGoogle style={{ marginLeft: '10px' }} />
          تسجيل الدخول عبر جوجل
        </button>
      </form>
    </div>
  );
};

export default LoginPageClient;
