import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ContactMessage from '@/models/ContactMessage';
import { protect, admin } from '@/lib/middleware';

export const GET = protect(admin(async (request) => {
  await dbConnect();
  try {
    const messages = await ContactMessage.find().populate('user', 'username email').sort({ createdAt: -1 });
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    return NextResponse.json({ message: 'فشل جلب الرسائل.' }, { status: 500 });
  }
}));
