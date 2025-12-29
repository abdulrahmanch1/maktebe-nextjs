import React from 'react';
import './ChatComponents.css';
import { FaPaperPlane } from 'react-icons/fa';

export const MessageBubble = ({ message, senderType, createdAt, username }) => {
    const isCurrentUser = senderType === 'user';

    // Format time, handle invalid dates
    let timeString = 'الآن';
    try {
        const date = new Date(createdAt);
        if (!isNaN(date.getTime())) {
            timeString = date.toLocaleTimeString('ar-SA', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        }
    } catch (error) {
        console.error('Error formatting date:', error);
    }

    return (
        <div className={`message-bubble-container ${isCurrentUser ? 'user-message' : 'admin-message'}`}>
            <div className="message-bubble">
                <div className="message-text">{message}</div>
                <div className="message-time">
                    {timeString}
                </div>
            </div>
        </div>
    );
};

export const ChatContainer = ({ messages, loading, username }) => {
    const messagesEndRef = React.useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Only show full loading screen if we have NO messages at all and are loading
    if (loading && (!messages || messages.length === 0)) {
        return (
            <div className="chat-container">
                <div className="chat-loading">جاري مزامنة المحادثة...</div>
            </div>
        );
    }

    if (!loading && (!messages || messages.length === 0)) {
        return (
            <div className="chat-container">
                <div className="chat-empty">
                    <span style={{ fontSize: '3rem' }}>💬</span>
                    <p>مرحباً! كيف يمكننا مساعدتك اليوم؟</p>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-container">
            <div className="chat-messages">
                {messages.map((msg) => (
                    <MessageBubble
                        key={msg.id}
                        message={msg.message}
                        senderType={msg.sender_type}
                        createdAt={msg.created_at}
                        username={username}
                    />
                ))}
                {/* Small indicator if syncing in background but we have messages */}
                {loading && <div style={{ textAlign: 'center', fontSize: '0.7rem', opacity: 0.5 }}>جارٍ التحديث...</div>}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};

export const MessageInput = ({ onSend, disabled }) => {
    const [message, setMessage] = React.useState('');
    const [sending, setSending] = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim() || sending) return;

        setSending(true);
        try {
            await onSend(message.trim());
            setMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form className="message-input-container" onSubmit={handleSubmit}>
            <textarea
                className="message-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="اكتب رسالتك..."
                disabled={disabled}
                rows="1"
            />
            <button
                type="submit"
                className="message-send-button"
                disabled={!message.trim() || disabled || sending}
                title="إرسال"
            >
                {sending ? <div className="spinner-sm" /> : <FaPaperPlane />}
            </button>
        </form>
    );
};
