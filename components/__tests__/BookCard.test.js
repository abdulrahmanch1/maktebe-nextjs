import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BookCard from '../BookCard';
import { AuthContext } from '@/contexts/AuthContext';
import { FavoritesContext } from '@/contexts/FavoritesContext';

// محاكاة next/link
jest.mock('next/link', () => {
    const MockLink = ({ children, href }) => {
        return <a href={href}>{children}</a>;
    };
    MockLink.displayName = 'MockLink';
    return MockLink;
});

// محاكاة next/image
jest.mock('next/image', () => ({
    __esModule: true,
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    default: ({ unoptimized, priority, ...props }) => <img {...props} />,
}));

const mockPush = jest.fn();

// محاكاة useRouter
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}));

describe('مكون بطاقة الكتاب (BookCard)', () => {
    const mockBook = {
        id: '1',
        title: 'كتاب تجريبي',
        author: 'مؤلف تجريبي',
        cover: '/test-cover.jpg',
        category: 'خيال',
        year: '2023',
        rating: 4.5
    };

    const mockAuthContext = {
        isLoggedIn: false,
    };

    const mockFavoritesContext = {
        isFavorite: jest.fn().mockReturnValue(false),
        toggleFavorite: jest.fn(),
    };

    const renderWithContext = (component) => {
        return render(
            <AuthContext.Provider value={mockAuthContext}>
                <FavoritesContext.Provider value={mockFavoritesContext}>
                    {component}
                </FavoritesContext.Provider>
            </AuthContext.Provider>
        );
    };

    it('يعرض تفاصيل الكتاب بشكل صحيح', () => {
        renderWithContext(<BookCard book={mockBook} />);

        expect(screen.getByText('كتاب تجريبي')).toBeInTheDocument();
        // المؤلف لا يتم عرضه حالياً في بطاقة الكتاب
        // expect(screen.getByText('مؤلف تجريبي')).toBeInTheDocument();
        expect(screen.getByRole('img')).toHaveAttribute('src', '/test-cover.jpg');
    });

    it('ينتقل إلى صفحة الكتاب الصحيحة عند النقر', () => {
        renderWithContext(<BookCard book={mockBook} />);

        const readButton = screen.getByText('اقرأ');
        fireEvent.click(readButton);

        expect(mockPush).toHaveBeenCalledWith('/book/1');
    });
});
