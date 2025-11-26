import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
import { createClient } from '@/utils/supabase/server';

// GET - Fetch a specific thread with all its messages
export const GET = protect(async (request, { params }) => {
    const { threadId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    // Fetch thread
    const { data: thread, error } = await supabase
        .from('message_threads')
        .select('*')
        .eq('id', threadId)
        .single();

    if (error || !thread) {
        console.error('Error fetching thread:', error);
        return NextResponse.json({ message: 'فشل جلب المحادثة' }, { status: 404 });
    }

    // Fetch user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, email')
        .eq('id', thread.user_id)
        .single();

    // Fetch thread messages
    const { data: messages } = await supabase
        .from('thread_messages')
        .select('id, sender_id, sender_type, message, created_at')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

    // Check authorization
    const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const isAdmin = userProfile?.role === 'admin';
    const isOwner = thread.user_id === user.id;

    if (!isAdmin && !isOwner) {
        return NextResponse.json({ message: 'غير مصرح' }, { status: 403 });
    }

    // Return thread with profile and messages
    return NextResponse.json({
        ...thread,
        profiles: profile,
        thread_messages: messages || []
    });
});
