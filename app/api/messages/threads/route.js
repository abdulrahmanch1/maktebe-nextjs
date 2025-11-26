import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
import { createClient } from '@/utils/supabase/server';

// GET - Fetch all threads for current user (or all threads if admin)
export const GET = protect(async (request) => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const isAdmin = profile?.role === 'admin';

    let query = supabase
        .from('message_threads')
        .select(`
      id,
      user_id,
      subject,
      status,
      created_at,
      updated_at
    `)
        .order('updated_at', { ascending: false });

    // If not admin, only show user's own threads
    if (!isAdmin) {
        query = query.eq('user_id', user.id);
    }

    const { data: threads, error } = await query;

    if (error) {
        console.error('Error fetching threads:', error);
        return NextResponse.json({ message: 'فشل جلب المحادثات' }, { status: 500 });
    }

    // Fetch user profiles and messages separately
    const threadsWithDetails = await Promise.all(threads.map(async (thread) => {
        // Get user profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, email')
            .eq('id', thread.user_id)
            .single();

        // Get thread messages
        const { data: messages } = await supabase
            .from('thread_messages')
            .select('id, message, sender_type, created_at')
            .eq('thread_id', thread.id)
            .order('created_at', { ascending: false });

        const lastMessage = messages?.[0] || null;

        return {
            ...thread,
            profiles: profile,
            lastMessage,
            messageCount: messages?.length || 0
        };
    }));

    return NextResponse.json(threadsWithDetails);
});

// POST - Create a new thread
export const POST = protect(async (request) => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const { subject, message } = await request.json();

    if (!subject || !message) {
        return NextResponse.json({ message: 'الموضوع والرسالة مطلوبان' }, { status: 400 });
    }

    // Create thread
    const { data: thread, error: threadError } = await supabase
        .from('message_threads')
        .insert({
            user_id: user.id,
            subject,
            status: 'open'
        })
        .select()
        .single();

    if (threadError) {
        console.error('Error creating thread:', threadError);
        return NextResponse.json({ message: 'فشل إنشاء المحادثة' }, { status: 500 });
    }

    // Create first message
    const { data: firstMessage, error: messageError } = await supabase
        .from('thread_messages')
        .insert({
            thread_id: thread.id,
            sender_id: user.id,
            sender_type: 'user',
            message
        })
        .select()
        .single();

    if (messageError) {
        console.error('Error creating message:', messageError);
        return NextResponse.json({ message: 'فشل إرسال الرسالة' }, { status: 500 });
    }

    return NextResponse.json({ thread, message: firstMessage }, { status: 201 });
});
