import { createClient } from '@/utils/supabase/server';
import MessagesClient from './MessagesClient';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'رسائل التواصل | لوحة التحكم',
};

export default async function MessagesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h1>غير مصرح لك بالوصول</h1>
      </div>
    );
  }

  // Fetch all message threads with their messages
  const { data: threads, error: threadsError } = await supabase
    .from('message_threads')
    .select('*')
    .order('updated_at', { ascending: false });

  if (threadsError) {
    console.error('Error fetching threads:', threadsError);
    return <div>حدث خطأ أثناء تحميل المحادثات.</div>;
  }

  // Fetch all messages and user profiles for each thread
  const messagesWithProfiles = await Promise.all(
    (threads || []).map(async (thread) => {
      // Get user profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('username, email')
        .eq('id', thread.user_id)
        .single();

      // Get all messages for this thread
      const { data: threadMessages } = await supabase
        .from('thread_messages')
        .select('*')
        .eq('thread_id', thread.id)
        .order('created_at', { ascending: true });

      // Transform messages to match the old format
      return (threadMessages || []).map(msg => ({
        id: msg.id,
        subject: thread.subject,
        message: msg.message,
        email: userProfile?.email || 'unknown@example.com',
        username: userProfile?.username || 'مستخدم غير معروف',
        created_at: msg.created_at,
        sender_type: msg.sender_type,
        thread_id: thread.id
      }));
    })
  );

  // Flatten the array of arrays into a single array
  const allMessages = messagesWithProfiles.flat();

  return <MessagesClient initialMessages={allMessages || []} />;
}
