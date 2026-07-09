"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    // Only register service worker in browser environments and in production/staging environments
    // or when the environment is ready for it.
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("[PWA] Service Worker registered scope:", registration.scope);
          })
          .catch((err) => {
            console.error("[PWA] Service Worker registration failed:", err);
          });
      });
    }
  }, []);

  return null;
}
