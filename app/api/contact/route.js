import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ContactMessage from '@/models/ContactMessage';
import { protect } from '@/lib/middleware';
import { validateContactMessage } from '@/lib/validation'; // Assuming you add this validation

export async function POST(request) {
  await dbConnect();
  try {
    const { subject, message, email, username } = await request.json();

    // Assuming validateContactMessage is added to lib/validation.js
    // For now, I'll do basic validation here
    if (!subject || !message || !email) {
      return NextResponse.json({ message: 'Subject, message, and email are required.' }, { status: 400 });
    }
    if (!/^[^
@]+@[^
@]+\.[^
@]+$/.test(email)) {
      return NextResponse.json({ message: 'Invalid email format.' }, { status: 400 });
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
