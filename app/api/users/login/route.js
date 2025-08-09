import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { validateLogin } from '@/lib/validation';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

export async function POST(request) {
  await dbConnect();
  try {
    const { email, password } = await request.json();

    const errors = validateLogin({ email, password });
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return NextResponse.json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' }, { status: 401 });
    }

    if (!user.isVerified) {
      return NextResponse.json({ message: 'يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول.' }, { status: 401 });
    }

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);

      cookies().set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });

      return NextResponse.json({
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          favorites: user.favorites,
          readingList: user.readingList,
        },
      });
    } else {
      return NextResponse.json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' }, { status: 401 });
    }
  } catch (err) {
    console.error("Error during login:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
