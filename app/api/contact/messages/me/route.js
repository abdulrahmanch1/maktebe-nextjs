import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
import { createClient } from '@/utils/supabase/server';

// This route is deprecated - redirects to new threads API
export const GET = protect(async (request) => {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: 'غير مصرح به' }, { status: 401 });
    }

    // Fetch threads instead of old contact messages
    const { data: threads, error } = await supabase
      .from('message_threads')
      .select(`
        *,
        thread_messages (
          id,
          message,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching threads:', error);
      return NextResponse.json([], { status: 200 }); // Return empty array instead of error
    }

    // Transform to old format for compatibility
    const messages = threads?.map(thread => ({
      id: thread.id,
      subject: thread.subject,
      message: thread.thread_messages?.[0]?.message || '',
      created_at: thread.created_at,
      email: user.email
    })) || [];

    return NextResponse.json(messages);
  } catch (err) {
    console.error('Error fetching user contact messages:', err);
    return NextResponse.json([], { status: 200 }); // Return empty array instead of error
  }
});
