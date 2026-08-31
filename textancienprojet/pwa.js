(function disablePwaFeatures() {
  const isCapacitorApp = !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) || window.location.protocol === 'capacitor:';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations?.().then((registrations) => {
      registrations.forEach((registration) => registration.unregister().catch(() => {}));
    }).catch(() => {});
  }

  if (isCapacitorApp) {
    document.body.classList.add('capacitor-app');
  }
})();

window.TEXTPLAYSTORE_NATIVE = true;

