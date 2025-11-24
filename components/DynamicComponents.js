'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const DynamicChatAssistant = dynamic(() => import('@/components/DynamicChatAssistant'), {
    ssr: false,
    loading: () => null,
});

const PWAServiceWorker = dynamic(() => import('@/components/PWAServiceWorker'), {
    ssr: false,
});

export default function DynamicComponents() {
    const [loadChat, setLoadChat] = useState(false);

    useEffect(() => {
        const id = window.requestIdleCallback
            ? window.requestIdleCallback(() => setLoadChat(true), { timeout: 1200 })
            : setTimeout(() => setLoadChat(true), 800);
        return () => {
            if (window.cancelIdleCallback && typeof id === 'number') {
                window.cancelIdleCallback(id);
            } else {
                clearTimeout(id);
            }
        };
    }, []);

    return (
        <>
            {loadChat && <DynamicChatAssistant />}
            <PWAServiceWorker />
        </>
    );
}
