'use client';
import React, { useContext, useState } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";
import { AuthContext } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import './AuthPage.css';

const LoginPage = () => {
  const { theme } = useContext(ThemeContext);
  const { login } = useContext(AuthContext);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      router.push("/");
    }
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
        <button type="submit" style={{ backgroundColor: theme.accent, color: theme.primary }}>دخول</button>
      </form>
    </div>
  );
};

export default LoginPage;
