import { createMocks } from 'node-mocks-http';
import { POST } from '../../app/api/users/login/route';
import { NextResponse } from 'next/server';

// محاكاة next/server
jest.mock('next/server', () => ({
    NextResponse: {
        json: jest.fn((body, init) => ({
            json: async () => body,
            status: init?.status || 200,
        })),
    },
}));

// محاكاة Supabase
jest.mock('@/utils/supabase/server', () => ({
    createClient: jest.fn(() => ({
        auth: {
            signInWithPassword: jest.fn(({ email, password }) => {
                if (email === 'test@example.com' && password === 'password') {
                    return { data: { user: { id: '1', email: 'test@example.com' }, session: {} }, error: null };
                }
                return { data: { user: null, session: null }, error: { message: 'بيانات الاعتماد غير صالحة' } };
            })
        }
    }))
}));

describe('واجهة برمجة تطبيقات المصادقة (Auth API - Login)', () => {
    it('تعيد نجاح عند استخدام بيانات اعتماد صحيحة', async () => {
        const { req } = createMocks({
            method: 'POST',
            json: () => ({ email: 'test@example.com', password: 'password' }),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.user.email).toBe('test@example.com');
    });

    it('تعيد خطأ عند استخدام بيانات اعتماد خاطئة', async () => {
        const { req } = createMocks({
            method: 'POST',
            json: () => ({ email: 'wrong@example.com', password: 'wrong' }),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.message).toBe('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    });
});
