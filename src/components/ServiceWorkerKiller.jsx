'use client';

import { useEffect } from 'react';

export default function ServiceWorkerKiller() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Unregister all stale service workers from previous projects on this port
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (let r of registrations) {
            r.unregister();
            console.log('Unregistered stale service worker:', r);
          }
        });
      }
      // 2. Clear old browser cache storage
      if ('caches' in window) {
        caches.keys().then((names) => {
          for (let name of names) {
            caches.delete(name);
          }
        });
      }
    }
  }, []);

  return null;
}
