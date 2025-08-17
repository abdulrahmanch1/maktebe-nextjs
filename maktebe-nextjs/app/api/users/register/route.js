import { NextResponse } from 'next/server';
import { validateRegister } from '@/lib/validation';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin'; // Import the admin client

export const POST = async (request) => {
  const { username, email, password } = await request.json();

  const errors = validateRegister({ username, email, password });
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ message: 'فشل التحقق', errors }, { status: 400 });
  }

  const supabase = createClient();

  try {
    // Register user with Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username, // Store username in user_metadata
          // You might want to add other default profile data here
        },
      },
    });

    if (signUpError) {
      console.error('Supabase sign-up error:', signUpError.message);
      if (signUpError.message.includes('User already registered')) {
        return NextResponse.json({ message: 'المستخدم بهذا البريد الإلكتروني موجود بالفعل' }, { status: 400 });
      }
      return NextResponse.json({ message: signUpError.message }, { status: 500 });
    }

    // If sign-up is successful, data.user will be available
    if (data.user) {
      // Supabase handles email verification flow.
      // You might still want to send a custom verification email if needed,
      // but Supabase's default email verification is usually sufficient.
      // If you need to send a custom email, you'd get the verification URL from Supabase.
      // For now, we'll assume Supabase handles the email.

      // Use the admin client to insert the profile, bypassing RLS for this trusted server-side operation.
      const supabaseAdmin = createAdminClient();
      const { error: profileError } = await supabaseAdmin.from('profiles').insert([
        { id: data.user.id, username: username, email: email, role: 'user' }
      ]);

      if (profileError) {
        console.error('Error creating user profile:', profileError.message);
        // If profile creation fails, the user already exists in auth, so we roll back.
        await supabaseAdmin.auth.admin.deleteUser(data.user.id);
        return NextResponse.json({ message: 'حدث خطأ أثناء إنشاء الملف الشخصي. تم التراجع عن تسجيل المستخدم.' }, { status: 500 });
      }

      return NextResponse.json({
        message: 'تم التسجيل بنجاح. يرجى التحقق من بريدك الإلكتروني لتفعيل حسابك.',
        user: {
          id: data.user.id,
          email: data.user.email,
          username: data.user.user_metadata.username, // Access username from user_metadata
          isVerified: data.user.email_confirmed_at !== null, // Check if email is confirmed
        },
      }, { status: 201 });
    } else {
      return NextResponse.json({ message: 'بيانات المستخدم غير صالحة' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json({ message: 'خطأ في الخادم' }, { status: 500 });
  }
};