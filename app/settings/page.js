'use client';
import React, { useContext, useState, useRef, useEffect } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";
import { AuthContext } from "@/contexts/AuthContext";
import axios from "axios";
import { useRouter } from "next/navigation";
import { themes } from "@/data/themes";
import { toast } from 'react-toastify';
import { upload } from '@vercel/blob/client';
import { API_URL } from "@/constants";
import "./SettingsPage.css";

const SettingsPage = () => {
  const { theme } = useContext(ThemeContext);
  const { isLoggedIn } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState("account");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router]);

  const handleSectionChange = (section) => {
    setActiveSection(section);
    setIsDropdownOpen(false);
  };

  const renderSection = () => {
    switch (activeSection) {
      case "account":
        return <AccountSettings />;
      case "appearance":
        return <AppearanceSettings />;
      case "security":
        return <SecuritySettings />;
      case "contact":
        return <ContactUsSection />;
      default:
        return <AccountSettings />;
    }
  };

  const sidebarItems = [
    { key: "account", icon: "👤", text: "إعدادات الحساب" },
    { key: "appearance", icon: "🎨", text: "المظهر" },
    { key: "security", icon: "🔒", text: "الأمان" },
    { key: "contact", icon: "✉️", text: "تواصل معنا" },
  ];

  if (!isLoggedIn) {
    return null; // Or a loading spinner
  }

  return (
    <div className="settings-container" style={{ backgroundColor: theme.background, color: theme.primary }}>
      <aside className="settings-sidebar" style={{ borderColor: theme.secondary, backgroundColor: theme.secondary }}>
        {sidebarItems.map(item => (
          <div
            key={item.key}
            className={`settings-sidebar-item ${activeSection === item.key ? "active" : ""}`}
            style={{
              color: activeSection === item.key ? theme.background : theme.primary,
              backgroundColor: activeSection === item.key ? theme.primary : "transparent",
            }}
            onClick={() => handleSectionChange(item.key)}
          >
            <span>{item.icon}</span>
            <span className="settings-sidebar-text">{item.text}</span>
          </div>
        ))}
      </aside>

      <div className="settings-mobile-header">
        <button className="settings-mobile-button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ backgroundColor: theme.secondary, color: theme.primary, borderColor: theme.accent }}>
          <span>⚙️</span>
          <span>الملف الشخصي</span>
        </button>
        {isDropdownOpen && (
          <div className="settings-dropdown" style={{ backgroundColor: theme.secondary, borderColor: theme.accent }}>
            {sidebarItems.map(item => (
              <div
                key={item.key}
                className="settings-dropdown-item"
                style={{
                  color: activeSection === item.key ? theme.background : theme.primary,
                  backgroundColor: activeSection === item.key ? theme.primary : "transparent",
                  borderBottom: `1px solid ${theme.accent}`
                }}
                onClick={() => handleSectionChange(item.key)}
              >
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <main className="settings-content">{renderSection()}</main>
    </div>
  );
};

const ContactUsSection = () => {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const email = user?.email || "guest@example.com";
      const username = user?.username || "Guest";

      await axios.post(`${API_URL}/api/contact`, {
        subject,
        message,
        email,
        username,
      });
      toast.success("تم إرسال رسالتك بنجاح!");
      setSubject("");
      setMessage("");
    } catch (error) {
      console.error("Error sending contact message:", error);
      toast.error(error.response?.data?.message || "فشل إرسال الرسالة.");
    }
  };

  return (
    <div className="settings-section">
      <h2 style={{ borderColor: theme.accent, color: theme.primary }}>تواصل معنا</h2>
      <form onSubmit={handleSubmit} style={{ backgroundColor: theme.background, padding: "20px", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)" }}>
        <div className="form-group">
          <label style={{ color: theme.primary }}>الموضوع:</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="موضوع الرسالة"
            required
            style={{ borderColor: theme.secondary, backgroundColor: theme.background, color: theme.primary }}
          />
        </div>
        <div className="form-group">
          <label style={{ color: theme.primary }}>رسالتك:</label>
          <textarea
            rows="5"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب رسالتك هنا..."
            required
            style={{ borderColor: theme.secondary, backgroundColor: theme.background, color: theme.primary }}
          ></textarea>
        </div>
        <button type="submit" className="button" style={{ backgroundColor: theme.accent, color: theme.primary }}>
          إرسال الرسالة
        </button>
      </form>
    </div>
  );
};

const AccountSettings = () => {
  const { theme } = useContext(ThemeContext);
  const { user, token, setUser } = useContext(AuthContext);
  const [newUsername, setNewUsername] = useState(user ? user.username : "");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setNewUsername(user.username);
    }
  }, [user]);

  const handleImageUpload = async (file) => {
    if (!file) return;

    try {
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload-blob',
      });

      const profilePictureUrl = blob.url;

      const res = await axios.patch(`${API_URL}/api/users/${user._id}/profile-picture`, {
        profilePicture: profilePictureUrl,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser({ ...user, profilePicture: res.data.profilePicture });
      toast.success("تم تحديث الصورة بنجاح!");
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      toast.error(err.message || "فشل تحديث الصورة.");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleUsernameUpdate = async () => {
    try {
      const res = await axios.patch(`${API_URL}/api/users/${user._id}`, { username: newUsername }, { headers: { Authorization: `Bearer ${token}` } });
      setUser({ ...user, username: res.data.username });
      toast.success("تم تحديث اسم المستخدم بنجاح!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="settings-section">
      <h2 style={{ borderColor: theme.accent, color: theme.primary }}>إعدادات الحساب</h2>
      <div className="profile-info-section">
        <img
          src={user && user.profilePicture && (user.profilePicture !== 'Untitled.jpg' && user.profilePicture !== 'user.jpg') ? user.profilePicture : '/imgs/user.jpg'}
          alt="صورة الملف الشخصي"
          className="profile-picture"
          style={{ borderColor: theme.accent }}
          onError={(e) => { e.target.onerror = null; e.target.src = '/imgs/user.jpg'; }}
        />
        <span className="profile-email" style={{ color: theme.primary }}>{user ? user.email : "غير متاح"}</span>
        <input type="file" onChange={handleImageChange} ref={fileInputRef} style={{ display: 'none' }} />
        <button className="button change-picture-button" onClick={() => fileInputRef.current.click()} style={{ backgroundColor: theme.accent, color: theme.primary }}>
          تغيير الصورة
        </button>
      </div>
      <div className="form-group username-form-group">
        <label>اسم المستخدم</label>
        <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} style={{ borderColor: theme.secondary, backgroundColor: theme.background, color: theme.primary }} />
        <button className="button" onClick={handleUsernameUpdate} style={{ backgroundColor: theme.accent, color: theme.primary }}>
          تحديث اسم المستخدم
        </button>
      </div>
    </div>
  );
};

const AppearanceSettings = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  return (
    <div className="settings-section">
      <h2 style={{ borderColor: theme.accent, color: theme.primary }}>إعدادات المظهر</h2>
      <div className="form-group">
        <label>اختر ثيمًا:</label>
        <div className="theme-options">
          {Object.keys(themes).map((themeName) => (
            <div
              key={themeName}
              className={`theme-option ${theme.primary === themes[themeName].primary ? "active" : ""}`}
              style={{ backgroundColor: themes[themeName].background, color: themes[themeName].primary, boxShadow: theme.primary === themes[themeName].primary ? `0 0 15px ${themes[themeName].accent}` : '' }}
              onClick={() => toggleTheme(themeName)}
            >
              {themes[themeName].name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SecuritySettings = () => {
  const { theme } = useContext(ThemeContext);
  const { user, token, logout } = useContext(AuthContext);
  const router = useRouter();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      toast.error("الرجاء تعبئة جميع حقول كلمة المرور.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("كلمة المرور الجديدة وتأكيدها غير متطابقين.");
      return;
    }

    try {
      await axios.patch(`${API_URL}/api/users/${user._id}`, {
        oldPassword,
        password: newPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("تم تغيير كلمة المرور بنجاح!");
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      console.error("Error changing password:", err);
      toast.error(err.response?.data?.message || "فشل تغيير كلمة المرور.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("هل أنت متأكد أنك تريد حذف حسابك نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.")) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/api/users/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("تم حذف حسابك بنجاح.");
      logout();
      router.push("/");
    } catch (err) {
      console.error("Error deleting account:", err);
      toast.error(err.response?.data?.message || "فشل حذف الحساب.");
    }
  };

  return (
    <div className="settings-section">
      <h2 style={{ borderColor: theme.accent, color: theme.primary }}>إعدادات الأمان</h2>
      <div className="form-group">
        <label>كلمة المرور القديمة</label>
        <input
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          placeholder="أدخل كلمة المرور القديمة"
          style={{ borderColor: theme.secondary, backgroundColor: theme.background, color: theme.primary }}
        />
        <label>كلمة المرور الجديدة</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="أدخل كلمة المرور الجديدة"
          style={{ borderColor: theme.secondary, backgroundColor: theme.background, color: theme.primary }}
        />
        <label>تأكيد كلمة المرور الجديدة</label>
        <input
          type="password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          placeholder="أعد إدخال كلمة المرور الجديدة"
          style={{ borderColor: theme.secondary, backgroundColor: theme.background, color: theme.primary }}
        />
        <button className="button" onClick={handleChangePassword} style={{ backgroundColor: theme.accent, color: theme.primary }}>
          تغيير كلمة المرور
        </button>
      </div>
      <div className="form-group">
        <label>حذف الحساب</label>
        <button className="button button-danger" onClick={handleDeleteAccount} style={{ backgroundColor: "#e74c3c" }}>
          حذف الحساب نهائيًا
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
