'use client';
import React, { useContext, useState, useRef, useEffect } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";
import { AuthContext } from "@/contexts/AuthContext";
import axios from "axios";
import { useRouter } from "next/navigation";
import { themes } from "@/data/themes";
import { toast } from 'react-toastify';
import { API_URL } from "@/constants";
import Image from "next/image";
import "./SettingsPage.css";

const SettingsPage = () => {
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
    <div className="settings-container">
      <aside className="settings-sidebar">
        {sidebarItems.map(item => (
          <div
            key={item.key}
            className={`settings-sidebar-item ${activeSection === item.key ? "active" : ""}`}
            onClick={() => handleSectionChange(item.key)}
          >
            <span>{item.icon}</span>
            <span className="settings-sidebar-text">{item.text}</span>
          </div>
        ))}
      </aside>

      <div className="settings-mobile-header">
        <button className="settings-mobile-button" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
          <span>⚙️</span>
          <span>الملف الشخصي</span>
        </button>
        {isDropdownOpen && (
          <div className="settings-dropdown">
            {sidebarItems.map(item => (
              <div
                key={item.key}
                className={`settings-dropdown-item ${activeSection === item.key ? "active" : ""}`}
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
      <h2>تواصل معنا</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>الموضوع:</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="موضوع الرسالة"
            required
          />
        </div>
        <div className="form-group">
          <label>رسالتك:</label>
          <textarea
            rows="5"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب رسالتك هنا..."
            required
          ></textarea>
        </div>
        <button type="submit" className="button">
          إرسال الرسالة
        </button>
      </form>
    </div>
  );
};

const AccountSettings = () => {
  const { user, session, setUser } = useContext(AuthContext);
  const [newUsername, setNewUsername] = useState(user ? user.username : "");
  const fileInputRef = useRef(null);

  const supabaseLoader = ({ src }) => {
    return src;
  };

  useEffect(() => {
    if (user) {
      setNewUsername(user.username);
    }
  }, [user]);

  const handleImageUpload = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/api/upload-profile-picture", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUser({ ...user, profilePicture: res.data.newUrl });
      toast.success("تم تحديث الصورة بنجاح!");
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message || "فشل تحديث الصورة.");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleUsernameUpdate = async () => {
    if (!newUsername.trim()) {
      toast.error("اسم المستخدم لا يمكن أن يكون فارغًا.");
      return;
    }
    try {
      const res = await axios.patch(`${API_URL}/api/users/${user.id}`, { username: newUsername }, { headers: { Authorization: `Bearer ${session.access_token}` } });
      setUser({ ...user, username: res.data.username });
      toast.success("تم تحديث اسم المستخدم بنجاح!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "فشل تحديث اسم المستخدم.");
    }
  };

  return (
    <div className="settings-section">
      <h2>إعدادات الحساب</h2>
      <div className="profile-info-section">
        <Image
          loader={supabaseLoader}
          src={user?.profilePicture || '/imgs/user.jpg'}
          alt="صورة الملف الشخصي"
          width={100}
          height={100}
          className="profile-picture"
          onError={(e) => { e.target.onerror = null; e.target.src = '/imgs/user.jpg'; }}
        />
        <span className="profile-email">{user ? user.email : "غير متاح"}</span>
        <input type="file" onChange={handleImageChange} ref={fileInputRef} style={{ display: 'none' }} />
        <button className="button change-picture-button" onClick={() => fileInputRef.current.click()}>
          تغيير الصورة
        </button>
      </div>
      <div className="form-group">
        <label>اسم المستخدم</label>
        <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
        <button className="button" onClick={handleUsernameUpdate}>
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
      <h2>إعدادات المظهر</h2>
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
  const { user, session, logout } = useContext(AuthContext);
  const router = useRouter();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleChangePassword = async () => {
    const errors = {};
    if (!oldPassword) errors.oldPassword = 'كلمة المرور القديمة مطلوبة.';
    if (!newPassword || newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) errors.password = 'يجب أن تكون كلمة المرور 8 أحرف على الأقل وتحتوي على حرف كبير وحرف صغير ورقم ورمز خاص.';
    if (newPassword !== confirmNewPassword) errors.confirmNewPassword = "كلمة المرور الجديدة وتأكيدها غير متطابقين.";

    if (Object.keys(errors).length > 0) {
      Object.values(errors).forEach(error => toast.error(error));
      return;
    }

    try {
      await axios.patch(`${API_URL}/api/users/${user.id}`, {
        oldPassword,
        password: newPassword,
      }, {
        headers: { Authorization: `Bearer ${session.access_token}` },
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
      await axios.delete(`${API_URL}/api/users/${user.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
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
      <h2>إعدادات الأمان</h2>
      <div className="form-group">
        <label>كلمة المرور القديمة</label>
        <input
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          placeholder="أدخل كلمة المرور القديمة"
        />
        <label>كلمة المرور الجديدة</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="أدخل كلمة المرور الجديدة"
        />
        <label>تأكيد كلمة المرور الجديدة</label>
        <input
          type="password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          placeholder="أعد إدخال كلمة المرور الجديدة"
        />
        <button className="button" onClick={handleChangePassword}>
          تغيير كلمة المرور
        </button>
      </div>
      <div className="form-group">
        <label>حذف الحساب</label>
        <button className="button button-danger" onClick={handleDeleteAccount}>
          حذف الحساب نهائيًا
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
