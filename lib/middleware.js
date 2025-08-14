import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const protect = (handler) => {
  return async (req, ...args) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: 'غير مصرح به' }, { status: 401 });
    }

    req.user = user;

    return handler(req, ...args);
  };
};

export const admin = (handler) => {
  return async (req, ...args) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: 'غير مصرح به' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ message: 'غير مصرح به كمسؤول' }, { status: 403 });
    }

    req.user = user;

    return handler(req, ...args);
  };
};