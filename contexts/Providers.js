'use client';

import { AuthProvider } from './AuthContext';
import { FavoritesProvider } from './FavoritesContext';
import { ThemeProvider } from './ThemeContext';
import 'react-toastify/dist/ReactToastify.css';
import DynamicToastContainer from '@/components/DynamicToastContainer';

export function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FavoritesProvider>
          {children}
          <DynamicToastContainer
            position="bottom-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </FavoritesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
