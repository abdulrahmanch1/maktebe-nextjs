import { NextResponse } from 'next/server';
import { protect, admin } from '@/lib/middleware';

export const POST = protect(admin(async (request) => {
  try {
    const body = await request.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json({ error: 'Book title is required' }, { status: 400 });
    }

    // n8n Webhook URL
    // Production URL (Active Mode)
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://n8n.hani-labs.com/webhook/book-details';

    console.log(`Sending request to n8n: ${n8nWebhookUrl} for book: ${title}`);

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        author: body.author || '',
      }),
    });

    if (!response.ok) {
      console.error('n8n Webhook error:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to fetch data from AI service.' }, { status: 500 });
    }

    // n8n returns the JSON directly
    const bookInfo = await response.json();
    return NextResponse.json(bookInfo);

  } catch (error) {
    console.error('Error in AI book-info API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}));
