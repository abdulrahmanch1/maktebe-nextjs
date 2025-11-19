import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../Header';
import { AuthProvider } from '@/contexts/AuthContext';

// محاكاة AuthContext
jest.mock('@/contexts/AuthContext', () => {
    const React = require('react');
    const mockAuthContextValue = {
        user: null,
        isLoggedIn: false,
        logout: jest.fn(),
    };
    const AuthContext = React.createContext(mockAuthContextValue);
    return {
        AuthProvider: ({ children }) => <div>{children}</div>,
        AuthContext: AuthContext,
        useAuth: () => React.useContext(AuthContext),
    };
});

// محاكاة ThemeContext
jest.mock('@/contexts/ThemeContext', () => {
    const React = require('react');
    const mockThemeContext = {
        theme: 'light',
        toggleTheme: jest.fn(),
    };
    return {
        ThemeContext: React.createContext(mockThemeContext),
        ThemeProvider: ({ children }) => <div>{children}</div>,
    };
});

// محاكاة next/link
jest.mock('next/link', () => {
    return ({ children, href }) => {
        return <a href={href}>{children}</a>;
    };
});

// محاكاة next/navigation
jest.mock('next/navigation', () => ({
    usePathname: () => '/',
    useRouter: () => ({
        push: jest.fn(),
    }),
}));

describe('مكون الهيدر (Header)', () => {
    it('يعرض الشعار وروابط التنقل الرئيسية', () => {
        render(<Header />);

        expect(screen.getAllByText('الرئيسية')[0]).toBeInTheDocument();
        expect(screen.getAllByText('المفضلة')[0]).toBeInTheDocument();
    });

    it('يعرض زر تسجيل الدخول عندما لا يكون المستخدم مسجلاً للدخول', () => {
        render(<Header />);
        expect(screen.getByText('تسجيل الدخول')).toBeInTheDocument();
    });
});
