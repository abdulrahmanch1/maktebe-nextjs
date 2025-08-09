import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ContactMessage from '@/models/ContactMessage';
import { protect, admin } from '@/lib/middleware';
import { validateMongoId } from '@/lib/validation';

export const DELETE = protect(admin(async (request, { params }) => {
  const { id } = params;

  const idErrors = validateMongoId(id);
  if (Object.keys(idErrors).length > 0) {
    return NextResponse.json({ message: 'Invalid Message ID', errors: idErrors }, { status: 400 });
  }

  await dbConnect();
  try {
    const message = await ContactMessage.findById(id);

    if (!message) {
      return NextResponse.json({ message: 'الرسالة غير موجودة.' }, { status: 404 });
    }

    await message.deleteOne();
    return NextResponse.json({ message: 'تم حذف الرسالة بنجاح!' });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    return NextResponse.json({ message: 'فشل حذف الرسالة.' }, { status: 500 });
  }
}));
