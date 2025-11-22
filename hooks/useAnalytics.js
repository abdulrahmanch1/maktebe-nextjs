'use client';
import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import axios from 'axios';
import { API_URL } from '@/constants';

// Generate a simple session ID
const getSessionId = () => {
    if (typeof window === 'undefined') return null;

    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
        sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
};

export const useAnalytics = () => {
    const pathname = usePathname();
    const sessionId = useRef(null);
    const pageViewTracked = useRef(false);

    useEffect(() => {
        sessionId.current = getSessionId();
    }, []);

    // Track page view
    useEffect(() => {
        if (!pathname || pageViewTracked.current) return;

        const trackPageView = async () => {
            try {
                await axios.post(`${API_URL}/api/analytics/track`, {
                    event_type: 'page_view',
                    page_path: pathname,
                    session_id: sessionId.current,
                });
                pageViewTracked.current = true;
            } catch (error) {
                console.error('Failed to track page view:', error);
            }
        };

        trackPageView();

        // Reset on pathname change
        return () => {
            pageViewTracked.current = false;
        };
    }, [pathname]);

    // Track book view
    const trackBookView = useCallback(async (bookId, metadata = {}) => {
        try {
            await axios.post(`${API_URL}/api/analytics/track`, {
                event_type: 'book_view',
                book_id: bookId,
                page_path: pathname,
                metadata,
                session_id: sessionId.current,
            });
        } catch (error) {
            console.error('Failed to track book view:', error);
        }
    }, [pathname]);

    // Track book read (with reading time)
    const trackBookRead = useCallback(async (bookId, readingTimeSeconds, metadata = {}) => {
        try {
            await axios.post(`${API_URL}/api/analytics/track`, {
                event_type: 'book_read',
                book_id: bookId,
                page_path: pathname,
                metadata: {
                    ...metadata,
                    reading_time_seconds: readingTimeSeconds,
                },
                session_id: sessionId.current,
            });
        } catch (error) {
            console.error('Failed to track book read:', error);
        }
    }, [pathname]);

    // Track custom event
    const trackEvent = useCallback(async (eventType, data = {}) => {
        try {
            await axios.post(`${API_URL}/api/analytics/track`, {
                event_type: eventType,
                page_path: pathname,
                ...data,
                session_id: sessionId.current,
            });
        } catch (error) {
            console.error('Failed to track event:', error);
        }
    }, [pathname]);

    return {
        trackBookView,
        trackBookRead,
        trackEvent,
    };
};
