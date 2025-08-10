import { NextResponse } from 'next/server';
import { validateContactMessage } from '@/lib/validation';
import { supabase } from '@/lib/supabase'; // Import supabase client

export async function POST(request) {
  try {
    const { subject, message, email, username } = await request.json();

    const errors = validateContactMessage({ subject, message, email });
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
    }

    const contactMessageData = {
      subject,
      message,
      email,
      username: username || 'Guest',
      // Assuming 'user_id' column in contact_messages table for linking to users, if applicable
      // user_id: request.user ? request.user._id : null,
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