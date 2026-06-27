/* Route vers le Million — conversions GA4 + consentement Loi 25 + infolettre beehiiv
   gtag.js (G-L9QEBYDL8R) est charge dans le <head> de chaque page ; consent.js y
   fixe le consentement par defaut a 'denied' (opt-in). Ce fichier gere :
     1. la banniere de consentement bilingue (Consent Mode v2) ;
     2. l'evenement de clic d'affiliation ;
     3. le bloc d'infolettre beehiiv (embed), charge UNIQUEMENT apres consentement ;
     4. le helper rvlmTrackNewsletterSignup (appele par la page de remerciement).
   Inclus une seule fois par page via <script src="/analytics.js" defer></script>.
   Aucun emoji. */
(function () {
  'use strict';

  var BEEHIIV_FORM = 'c0ad8e00-1f40-4f5e-967c-dee4df32ce84';
  var BEEHIIV_SRC = 'https://subscribe-forms.beehiiv.com/v3/loader.js';
  var CONSENT_KEY = 'rvlm_consent';

  function ready() { return typeof window.gtag === 'function'; }

  function currentLang() {
    var l = '';
    try { l = window.localStorage ? localStorage.getItem('lang') : ''; } catch (e) { l = ''; }
    if (l === 'fr' || l === 'en' || l === 'es') return l;
    var n = (navigator.language || 'fr').toLowerCase();
    return n.indexOf('es') === 0 ? 'es' : n.indexOf('fr') === 0 ? 'fr' : 'en';
  }

  function retranslate() {
    if (typeof window.applyLang === 'function') {
      try { window.applyLang(currentLang()); } catch (e) {}
    }
  }

  /* ============================================================
     1. CONSENTEMENT (Google Consent Mode v2 — Loi 25, opt-in)
     ============================================================ */
  var T = {
    fr: {
      text: 'Nous utilisons des témoins (cookies) pour mesurer l’audience du site avec Google Analytics, et un service externe (beehiiv) pour l’infolettre. Aucun témoin non essentiel n’est déposé sans votre consentement.',
      accept: 'Accepter', refuse: 'Refuser', more: 'En savoir plus', manage: 'Gérer les témoins'
    },
    en: {
      text: 'We use cookies to measure site traffic with Google Analytics, and a third-party service (beehiiv) for the newsletter. No non-essential cookie is stored without your consent.',
      accept: 'Accept', refuse: 'Decline', more: 'Learn more', manage: 'Manage cookies'
    },
    es: {
      text: 'Utilizamos cookies para medir el tráfico del sitio con Google Analytics y un servicio externo (beehiiv) para el boletín. No se almacena ninguna cookie no esencial sin su consentimiento.',
      accept: 'Aceptar', refuse: 'Rechazar', more: 'Más información', manage: 'Gestionar cookies'
    }
  };

  /* Libelles de secours pour le bloc infolettre (pages sans translations.js,
     ex. etf-explorer et carrieres). Les memes textes sont dans translations.js
     pour le changement de langue en direct. */
  var NL = {
    fr: {
      title: 'Ne manquez aucun article',
      tag: 'Recevez nos nouveaux articles et résumés de lecture par courriel.',
      gate: 'Le formulaire d’inscription utilise un service externe (beehiiv) qui dépose des témoins. Acceptez les témoins pour l’afficher.',
      gateLink: 'Gérer les témoins'
    },
    en: {
      title: 'Never miss an article',
      tag: 'Get our new articles and reading summaries by email.',
      gate: 'The signup form uses a third-party service (beehiiv) that stores cookies. Accept cookies to display it.',
      gateLink: 'Manage cookies'
    },
    es: {
      title: 'No te pierdas ningún artículo',
      tag: 'Recibe nuestros nuevos artículos y resúmenes de lectura por correo.',
      gate: 'El formulario de suscripción utiliza un servicio externo (beehiiv) que almacena cookies. Acepta las cookies para mostrarlo.',
      gateLink: 'Gestionar cookies'
    }
  };

  function storedConsent() {
    try { return window.localStorage ? localStorage.getItem(CONSENT_KEY) : null; } catch (e) { return null; }
  }
  function saveConsent(v) {
    try { if (window.localStorage) localStorage.setItem(CONSENT_KEY, v); } catch (e) {}
  }
  function grantConsent() {
    if (ready()) window.gtag('consent', 'update', { analytics_storage: 'granted' });
    saveConsent('granted');
    mountBeehiiv();
  }
  function denyConsent() { saveConsent('denied'); }

  function injectStyles() {
    if (document.getElementById('rvlm-style')) return;
    var css = [
      /* Banniere de consentement */
      '.rvlm-consent{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;background:#1A2E0A;color:#F5F0E8;',
      'font-family:Jost,system-ui,sans-serif;font-size:13px;line-height:1.6;padding:16px 20px;',
      'box-shadow:0 -4px 24px rgba(0,0,0,0.25);display:flex;gap:16px;align-items:center;justify-content:center;flex-wrap:wrap;}',
      '.rvlm-consent p{margin:0;max-width:680px;}',
      '.rvlm-consent a{color:#B8D890;text-decoration:underline;}',
      '.rvlm-consent .rvlm-actions{display:flex;gap:10px;flex-shrink:0;}',
      '.rvlm-consent button{font-family:inherit;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;',
      'cursor:pointer;border-radius:100px;padding:10px 22px;border:1px solid #607848;background:transparent;color:#F5F0E8;transition:all .2s;}',
      '.rvlm-consent button.rvlm-accept{background:#B8D890;border-color:#B8D890;color:#1A2E0A;}',
      '.rvlm-consent button:hover{opacity:.85;}',
      '@media(max-width:640px){.rvlm-consent{flex-direction:column;align-items:stretch;text-align:center;}',
      '.rvlm-consent .rvlm-actions{justify-content:center;}}',
      /* Bloc infolettre */
      '.rvlm-nl{background:#E8DCC8;border-top:1px solid #C8D4B0;padding:56px 24px;text-align:center;}',
      '.rvlm-nl-title{font-family:"Playfair Display",Georgia,serif;font-weight:400;font-size:26px;color:#1A2E0A;margin:0 0 8px;}',
      '.rvlm-nl-tag{font-family:Jost,system-ui,sans-serif;font-size:15px;color:#607848;margin:0 auto 22px;max-width:480px;line-height:1.6;}',
      '.rvlm-nl-mount{max-width:480px;margin:0 auto;}',
      '.rvlm-nl-gate{font-family:Jost,system-ui,sans-serif;font-size:13px;color:#607848;max-width:480px;margin:0 auto;line-height:1.6;}',
      '.rvlm-nl-gate a{color:#2D4A1A;text-decoration:underline;cursor:pointer;}',
      /* Lien permanent "Gerer les temoins" en pied de page */
      '.rvlm-manage{flex-basis:100%;font-family:Jost,system-ui,sans-serif;font-size:10px;letter-spacing:1px;margin-top:6px;}',
      '.rvlm-manage a{color:#607848;text-decoration:underline;cursor:pointer;}'
    ].join('');
    var s = document.createElement('style');
    s.id = 'rvlm-style';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function showBanner() {
    if (document.querySelector('.rvlm-consent')) return;
    injectStyles();
    var d = T[currentLang()] || T.fr;

    var bar = document.createElement('div');
    bar.className = 'rvlm-consent';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-live', 'polite');

    /* Texte et lien ont CHACUN leur data-i18n sur des noeuds distincts :
       applyLang fait innerHTML = t, donc un data-i18n sur le <p> parent
       effacerait le lien enfant. */
    var p = document.createElement('p');
    var span = document.createElement('span');
    span.setAttribute('data-i18n', 'consent.banner.text');
    span.textContent = d.text;
    var a = document.createElement('a');
    a.href = '/divulgation.html';
    a.setAttribute('data-i18n', 'consent.banner.more');
    a.textContent = d.more;
    p.appendChild(span);
    p.appendChild(document.createTextNode(' '));
    p.appendChild(a);

    var actions = document.createElement('div');
    actions.className = 'rvlm-actions';

    var refuse = document.createElement('button');
    refuse.type = 'button';
    refuse.setAttribute('data-i18n', 'consent.banner.refuse');
    refuse.textContent = d.refuse;
    refuse.addEventListener('click', function () { denyConsent(); bar.remove(); });

    var accept = document.createElement('button');
    accept.type = 'button';
    accept.className = 'rvlm-accept';
    accept.setAttribute('data-i18n', 'consent.banner.accept');
    accept.textContent = d.accept;
    accept.addEventListener('click', function () { grantConsent(); bar.remove(); });

    actions.appendChild(refuse);
    actions.appendChild(accept);
    bar.appendChild(p);
    bar.appendChild(actions);
    document.body.appendChild(bar);
    retranslate();
  }

  /* Permet de rouvrir le choix (lien "Gerer les temoins"). */
  window.rvlmManageConsent = function () { showBanner(); };

  /* Lien permanent "Gerer les temoins" ajoute au pied de page de chaque page. */
  function injectFooterLink() {
    var f = document.querySelector('footer');
    if (!f || f.querySelector('.rvlm-manage')) return;
    var p = document.createElement('p');
    p.className = 'rvlm-manage';
    var a = document.createElement('a');
    a.href = '#';
    a.setAttribute('data-i18n', 'consent.manage');
    a.textContent = (T[currentLang()] || T.fr).manage;
    a.addEventListener('click', function (e) { e.preventDefault(); showBanner(); });
    p.appendChild(a);
    f.appendChild(p);
  }

  /* ============================================================
     2. Evenement : clic sur un lien d'affiliation sortant
     ============================================================ */
  var AFFILIATES = [
    { name: 'wealthsimple', match: /wealthsimple\.com/i },
    { name: 'amazon',       match: /(amazon\.[a-z.]+|amzn\.)/i },
    { name: 'tangerine',    match: /tangerine\.ca/i },
    { name: 'borrowell',    match: /borrowell\.com/i }
  ];
  function affiliateFor(url) {
    for (var i = 0; i < AFFILIATES.length; i++) {
      if (AFFILIATES[i].match.test(url)) return AFFILIATES[i].name;
    }
    return null;
  }
  document.addEventListener('click', function (e) {
    var node = e.target;
    var a = (node && node.closest) ? node.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (!/^https?:\/\//i.test(href)) return;
    var name = affiliateFor(href);
    if (!name || !ready()) return;
    var domain = '';
    try { domain = new URL(href, window.location.href).hostname; } catch (err) { domain = ''; }
    window.gtag('event', 'affiliate_click', {
      affiliate: name,
      link_url: href,
      link_domain: domain,
      link_text: (a.textContent || '').trim().slice(0, 100),
      page_path: window.location.pathname,
      outbound: true
    });
  }, true);

  /* ============================================================
     3. Infolettre beehiiv (embed) — bloc reutilisable
     Marqueur dans la page : <div data-newsletter></div>
     L'embed (tiers, depose des temoins) n'est charge qu'apres consentement.
     ============================================================ */
  function renderNewsletter() {
    var hosts = document.querySelectorAll('[data-newsletter]');
    if (!hosts.length) return;
    var nl = NL[currentLang()] || NL.fr;
    Array.prototype.forEach.call(hosts, function (host) {
      if (host.__rvlmNl) return;
      host.__rvlmNl = true;
      host.classList.add('rvlm-nl');

      var h = document.createElement('h2');
      h.className = 'rvlm-nl-title';
      h.setAttribute('data-i18n', 'newsletter.title');
      h.textContent = nl.title;

      var tag = document.createElement('p');
      tag.className = 'rvlm-nl-tag';
      tag.setAttribute('data-i18n', 'newsletter.tag');
      tag.textContent = nl.tag;

      var mount = document.createElement('div');
      mount.className = 'rvlm-nl-mount';

      var gate = document.createElement('p');
      gate.className = 'rvlm-nl-gate';
      var gspan = document.createElement('span');
      gspan.setAttribute('data-i18n', 'newsletter.gate');
      gspan.textContent = nl.gate;
      var glink = document.createElement('a');
      glink.href = '#';
      glink.setAttribute('data-i18n', 'newsletter.gate.link');
      glink.textContent = nl.gateLink;
      glink.addEventListener('click', function (e) { e.preventDefault(); showBanner(); });
      gate.appendChild(gspan);
      gate.appendChild(document.createTextNode(' '));
      gate.appendChild(glink);

      host.appendChild(h);
      host.appendChild(tag);
      host.appendChild(mount);
      host.appendChild(gate);
      host.__mount = mount;
      host.__gate = gate;
    });
    retranslate();
    mountBeehiiv();
  }

  function mountBeehiiv() {
    var granted = storedConsent() === 'granted';
    var hosts = document.querySelectorAll('[data-newsletter]');
    Array.prototype.forEach.call(hosts, function (host) {
      var mount = host.__mount, gate = host.__gate;
      if (!mount) return;
      if (granted) {
        if (gate) gate.style.display = 'none';
        if (!mount.__loaded) {
          mount.__loaded = true;
          var s = document.createElement('script');
          s.async = true;
          s.src = BEEHIIV_SRC;
          s.setAttribute('data-beehiiv-form', BEEHIIV_FORM);
          mount.appendChild(s);
        }
      } else if (gate) {
        gate.style.display = '';
      }
    });
  }

  /* ============================================================
     4. Evenement : inscription a l'infolettre (succes)
     Appele par la page de remerciement /merci-infolettre/ (redirect beehiiv).
     ============================================================ */
  window.rvlmTrackNewsletterSignup = function (meta) {
    if (!ready()) return;
    meta = meta || {};
    window.gtag('event', 'newsletter_signup', {
      method: meta.method || 'beehiiv_embed',
      page_path: window.location.pathname
    });
  };

  /* ============================================================
     Initialisation
     ============================================================ */
  function init() {
    injectStyles();
    injectFooterLink();
    if (storedConsent() === null) showBanner();
    renderNewsletter();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
