const i18n = {
  fr: {
    'disclosure.footer':     'Route vers le Million contient des liens d\'affiliation (Wealthsimple, Tangerine, Borrowell, Amazon). Si tu t\'inscris ou achètes via mes liens, je reçois une commission sans frais supplémentaires pour toi. — <a href="/divulgation.html" style="color:inherit;text-decoration:underline;">En savoir plus →</a>',
    'disclosure.articleBox': 'ⓘ Divulgation : Cet article contient des liens d\'affiliation. Si tu t\'inscris ou achètes via mes liens, je touche une commission, sans frais supplémentaires pour toi. Mes recommandations restent basées sur mon usage personnel.',
  },
  en: {
    'disclosure.footer':     'Route vers le Million contains affiliate links (Wealthsimple, Tangerine, Borrowell, Amazon). If you sign up or buy through my links, I earn a commission at no extra cost to you. — <a href="/en/disclosure.html" style="color:inherit;text-decoration:underline;">Learn more →</a>',
    'disclosure.articleBox': 'ⓘ Disclosure: This article contains affiliate links. If you sign up or purchase through my links, I earn a commission at no extra cost to you. My recommendations are based on my personal use.',
  },
  es: {
    'disclosure.footer':     'Route vers le Million contiene enlaces de afiliados (Wealthsimple, Tangerine, Borrowell, Amazon). Si te registras o compras a través de mis enlaces, recibo una comisión sin costo adicional para ti. — <a href="/es/divulgacion.html" style="color:inherit;text-decoration:underline;">Más información →</a>',
    'disclosure.articleBox': 'ⓘ Divulgación: Este artículo contiene enlaces de afiliados. Si te registras o compras a través de mis enlaces, recibo una comisión sin costo adicional para ti. Mis recomendaciones están basadas en mi uso personal.',
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
