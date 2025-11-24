'use client';

import { useEffect, useState } from 'react';

const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-YDBSPJW01T';

function loadGtmOnce() {
  if (typeof window === 'undefined') return;
  if (window.__gtmLoaded) return;
  window.__gtmLoaded = true;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

  const gtmScript = document.createElement('script');
  gtmScript.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  gtmScript.async = true;
  document.head.appendChild(gtmScript);

  const inline = document.createElement('script');
  inline.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${MEASUREMENT_ID}');
  `;
  document.head.appendChild(inline);
}

export default function AnalyticsLoader() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const triggerLoad = () => {
      if (loaded) return;
      setLoaded(true);
      loadGtmOnce();
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener('scroll', triggerLoad);
      window.removeEventListener('pointerdown', triggerLoad);
      window.removeEventListener('keydown', triggerLoad);
    };

    window.addEventListener('scroll', triggerLoad, { once: true, passive: true });
    window.addEventListener('pointerdown', triggerLoad, { once: true });
    window.addEventListener('keydown', triggerLoad, { once: true });

    return () => cleanup();
  }, [loaded]);

  return null;
}
