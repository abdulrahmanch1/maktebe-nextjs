import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request) {
  // أضفت هذا السطر المؤقت للتحقق من متغير البيئة
  console.log('BLOB_READ_WRITE_TOKEN:', process.env.BLOB_READ_WRITE_TOKEN ? 'Set' : 'Not Set');

  try {
    // استخدام request.formData() لتحليل طلب multipart/form-data
    const formData = await request.formData();
    
    let file = null;
    // البحث عن كائن الملف داخل formData (يجب أن يكون هناك ملف واحد فقط)
    for (const entry of formData.values()) {
      if (entry instanceof File) {
        file = entry;
        break;
      }
    }

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // دالة put يمكنها قبول كائن File مباشرة
    const blob = await put(file.name, file, {
      access: 'public',
      contentType: file.type,
      addRandomSuffix: true,
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error('Error handling upload:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload file.' }, { status: 400 });
  }
}