'use client';
import React, { useState, useMemo, useContext } from 'react';
import { ThemeContext } from '@/contexts/ThemeContext';
import { FaPaperPlane, FaSearch, FaArrowRight, FaUserCircle } from 'react-icons/fa';
import './messages.css';
import { toast } from 'react-toastify';

const MessagesClient = ({ initialMessages }) => {
    const { theme } = useContext(ThemeContext);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [replyText, setReplyText] = useState('');
    const [messages, setMessages] = useState(initialMessages);

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
                    threadId: msg.thread_id, // Add thread_id
                };
            }
            groups[msg.email].messages.push(msg);
        });

        // Sort messages within groups and find last message
        Object.values(groups).forEach(group => {
            group.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            group.lastMessage = group.messages[group.messages.length - 1];
            group.lastDate = new Date(group.lastMessage.created_at);
        });

        // Convert to array and sort by last date (newest first)
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
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: replyText.trim() }),
            });

            if (!response.ok) {
                throw new Error('فشل إرسال الرسالة');
            }

            const newMessage = await response.json();

            // Add the new message to the messages state
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

    return (
        <div className="messages-container">
            {/* Sidebar */}
            <div className={`messages-sidebar ${selectedEmail ? 'hidden-mobile' : ''}`}>
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
                                <span className="user-last-msg">{conv.lastMessage.subject}: {conv.lastMessage.message}</span>
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
                                    style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', display: 'none' }} // Visible only on mobile via CSS
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
                                <div key={idx} className="message-bubble received">
                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>{msg.subject}</div>
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

            <style jsx>{`
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
