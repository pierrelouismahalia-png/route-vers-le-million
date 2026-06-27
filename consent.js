/* Route vers le Million — Google Consent Mode v2 (Loi 25, opt-in)
   Charge de facon SYNCHRONE dans le <head>, AVANT le chargeur gtag.js et
   avant gtag('config', ...). Par defaut, aucun temoin non essentiel ne se
   depose : analytics_storage et signaux publicitaires sont 'denied'.
   Le consentement n'est accorde que si l'utilisateur a deja choisi 'granted'
   (la banniere, dans analytics.js, gere le choix initial). Aucun emoji. */
(function () {
  'use strict';
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  });

  /* Honore un consentement deja accorde lors d'une visite precedente,
     le plus tot possible pour eviter toute perte de mesure. */
  try {
    if (window.localStorage && localStorage.getItem('rvlm_consent') === 'granted') {
      gtag('consent', 'update', { analytics_storage: 'granted' });
    }
  } catch (e) { /* localStorage indisponible : on reste en 'denied' */ }
})();
