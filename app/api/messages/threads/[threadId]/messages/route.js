import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
import { createClient } from '@/utils/supabase/server';

// POST - Send a new message in a thread
export const POST = protect(async (request, { params }) => {
    const { threadId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const { message } = await request.json();

    if (!message || !message.trim()) {
        return NextResponse.json({ message: 'الرسالة مطلوبة' }, { status: 400 });
    }

    // Check if thread exists and user has access
    const { data: thread, error: threadError } = await supabase
        .from('message_threads')
        .select('user_id')
        .eq('id', threadId)
        .single();

    if (threadError || !thread) {
        return NextResponse.json({ message: 'المحادثة غير موجودة' }, { status: 404 });
    }

    // Check if user is admin or thread owner
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const isAdmin = profile?.role === 'admin';
    const isOwner = thread.user_id === user.id;

    if (!isAdmin && !isOwner) {
        return NextResponse.json({ message: 'غير مصرح' }, { status: 403 });
    }

    // Determine sender type
    const senderType = isAdmin ? 'admin' : 'user';

    // Insert message
    const { data: newMessage, error: messageError } = await supabase
        .from('thread_messages')
        .insert({
            thread_id: threadId,
            sender_id: user.id,
            sender_type: senderType,
            message: message.trim()
        })
        .select()
        .single();

    if (messageError) {
        console.error('Error creating message:', messageError);
        return NextResponse.json({ message: 'فشل إرسال الرسالة' }, { status: 500 });
    }

    // Update thread's updated_at timestamp
    await supabase
        .from('message_threads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', threadId);

    return NextResponse.json(newMessage, { status: 201 });
});
