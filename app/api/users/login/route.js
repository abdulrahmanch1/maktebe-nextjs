import { NextResponse } from 'next/server';
import { validateLogin } from '@/lib/validation';
import { createClient } from '@/utils/supabase/server';

export async function POST(request) {
  const { email, password } = await request.json();

  const errors = validateLogin({ email, password });
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ message: 'فشل التحقق', errors }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes('Email not confirmed')) {
      return NextResponse.json({ message: 'يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول.' }, { status: 401 });
    }
    return NextResponse.json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' }, { status: 401 });
  }

  return NextResponse.json({ message: 'تم تسجيل الدخول بنجاح', user: data.user });
}
