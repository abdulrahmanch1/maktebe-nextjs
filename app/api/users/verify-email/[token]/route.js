import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function GET(request, { params }) {
  await dbConnect();
  const { token } = params;

  try {
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json({ message: 'رمز التحقق غير صالح أو انتهت صلاحيته.' }, { status: 400 });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    return NextResponse.json({ message: 'تم تأكيد بريدك الإلكتروني بنجاح. يمكنك الآن تسجيل الدخول.' }, { status: 200 });
  } catch (err) {
    console.error("Error verifying email:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
