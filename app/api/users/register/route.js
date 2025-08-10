import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { validateRegister } from '@/lib/validation';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

export async function POST(request) {
  await dbConnect();
  try {
    const { username, email, password } = await request.json();

    const errors = validateRegister({ username, email, password });
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return NextResponse.json({ message: 'User with that email already exists' }, { status: 400 });
    }

    const user = new User({
      username,
      email,
      password,
      verificationToken: crypto.randomBytes(20).toString('hex'),
      verificationTokenExpires: Date.now() + 3600000, // 1 hour
    });

    const newUser = await user.save();

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${newUser.verificationToken}`;
    try {
      await sendVerificationEmail(newUser.email, newUser.username, verificationUrl);
    } catch (emailError) {
      console.error("Error sending verification email after registration:", emailError);
      await User.findByIdAndDelete(newUser._id);
      return NextResponse.json({ message: 'Failed to send verification email. Please try again later or contact support.' }, { status: 500 });
    }

    if (newUser) {
      return NextResponse.json({
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        message: 'تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني لتأكيد حسابك.',
      }, { status: 201 });
    } else {
      return NextResponse.json({ message: 'Invalid user data' }, { status: 400 });
    }
  } catch (err) {
    console.error("Error during registration:", err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const message = `هذا الـ ${field === 'email' ? 'البريد الإلكتروني' : 'اسم المستخدم'} موجود بالفعل.`;
      return NextResponse.json({ message }, { status: 400 });
    }
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
