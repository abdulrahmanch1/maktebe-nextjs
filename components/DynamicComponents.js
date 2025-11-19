'use client';

import dynamic from 'next/dynamic';

const DynamicChatAssistant = dynamic(() => import('@/components/DynamicChatAssistant'), {
    ssr: false,
    loading: () => null,
});

const PWAServiceWorker = dynamic(() => import('@/components/PWAServiceWorker'), {
    ssr: false,
});

export default function DynamicComponents() {
    return (
        <>
            <DynamicChatAssistant />
            <PWAServiceWorker />
        </>
    );
}
