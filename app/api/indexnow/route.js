import { NextResponse } from 'next/server';

const INDEXNOW_KEY = 'a8557c299b10d7ad845b761e6c63b95583f3615d3621bec419000661d1529dd0';
const SITE_URL = 'https://www.dar-alqurra.com';

export async function POST(request) {
    try {
        const { urls } = await request.json();

        if (!urls || !Array.isArray(urls)) {
            return NextResponse.json({ error: 'URLs array required' }, { status: 400 });
        }

        // Submit to IndexNow (Bing, Yandex, etc.)
        const indexNowResponse = await fetch('https://api.indexnow.org/indexnow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                host: 'www.dar-alqurra.com',
                key: INDEXNOW_KEY,
                keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
                urlList: urls.map(url => `${SITE_URL}${url}`)
            })
        });

        if (!indexNowResponse.ok) {
            console.error('IndexNow submission failed:', await indexNowResponse.text());
        }

        return NextResponse.json({
            success: true,
            submitted: urls.length,
            indexNowStatus: indexNowResponse.status
        });
    } catch (error) {
        console.error('IndexNow API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Helper function to call from other parts of the app (kept internal to avoid invalid Route exports)
async function submitToIndexNow(urls) {
    try {
        const response = await fetch('/api/indexnow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls })
        });
        return await response.json();
    } catch (error) {
        console.error('Failed to submit to IndexNow:', error);
        return { success: false, error: error.message };
    }
}
