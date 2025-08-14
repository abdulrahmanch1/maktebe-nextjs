'use client';

import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';
import { FavoritesProvider } from './FavoritesContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function Providers({ children }) {
  return (
    <ThemeProvider>
      {/* <AuthProvider> */}
        <FavoritesProvider>
          {children}
          <ToastContainer 
            position="top-center" 
            autoClose={3000} 
            hideProgressBar={false} 
            newestOnTop={false} 
            closeOnClick 
            rtl 
            pauseOnFocusLoss 
            draggable 
            pauseOnHover 
          />
        </FavoritesProvider>
      {/* </AuthProvider> */}
    </ThemeProvider>
  );
}
