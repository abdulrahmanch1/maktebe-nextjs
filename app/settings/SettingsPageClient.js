'use client';
import React, { useContext, useState, useRef, useEffect, useCallback } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";
import { AuthContext } from "@/contexts/AuthContext";
import axios from "axios";
import { useRouter } from "next/navigation";
import { themes } from "@/data/themes";
import { toast } from 'react-toastify';
import { API_URL } from "@/constants";
import Image from "next/image";
import { FaUser, FaPalette, FaLock, FaEnvelope, FaChevronLeft, FaTrash } from 'react-icons/fa';
import "./SettingsPage.css";
import { ChatContainer, MessageInput } from '@/components/ChatComponents';

const SettingsPage = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState("account");
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router]);

  const handleSectionChange = (section) => {
    setActiveSection(section);
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
    { key: "account", icon: <FaUser />, text: "إعدادات الحساب" },
    { key: "appearance", icon: <FaPalette />, text: "المظهر" },
    { key: "security", icon: <FaLock />, text: "الأمان" },
    { key: "contact", icon: <FaEnvelope />, text: "الرسائل" },
  ];

  if (!isLoggedIn) {
    return null; // Or a loading spinner
  }

  return (
    <div className="settings-container">
      <aside className="settings-sidebar">
        <div className="settings-sidebar-header">
          <h3>الإعدادات</h3>
        </div>
        <div className="settings-sidebar-menu">
          {sidebarItems.map(item => (
            <div
              key={item.key}
              className={`settings-sidebar-item ${activeSection === item.key ? "active" : ""}`}
              onClick={() => handleSectionChange(item.key)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="settings-sidebar-text">{item.text}</span>
              {activeSection === item.key && <FaChevronLeft className="active-indicator" />}
            </div>
          ))}
        </div>
      </aside>

      <div className="settings-mobile-tabs">
        {sidebarItems.map(item => (
          <div
            key={item.key}
            className={`settings-mobile-tab ${activeSection === item.key ? "active" : ""}`}
            onClick={() => handleSectionChange(item.key)}
          >
            <span className="tab-icon">{item.icon}</span>
            <span className="tab-text">{item.text}</span>
          </div>
        ))}
      </div>

      <main className="settings-content">{renderSection()}</main>
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
    if (newUsername.length > 15) {
      toast.error("اسم المستخدم يجب ألا يتجاوز 15 حرفاً.");
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

  const handleRemovePicture = async () => {
    if (!window.confirm("هل أنت متأكد من حذف الصورة الشخصية؟")) return;
    try {
      // Assuming an API endpoint or logic exists, otherwise just reset state for now
      // await axios.delete("/api/upload-profile-picture"); 
      setUser({ ...user, profilePicture: null });
      toast.success("تم حذف الصورة بنجاح");
    } catch (err) {
      toast.error("فشل حذف الصورة");
    }
  };

  return (
    <div className="settings-section">
      <h2>إعدادات الحساب</h2>
      <div className="profile-info-section">
        <div className="profile-picture-container">
          <Image
            loader={supabaseLoader}
            src={user?.profilePicture || '/imgs/user.jpg'}
            alt="صورة الملف الشخصي"
            width={140}
            height={140}
            className="profile-picture"
            unoptimized={!!user?.profilePicture}
            onError={(e) => { e.target.onerror = null; e.target.src = '/imgs/user.jpg'; }}
          />
        </div>
        <span className="profile-email">{user ? user.email : "غير متاح"}</span>

        <div className="profile-actions">
          <input type="file" onChange={handleImageChange} ref={fileInputRef} style={{ display: 'none' }} />
          <button className="button change-picture-button" onClick={() => fileInputRef.current.click()}>
            تغيير الصورة
          </button>
          {user?.profilePicture && (
            <button className="button remove-picture-button" onClick={handleRemovePicture} title="إزالة الصورة">
              <FaTrash />
            </button>
          )}
        </div>
      </div>
      <div className="form-group">
        <label>اسم المستخدم</label>
        <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} maxLength={15} />
        <button className="button" onClick={handleUsernameUpdate}>
          تحديث اسم المستخدم
        </button>
      </div>
    </div>
  );
};

const ContactUsSection = () => {
  const { user, session, isLoggedIn } = useContext(AuthContext);
  const [subject, setSubject] = useState("");
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const fetchThreads = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoadingThreads(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/messages/threads`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      setThreads(Array.isArray(data) ? data : []);

      // Auto-select first thread if exists
      if (data && data.length > 0 && !selectedThread) {
        setSelectedThread(data[0]);
      }
    } catch (err) {
      console.error('Failed to load threads', err);
    } finally {
      setLoadingThreads(false);
    }
  }, [isLoggedIn, session?.access_token, selectedThread]);

  const fetchMessages = useCallback(async (threadId, silent = false) => {
    if (!threadId) return;
    if (!silent) setLoadingMessages(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/messages/threads/${threadId}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      setMessages(data.thread_messages || []);
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchThreads();
    }
  }, [isLoggedIn, user, fetchThreads]);

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread.id);
    }
  }, [selectedThread, fetchMessages]);

  // Auto-refresh messages every 3 seconds to get new admin replies
  useEffect(() => {
    if (!selectedThread) return;

    const interval = setInterval(() => {
      fetchMessages(selectedThread.id, true); // silent refresh
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [selectedThread, fetchMessages]);

  const handleSendMessage = async (message) => {
    try {
      // If no thread exists, create one first
      if (!selectedThread) {
        const { data } = await axios.post(
          `${API_URL}/api/messages/threads`,
          { subject: 'محادثة دعم', message },
          { headers: { Authorization: `Bearer ${session?.access_token}` } }
        );

        // Set the new thread and its messages directly from response
        setSelectedThread(data.thread);
        setMessages(data.thread.thread_messages || []);

        // Refresh threads list to show the new thread
        setThreads(prev => [data.thread, ...prev]);
        return;
      }

      // Optimistic Update: Show message immediately
      const tempId = `temp-${Date.now()}`;
      const timestamp = new Date().toISOString();
      const optimisticMessage = {
        id: tempId,
        message: message,
        sender_type: 'user',
        created_at: timestamp,
        is_optimistic: true
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      // Send message to existing thread
      const { data } = await axios.post(
        `${API_URL}/api/messages/threads/${selectedThread.id}/messages`,
        { message },
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );

      // Replace optimistic message with real one from server
      // API returns the message directly (not wrapped in {message: ...})
      setMessages((prev) => {
        const filtered = prev.filter(m => m.id !== tempId);
        return [...filtered, data];
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.message || 'فشل إرسال الرسالة');
      // Revert optimistic update on failure
      setMessages((prev) => prev.filter(m => !m.is_optimistic));
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="settings-section">
        <h2>رسائل الدعم</h2>
        <p>يجب تسجيل الدخول لاستخدام نظام الرسائل.</p>
      </div>
    );
  }

  return (
    <div className="settings-section">
      <h2>رسائل الدعم</h2>

      <div className="chat-section">
        <div className="support-chat-wrapper">
          <div className="chat-header">
            <h3>محادثة مع فريق الدعم</h3>
            {selectedThread && (
              <span className="chat-status">
                {selectedThread.status === 'open' ? '🟢 مفتوحة' : '🔴 مغلقة'}
              </span>
            )}
          </div>

          <ChatContainer messages={messages} loading={loadingMessages} username={user?.username} />

          <MessageInput
            onSend={handleSendMessage}
            disabled={selectedThread?.status === 'closed'}
          />
        </div>
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
        newPassword,
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

  // Check if user signed in with OAuth (Google, etc.) - they don't have a password
  const isOAuthUser = session?.user?.app_metadata?.provider === 'google' ||
    session?.user?.app_metadata?.providers?.includes('google');

  return (
    <div className="settings-section">
      <h2>إعدادات الأمان</h2>

      {/* Only show password change for email/password users */}
      {!isOAuthUser ? (
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
      ) : (
        <div className="form-group">
          <p style={{
            padding: '15px',
            backgroundColor: 'var(--secondary-color)',
            borderRadius: '8px',
            color: 'var(--primary-color)',
            textAlign: 'center'
          }}>
            🔐 لقد سجلت الدخول عبر Google. لا يمكنك تغيير كلمة المرور من هنا.
          </p>
        </div>
      )}

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
