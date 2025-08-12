import { NextResponse } from 'next/server';
import { validateContactMessage } from '@/lib/validation';
import { supabase } from '@/lib/supabase'; // Import supabase client
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { subject, message, email, username } = await request.json();

    const errors = validateContactMessage({ subject, message, email });
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
    }

    let userId = null;
    // Attempt to get user ID if authenticated (Supabase session)
    const cookieStore = cookies();
    const supabaseAccessToken = cookieStore.get('sb-access-token');
    const supabaseRefreshToken = cookieStore.get('sb-refresh-token');

    if (supabaseAccessToken && supabaseRefreshToken) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (user && !userError) {
        userId = user.id;
      }
    }

    const contactMessageData = {
      subject,
      message,
      email,
      username: username || 'Guest',
      user_id: userId, // Store user_id if available
    };

    const { data: newContactMessage, error: insertError } = await supabase
      .from('contact_messages')
      .insert(contactMessageData)
      .select()
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    return NextResponse.json({ message: 'تم إرسال رسالتك بنجاح!' }, { status: 201 });
  } catch (error) {
    console.error('Error sending contact message:', error);
    return NextResponse.json({ message: 'فشل إرسال الرسالة.' }, { status: 500 });
  }
}