// src/serviceWorkerRegistration.js
// version simplifiée de CRA que tu peux coller

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    // [::1] is l'adresse IPv6 localhost.
    window.location.hostname === '[::1]' ||
    // 127.0.0.0/8 plages IPv4 localhost.
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
);

export function register(config) {
  if ('serviceWorker' in navigator) {
    // URL du service worker généré par CRA lors du build (dans public)
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      // On ne peut pas enregistrer le SW sur un autre domaine.
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        // Vérification rapide en localhost
        checkValidServiceWorker(swUrl, config);
        // Affiche à la console que localhost utilise le SW
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'Ce site est servi par un service worker en mode localhost.'
          );
        });
      } else {
        // Enregistrement normal pour prod
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Nouvelle mise à jour disponible
              console.log(
                'Nouvelle version disponible; merci de rafraîchir la page.'
              );

              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // Le contenu est mis en cache pour une utilisation hors ligne.
              console.log('Contenu mis en cache pour une utilisation hors ligne.');

              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Erreur lors de l’enregistrement du service worker:', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  // Vérifie que le service worker peut être chargé.
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // Pas de fichier service worker trouvé, on recharge la page sans service worker.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker dispo. On l’enregistre normalement.
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log(
        'Aucune connexion internet trouvée. L’app fonctionne en mode hors-ligne.'
      );
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}
