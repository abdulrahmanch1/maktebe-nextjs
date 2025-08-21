import { NextResponse } from 'next/server';
import { validateContactMessage } from '@/lib/validation';
import { createClient } from '@/utils/supabase/server'; // Correct import for server-side
import { cookies } from 'next/headers';

export async function POST(request) {
  const supabase = await createClient(); // createClient is async
  try {
    const { subject, message, email, username } = await request.json();

    const errors = validateContactMessage({ subject, message, email });
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
    }

    // Simplified user check
    const { data: { user } } = await supabase.auth.getUser();

    const contactMessageData = {
      subject,
      message,
      email,
      username: username || 'Guest',
      user_id: user ? user.id : null, // Store user_id if a user is logged in
    };

    const { error: insertError } = await supabase
      .from('contact_messages')
      .insert(contactMessageData);

    if (insertError) {
      throw new Error(insertError.message);
    }

    return NextResponse.json({ message: 'تم إرسال رسالتك بنجاح!' }, { status: 201 });
  } catch (error) {
    console.error('Error sending contact message:', error);
    return NextResponse.json({ message: 'فشل إرسال الرسالة.' }, { status: 500 });
  }
}