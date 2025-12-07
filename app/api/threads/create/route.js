import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
    const supabase = await createClient();

    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { targetUserId, subject, initialMessage } = body;

        if (!targetUserId || !subject || !initialMessage) {
            return NextResponse.json({ error: 'Target user, subject, and initial message are required' }, { status: 400 });
        }

        // Create the thread
        const { data: thread, error: threadError } = await supabase
            .from('message_threads')
            .insert([{
                user_id: targetUserId,
                subject: subject,
                status: 'open'
            }])
            .select()
            .single();

        if (threadError) throw threadError;

        // Insert the initial message
        const { error: messageError } = await supabase
            .from('thread_messages')
            .insert([{
                thread_id: thread.id,
                sender_type: 'admin',
                sender_id: user.id,
                message: initialMessage
            }]);

        if (messageError) throw messageError;

        return NextResponse.json(thread, { status: 201 });
    } catch (error) {
        console.error("Create Thread API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
