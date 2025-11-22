import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const { event_type, page_path, book_id, metadata, session_id } = body;

        // Validate required fields
        if (!event_type) {
            return NextResponse.json(
                { message: 'event_type is required' },
                { status: 400 }
            );
        }

        // Get current user (if logged in)
        const { data: { user } } = await supabase.auth.getUser();

        // Insert analytics event
        const { error } = await supabase
            .from('analytics_events')
            .insert({
                user_id: user?.id || null,
                event_type,
                page_path: page_path || null,
                book_id: book_id || null,
                metadata: metadata || {},
                session_id: session_id || null,
            });

        if (error) {
            console.error('Analytics tracking error:', error);
            return NextResponse.json(
                { message: 'Failed to track event' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Analytics API error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
