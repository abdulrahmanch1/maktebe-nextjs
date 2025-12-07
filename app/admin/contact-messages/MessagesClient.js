'use client';
import React, { useState, useMemo, useContext, useEffect } from 'react';
import { ThemeContext } from '@/contexts/ThemeContext';
import { FaPaperPlane, FaSearch, FaArrowRight, FaUserCircle, FaPlus, FaBullhorn, FaTimes } from 'react-icons/fa';
import './messages.css';
import { toast } from 'react-toastify';

const MessagesClient = ({ initialMessages }) => {
    const { theme } = useContext(ThemeContext);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [replyText, setReplyText] = useState('');
    const [messages, setMessages] = useState(initialMessages);

    // Modals State
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);

    // New Chat State
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUserForChat, setSelectedUserForChat] = useState(null);
    const [newChatSubject, setNewChatSubject] = useState('');
    const [newChatMessage, setNewChatMessage] = useState('');

    // Broadcast State
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');

    // Group messages by email
    const conversations = useMemo(() => {
        const groups = {};
        messages.forEach(msg => {
            if (!groups[msg.email]) {
                groups[msg.email] = {
                    email: msg.email,
                    username: msg.username,
                    messages: [],
                    lastMessage: null,
                    lastDate: null,
                    threadId: msg.thread_id,
                };
            }
            groups[msg.email].messages.push(msg);
        });

        Object.values(groups).forEach(group => {
            group.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            group.lastMessage = group.messages[group.messages.length - 1];
            group.lastDate = new Date(group.lastMessage.created_at);
        });

        return Object.values(groups).sort((a, b) => b.lastDate - a.lastDate);
    }, [messages]);

    const filteredConversations = conversations.filter(c =>
        c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedConversation = selectedEmail ? conversations.find(c => c.email === selectedEmail) : null;

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        try {
            const response = await fetch(`/api/messages/threads/${selectedConversation.threadId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: replyText.trim() }),
            });

            if (!response.ok) throw new Error('فشل إرسال الرسالة');

            const newMessage = await response.json();
            const newMessageWithDetails = {
                ...newMessage,
                subject: selectedConversation.lastMessage.subject,
                email: selectedConversation.email,
                username: 'Admin',
                thread_id: selectedConversation.threadId,
            };

            setMessages([...messages, newMessageWithDetails]);
            toast.success('تم إرسال الرد بنجاح!');
            setReplyText('');
        } catch (error) {
            console.error('Error sending reply:', error);
            toast.error('فشل إرسال الرد. حاول مرة أخرى.');
        }
    };

    // Debounced Search Effect
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (userSearchQuery.length >= 2) {
                const searchUsers = async () => {
                    try {
                        const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(userSearchQuery)}`);
                        if (res.ok) {
                            const data = await res.json();
                            setSearchResults(data);
                        }
                    } catch (error) {
                        console.error("Search error:", error);
                    }
                };
                searchUsers();
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [userSearchQuery]);

    const handleUserSearch = (query) => {
        setUserSearchQuery(query);
    };

    const handleStartChat = async () => {
        if (!selectedUserForChat || !newChatSubject || !newChatMessage) return;

        try {
            const res = await fetch('/api/threads/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUserId: selectedUserForChat.id,
                    subject: newChatSubject,
                    initialMessage: newChatMessage
                })
            });

            if (!res.ok) throw new Error('Failed to create thread');

            toast.success('تم بدء المحادثة وإرسال الرسالة!');
            setShowNewChatModal(false);
            setSelectedUserForChat(null);
            setNewChatSubject('');
            setNewChatMessage('');
            // Reload to fetch the new thread and message
            window.location.reload();
        } catch (error) {
            toast.error('فشل بدء المحادثة');
        }
    };

    const handleSendBroadcast = async () => {
        if (!broadcastTitle || !broadcastMessage) return;

        try {
            const res = await fetch('/api/admin/broadcasts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: broadcastTitle,
                    message: broadcastMessage
                })
            });

            if (!res.ok) throw new Error('Failed to send broadcast');

            toast.success('تم إرسال التعميم بنجاح!');
            setShowBroadcastModal(false);
            setBroadcastTitle('');
            setBroadcastMessage('');
        } catch (error) {
            toast.error('فشل إرسال التعميم');
        }
    };

    return (
        <div className="messages-container">
            {/* Sidebar */}
            <div className={`messages-sidebar ${selectedEmail ? 'hidden-mobile' : ''}`}>
                <div className="messages-actions" style={{ padding: '10px', display: 'flex', gap: '10px' }}>
                    <button
                        className="action-btn"
                        onClick={() => setShowNewChatModal(true)}
                        style={{ flex: 1, padding: '8px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                    >
                        <FaPlus /> محادثة جديدة
                    </button>
                    <button
                        className="action-btn"
                        onClick={() => setShowBroadcastModal(true)}
                        style={{ flex: 1, padding: '8px', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                    >
                        <FaBullhorn /> تعميم
                    </button>
                </div>

                <div className="messages-search">
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="بحث عن مستخدم..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <FaSearch style={{ position: 'absolute', left: '10px', top: '12px', color: '#888' }} />
                    </div>
                </div>
                <div className="messages-list">
                    {filteredConversations.map(conv => (
                        <div
                            key={conv.email}
                            className={`message-user-item ${selectedEmail === conv.email ? 'active' : ''}`}
                            onClick={() => setSelectedEmail(conv.email)}
                        >
                            <div className="user-avatar">
                                <FaUserCircle size={24} />
                            </div>
                            <div className="user-info">
                                <span className="user-name">{conv.username}</span>
                                <span className="user-last-msg">{conv.lastMessage.message}</span>
                            </div>
                            <span className="message-time" style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                                {new Date(conv.lastDate).toLocaleDateString('ar-EG')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`chat-area ${!selectedEmail ? 'hidden-mobile' : ''}`}>
                {selectedConversation ? (
                    <>
                        <div className="chat-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <button
                                    className="mobile-back-button"
                                    onClick={() => setSelectedEmail(null)}
                                    style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', display: 'none' }}
                                >
                                    <FaArrowRight />
                                </button>
                                <div className="chat-header-user">
                                    {selectedConversation.username}
                                    <span style={{ fontSize: '0.8rem', fontWeight: 'normal', display: 'block', opacity: 0.8 }}>
                                        {selectedConversation.email}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="chat-messages">
                            {selectedConversation.messages.map((msg, idx) => (
                                <div key={idx} className={`message-bubble ${msg.sender_type === 'admin' ? 'sent' : 'received'}`}>
                                    {msg.message}
                                    <span className="message-time">
                                        {new Date(msg.created_at).toLocaleString('ar-EG')}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <form className="chat-input-area" onSubmit={handleSendReply}>
                            <textarea
                                className="chat-input"
                                placeholder="اكتب ردك هنا..."
                                rows="1"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                            ></textarea>
                            <button type="submit" className="send-button">
                                <FaPaperPlane />
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', opacity: 0.5 }}>
                        <FaPaperPlane size={50} style={{ marginBottom: '20px' }} />
                        <h3>اختر محادثة للبدء</h3>
                    </div>
                )}
            </div>

            {/* New Chat Modal */}
            {showNewChatModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>بدء محادثة جديدة</h3>
                            <button onClick={() => setShowNewChatModal(false)}><FaTimes /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>البحث عن مستخدم:</label>
                                <input
                                    type="text"
                                    placeholder="الاسم أو البريد الإلكتروني..."
                                    value={userSearchQuery}
                                    onChange={(e) => handleUserSearch(e.target.value)}
                                    className="modal-input"
                                />
                                {searchResults.length > 0 && (
                                    <div className="search-results">
                                        {searchResults.map(user => (
                                            <div
                                                key={user.id}
                                                className={`search-result-item ${selectedUserForChat?.id === user.id ? 'selected' : ''}`}
                                                onClick={() => {
                                                    setSelectedUserForChat(user);
                                                    setSearchResults([]);
                                                    setUserSearchQuery(user.username);
                                                }}
                                            >
                                                {user.username} ({user.email})
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label>الموضوع:</label>
                                <input
                                    type="text"
                                    value={newChatSubject}
                                    onChange={(e) => setNewChatSubject(e.target.value)}
                                    className="modal-input"
                                    placeholder="عنوان المحادثة..."
                                />
                            </div>
                            <div className="form-group">
                                <label>الرسالة:</label>
                                <textarea
                                    value={newChatMessage}
                                    onChange={(e) => setNewChatMessage(e.target.value)}
                                    className="modal-input"
                                    rows="4"
                                    placeholder="اكتب رسالتك الأولى..."
                                ></textarea>
                            </div>
                            <button className="modal-submit-btn" onClick={handleStartChat}>إرسال وبدء المحادثة</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Broadcast Modal */}
            {showBroadcastModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>إرسال تعميم للجميع</h3>
                            <button onClick={() => setShowBroadcastModal(false)}><FaTimes /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>عنوان التعميم:</label>
                                <input
                                    type="text"
                                    value={broadcastTitle}
                                    onChange={(e) => setBroadcastTitle(e.target.value)}
                                    className="modal-input"
                                    placeholder="عنوان الرسالة..."
                                />
                            </div>
                            <div className="form-group">
                                <label>نص الرسالة:</label>
                                <textarea
                                    value={broadcastMessage}
                                    onChange={(e) => setBroadcastMessage(e.target.value)}
                                    className="modal-input"
                                    rows="5"
                                    placeholder="اكتب رسالتك هنا..."
                                ></textarea>
                            </div>
                            <button className="modal-submit-btn broadcast" onClick={handleSendBroadcast}>إرسال للجميع</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: var(--secondary-color);
                    padding: 20px;
                    border-radius: 10px;
                    width: 90%;
                    max-width: 500px;
                    color: var(--primary-color);
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 10px;
                }
                .modal-header button {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 1.2rem;
                    color: var(--primary-color);
                }
                .form-group {
                    margin-bottom: 15px;
                    position: relative;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                }
                .modal-input {
                    width: 100%;
                    padding: 10px;
                    border-radius: 5px;
                    border: 1px solid #ddd;
                    background: var(--background-color);
                    color: var(--primary-color);
                }
                .search-results {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    max-height: 200px;
                    overflow-y: auto;
                    z-index: 10;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .search-result-item {
                    padding: 10px;
                    cursor: pointer;
                    border-bottom: 1px solid #eee;
                    color: #333;
                }
                .search-result-item:hover, .search-result-item.selected {
                    background: #f0f0f0;
                }
                .modal-submit-btn {
                    width: 100%;
                    padding: 10px;
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                }
                .modal-submit-btn.broadcast {
                    background: var(--accent-color);
                }
                @media (max-width: 768px) {
                    .hidden-mobile {
                        display: none !important;
                    }
                    .mobile-back-button {
                        display: block !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default MessagesClient;
