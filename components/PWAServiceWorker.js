'use client';

import { useEffect } from 'react';

const PWAServiceWorker = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((error) => {
          console.error('فشل تسجيل Service Worker:', error);
        });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register);
    }

    return () => {
      window.removeEventListener('load', register);
    };
  }, []);

  return null;
};

export default PWAServiceWorker;
