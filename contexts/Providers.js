'use client';

import { AuthProvider } from './AuthContext';
import { FavoritesProvider } from './FavoritesContext';
import { ThemeProvider } from './ThemeContext';
import 'react-toastify/dist/ReactToastify.css';
import DynamicToastContainer from '@/components/DynamicToastContainer';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Data is fresh forever until reload or explicit invalidation
        staleTime: Infinity,
        gcTime: Infinity, // Keep in cache as long as possible
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}
