(function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
            const registration = await navigator.serviceWorker.register('./service-worker.js', { scope: './' });
            setupUpdateButton(registration);

            if (isStandaloneMode()) {
                registration.update().catch(function() {});

                window.addEventListener('focus', function() {
                    registration.update().catch(function() {});
                });

                document.addEventListener('visibilitychange', function() {
                    if (document.visibilityState === 'visible') {
                        registration.update().catch(function() {});
                    }
                });
            }
    } catch (err) {
      // Silently ignore to avoid breaking the app
    }
  });
})();

function isStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isCapacitorApp() {
    return !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform())
        || window.location.protocol === 'capacitor:';
}

function hideSplash() {
    var splash = document.getElementById('appSplash');
    if (!splash) return;
    splash.classList.add('is-hidden');
    setTimeout(function() {
        splash.style.display = 'none';
    }, 300);
}

function getInstallInstructions() {
    var ua = navigator.userAgent || '';
    var userAgent = ua.toLowerCase();

    if (userAgent.includes('edg')) {
        return 'Sur Edge : menu ⋮ → « Installer l\'application ». Le bouton va aussi proposer l\'installation si le navigateur le permet.';
    }

    if (userAgent.includes('brave')) {
        return 'Sur Brave : menu ⋮ → « Installer l\'application » ou « Applications ». Si tu ne vois pas l\'option, vérifie que le site est bien ouvert en HTTPS.';
    }

    if (userAgent.includes('chrome') || userAgent.includes('crios')) {
        return 'Sur Chrome : menu ⋮ → « Installer l\'application ». Si l\'option n\'apparaît pas, ouvre le site en https et réessaie dans quelques secondes.';
    }

    if (/iphone|ipad|ipod/.test(userAgent)) {
        return 'Sur iPhone/iPad : touche Partager → « Ajouter à l\'écran d\'accueil ». Cela fonctionne uniquement dans Safari.';
    }

    if (userAgent.includes('safari') && !userAgent.includes('chrome') && !userAgent.includes('android')) {
        return 'Sur Safari : touche Partager → « Ajouter à l\'écran d\'accueil ». Ce navigateur n\'active pas le prompt PWA automatique.';
    }

    if (userAgent.includes('firefox')) {
        return 'Firefox ne supporte pas bien l\'installation PWA automatique. Ouvre le site dans Chrome, Edge ou Brave pour installer l\'application.';
    }

    return 'Ce navigateur ne prend pas en charge l\'installation automatique de l\'application. Ouvre le site dans Chrome, Edge ou Brave et utilise le menu du navigateur.';
}

function canUseNativeInstallPrompt() {
    return 'BeforeInstallPromptEvent' in window || 'beforeinstallprompt' in window;
}

function setupUpdateButton(registration) {
    return;
}

// ─── Splash d'ouverture unique (sans écran PWA) ───
(function() {
    var splash = document.getElementById('appSplash');
    if (splash) {
        setTimeout(hideSplash, 4200);
    }
})();
