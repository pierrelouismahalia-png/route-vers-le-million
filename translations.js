const i18n = {
  fr: {
    /* ── Navigation ── */
    'nav.about':              'À PROPOS',
    'nav.celiReer':           'CÉLI &amp; REER',
    'nav.etf':                'ETFs',
    'nav.outils':             'Outils',
    'nav.articles':           'Articles',
    'nav.accueil':            'Accueil',
    'nav.allArticles':        'Tous les articles',
    'nav.fondsUrgence':       'Fonds d\'urgence',
    'nav.monParcours':        'Mon parcours',
    'nav.ouvrirWealthsimple': 'Ouvrir Wealthsimple →',
    /* ── Footer ── */
    'footer.tagline':         '<strong>Route vers le Million</strong> · Finances personnelles · Québec, Canada',
    'footer.disclaimer':      'À titre informatif seulement — ne constitue pas un conseil financier officiel.',
    /* ── Divulgation ── */
    'disclosure.footer':      'Route vers le Million contient des liens d\'affiliation (Wealthsimple, Tangerine, Borrowell, Amazon). Si tu t\'inscris ou achètes via mes liens, je reçois une commission sans frais supplémentaires pour toi. — <a href="/divulgation.html" style="color:inherit;text-decoration:underline;">En savoir plus →</a>',
    'disclosure.articleBox':  'ⓘ Divulgation : Cet article contient des liens d\'affiliation. Si tu t\'inscris ou achètes via mes liens, je touche une commission, sans frais supplémentaires pour toi. Mes recommandations restent basées sur mon usage personnel.',
  },
  en: {
    /* ── Navigation ── */
    'nav.about':              'ABOUT',
    'nav.celiReer':           'TFSA &amp; RRSP',
    'nav.etf':                'ETFs',
    'nav.outils':             'Tools',
    'nav.articles':           'Articles',
    'nav.accueil':            'Home',
    'nav.allArticles':        'All articles',
    'nav.fondsUrgence':       'Emergency Fund',
    'nav.monParcours':        'My journey',
    'nav.ouvrirWealthsimple': 'Open Wealthsimple →',
    /* ── Footer ── */
    'footer.tagline':         '<strong>Route vers le Million</strong> · Personal Finance · Québec, Canada',
    'footer.disclaimer':      'For informational purposes only — not official financial advice.',
    /* ── Divulgation ── */
    'disclosure.footer':      'Route vers le Million contains affiliate links (Wealthsimple, Tangerine, Borrowell, Amazon). If you sign up or buy through my links, I earn a commission at no extra cost to you. — <a href="/en/disclosure.html" style="color:inherit;text-decoration:underline;">Learn more →</a>',
    'disclosure.articleBox':  'ⓘ Disclosure: This article contains affiliate links. If you sign up or purchase through my links, I earn a commission at no extra cost to you. My recommendations are based on my personal use.',
  },
  es: {
    /* ── Navigation ── */
    'nav.about':              'SOBRE MÍ',
    'nav.celiReer':           'CELI &amp; REER',
    'nav.etf':                'ETFs',
    'nav.outils':             'Herramientas',
    'nav.articles':           'Artículos',
    'nav.accueil':            'Inicio',
    'nav.allArticles':        'Todos los artículos',
    'nav.fondsUrgence':       'Fondo de emergencia',
    'nav.monParcours':        'Mi trayectoria',
    'nav.ouvrirWealthsimple': 'Abrir Wealthsimple →',
    /* ── Footer ── */
    'footer.tagline':         '<strong>Route vers le Million</strong> · Finanzas personales · Québec, Canadá',
    'footer.disclaimer':      'Solo con fines informativos — no constituye asesoramiento financiero oficial.',
    /* ── Divulgation ── */
    'disclosure.footer':      'Route vers le Million contiene enlaces de afiliados (Wealthsimple, Tangerine, Borrowell, Amazon). Si te registras o compras a través de mis enlaces, recibo una comisión sin costo adicional para ti. — <a href="/es/divulgacion.html" style="color:inherit;text-decoration:underline;">Más información →</a>',
    'disclosure.articleBox':  'ⓘ Divulgación: Este artículo contiene enlaces de afiliados. Si te registras o compras a través de mis enlaces, recibo una comisión sin costo adicional para ti. Mis recomendaciones están basadas en mi uso personal.',
  }
};

(function () {
  var s = document.createElement('style');
  s.textContent = '@media(max-width:768px){.lang-switcher-nav{display:none!important;}}';
  document.head.appendChild(s);
})();

function applyLang(lang) {
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var key = el.getAttribute('data-i18n');
    var t = i18n[lang] && i18n[lang][key];
    if (t) el.innerHTML = t;
  });
  document.documentElement.lang = lang;
  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    var active = btn.getAttribute('data-lang') === lang;
    btn.style.color = active ? 'var(--text)' : 'var(--muted)';
    btn.style.fontWeight = active ? '500' : '300';
  });
}

function setLang(lang) {
  localStorage.setItem('lang', lang);
  applyLang(lang);
}

(function () {
  var lang = localStorage.getItem('lang');
  if (!lang) {
    var nav = (navigator.language || 'fr').toLowerCase();
    lang = nav.startsWith('es') ? 'es' : nav.startsWith('fr') ? 'fr' : 'en';
  }
  document.addEventListener('DOMContentLoaded', function () {
    applyLang(lang);
  });
})();
