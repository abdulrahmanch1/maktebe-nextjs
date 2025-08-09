import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ContactMessage from '@/models/ContactMessage';
import { protect } from '@/lib/middleware';
import { validateContactMessage } from '@/lib/validation'; // Assuming you add this validation

export async function POST(request) {
  await dbConnect();
  try {
    const { subject, message, email, username } = await request.json();

    const errors = validateContactMessage({ subject, message, email });
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
    }

    const newContactMessage = new ContactMessage({
      subject,
      message,
      email,
      username: username || 'Guest',
      user: request.user ? request.user._id : null, // Associate with user if logged in
    });

    await newContactMessage.save();
    return NextResponse.json({ message: 'تم إرسال رسالتك بنجاح!' }, { status: 201 });
  } catch (error) {
    console.error('Error sending contact message:', error);
    return NextResponse.json({ message: 'فشل إرسال الرسالة.' }, { status: 500 });
  }
}