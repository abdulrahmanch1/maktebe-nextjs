import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '../Footer';
import '@testing-library/jest-dom';

describe('Footer Component', () => {
  it('renders the copyright notice', () => {
    render(<Footer />);
    const copyrightElement = screen.getByText(/جميع الحقوق محفوظة © 2025/i);
    expect(copyrightElement).toBeInTheDocument();
  });
});
