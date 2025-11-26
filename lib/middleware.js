import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// WeakMap to store user data associated with requests
const requestUserMap = new WeakMap();

const extractBearerToken = (req) => {
  if (!req?.headers) return null;
  const headerValue = typeof req.headers.get === 'function'
    ? req.headers.get('authorization') || req.headers.get('Authorization')
    : req.headers.authorization || req.headers.Authorization;

  if (!headerValue) return null;
  const [scheme, token] = headerValue.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }
  return token.trim();
};

// Helper function to get user data from request
export const getUserFromRequest = (req) => {
  return requestUserMap.get(req);
};

export const protect = (handler) => {
  return async (req, ...args) => {
    const supabase = await createClient();
    const bearerToken = extractBearerToken(req);

    const userResponse = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();

    const { data, error } = userResponse;
    const user = data?.user;

    if (error || !user) {
      return NextResponse.json({ message: 'غير مصرح به' }, { status: 401 });
    }

    let role = null;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      role = profile?.role ?? null;
    } catch (profileError) {
      console.error('Failed to load user role:', profileError);
    }

    // Store user data in WeakMap instead of modifying the request object
    const userData = { ...user, role };
    requestUserMap.set(req, userData);

    return handler(req, ...args);
  };
};


export const admin = (handler) => {
  return protect(async (req, ...args) => {
    const user = getUserFromRequest(req);
    if (user?.role !== 'admin') {
      return NextResponse.json({ message: 'غير مصرح به كمسؤول' }, { status: 403 });
    }
    return handler(req, ...args);
  });
};

