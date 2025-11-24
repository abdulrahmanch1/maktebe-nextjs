'use client';

import React, { useState, useRef, useEffect, useContext } from 'react';
import './ChatAssistant.css';
import { ThemeContext } from '../contexts/ThemeContext'; // To control themes
import { AuthContext } from '../contexts/AuthContext'; // To get user ID
import { themes } from '@/data/themes'; // Import themes data


const ChatAssistant = () => {
  const { toggleTheme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext); // Get user from AuthContext
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: 'مرحباً بك! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم في استكشاف المكتبة؟' }
  ]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage = { role: 'user', text: inputText };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: inputText, 
          history: messages // Sending history for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI service.');
      }

      const data = await response.json();

      // Check if the AI wants to use a tool
      if (data.tool_call && data.tool_call.name === 'change_theme') {
        const themeIdentifier = data.tool_call.args.themeName;
        let themeKey = null;

        // Check if the identifier is a direct key
        if (themes[themeIdentifier]) {
          themeKey = themeIdentifier;
        } else {
          // Otherwise, search by name
          themeKey = Object.keys(themes).find(key => themes[key].name === themeIdentifier);
        }

        if (themeKey) {
          toggleTheme(themeKey); // Change the theme using the found key
          const modelMessage = { role: 'model', text: `تم تغيير الثيم بنجاح إلى "${themes[themeKey].name}".` };
          setMessages(prev => [...prev, modelMessage]);
        } else {
          // If theme is not found
          const errorMessage = { role: 'model', text: `عذراً، لم أتمكن من العثور على الثيم "${themeIdentifier}".` };
          setMessages(prev => [...prev, errorMessage]);
        }

      } else if (data.text) {
        // It's a regular text response
        const modelMessage = { role: 'model', text: data.text };
        setMessages(prev => [...prev, modelMessage]);
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = { role: 'model', text: 'عذراً، حدث خطأ أثناء الاتصال بالمساعد الذكي.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={`chat-assistant-window ${isOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <h3>المساعد الذكي</h3>
          <button onClick={toggleChat} className="close-chat-btn" aria-label="إغلاق المساعد">–</button>
        </div>
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <p>{msg.text}</p>
            </div>
          ))}
          {isLoading && (
            <div className="message model">
              <p className="typing-indicator">...</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="اسأل عن كتاب أو مؤلف..."
            aria-label="Chat input"
          />
          <button type="submit" disabled={isLoading}>إرسال</button>
        </form>
      </div>
      <button onClick={toggleChat} className="chat-assistant-button" aria-label={isOpen ? 'إخفاء المساعد' : 'فتح المساعد'}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v2h-2v-2zm0 4h2v6h-2v-6z"/></svg>
      </button>
    </>
  );
};

export default ChatAssistant;
