'use client';

import { useEffect } from 'react';

/** Registra el service worker — habilita el prompt de instalación en Android/Chrome. */
export function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Sin service worker la app sigue funcionando normal, solo no es instalable.
      });
    }
  }, []);

  return null;
}
