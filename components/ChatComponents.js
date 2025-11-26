import React from 'react';
import './ChatComponents.css';

export const MessageBubble = ({ message, senderType, createdAt, currentUserId, username }) => {
    const isCurrentUser = senderType === 'user';
    const label = isCurrentUser ? username : 'مسؤول';

    return (
        <div className={`message-bubble-container ${isCurrentUser ? 'user-message' : 'admin-message'}`}>
            <div className="message-bubble">
                <div className="message-sender-label">{label}</div>
                <div className="message-text">{message}</div>
                <div className="message-time">
                    {new Date(createdAt).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
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

    if (loading) {
        return (
            <div className="chat-container">
                <div className="chat-loading">جاري تحميل الرسائل...</div>
            </div>
        );
    }

    if (!messages || messages.length === 0) {
        return (
            <div className="chat-container">
                <div className="chat-empty">لا توجد رسائل بعد. ابدأ المحادثة!</div>
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
                disabled={disabled || sending}
                rows="1"
            />
            <button
                type="submit"
                className="message-send-button"
                disabled={!message.trim() || disabled || sending}
            >
                {sending ? '...' : 'إرسال'}
            </button>
        </form>
    );
};
