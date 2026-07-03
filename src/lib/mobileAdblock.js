// ─────────────────────────────────────────────────────────────
//  Adblock Mobile (camada JS — complementa o nativo)
//
//  O nativo (Java shouldInterceptRequest + shouldOverrideUrlLoading)
//  bloqueia a rede. Este módulo remove overlays de anúncio que já
//  foram injetados no DOM e neutraliza redirecionamentos de clique.
// ─────────────────────────────────────────────────────────────
import { AD_DOMAINS } from '../lib/adblockList';

// Seletores CSS de overlays de anúncio comuns (inclui cassino/tigrinho)
const AD_CSS_SELECTORS = [
  // Banners e overlays típicos
  '[id*="banner"]', '[id*="ad-"]', '[id*="ads"]', '[id*="popup"]',
  '[id*="overlay"]', '[id*="advert"]', '[id*="promo"]', '[id*="modal"]',
  '[class*="banner"]', '[class*="advert"]', '[class*="promo"]',
  '[class*="overlay-ad"]', '[class*="popup"]',
  'ins.adsbygoogle',
  'div[style*="z-index: 2147483647"]',
  'div[style*="position: fixed"][style*="top: 0"]',
  // Iframes de anúncio
  'iframe[src*="doubleclick"]', 'iframe[src*="googlesyndication"]',
  'iframe[src*="taboola"]', 'iframe[src*="outbrain"]',
  'iframe[src*="popads"]', 'iframe[src*="propeller"]',
  // Cassino / tigrinho
  'iframe[src*="fortune"]', 'iframe[src*="tiger"]', 'iframe[src*="casino"]',
  'div[class*="casino"]', 'div[id*="fortune"]', 'div[id*="tiger"]',
  '[class*="tigrinho"]', '[id*="tigrinho"]',
  // Ads genéricos de players
  'div[id*="vast"]', 'div[class*="vast"]',
  'div[id*="preroll"]', 'div[class*="preroll"]'
];

export const MOBILE_ADBLOCK_SCRIPT = `
(function () {
  try {
    var AD = ${JSON.stringify(AD_DOMAINS)};
    var KEYWORDS = [
      'fortune-tiger', 'fortunetiger', 'fortune_tiger', 'fortune.tiger',
      'tigrinho', 'jogo-do-tigre', 'tiger-fortune', 'lucky-tiger',
      'fortune-rabbit', 'fortune-mouse', 'fortune-ox', 'fortune-dragon',
      'cassino', 'casino-online', 'apostas', 'crash-game', 'aviator',
      'popunder', 'pop-under', 'adclick', 'monetag', 'propellerads',
      'adcash', 'adsterra', 'popads', 'hilltopads', 'adskeeper'
    ];

    function isAd(url) {
      if (!url) return false;
      var u = url.toLowerCase();
      try { var h = new URL(url).hostname.toLowerCase();
        if (AD.some(function (d) { return h === d || h.indexOf('.' + d) === h.length - d.length - 1; })) return true;
      } catch (e) {}
      return KEYWORDS.some(function (k) { return u.indexOf(k) !== -1; });
    }

    // 1) Intercepta fetch()
    var origFetch = window.fetch;
    if (origFetch) {
      window.fetch = function (input, init) {
        var u = (typeof input === 'string') ? input : (input && input.url) || '';
        if (isAd(u)) return Promise.resolve(new Response('', { status: 204 }));
        return origFetch.apply(this, arguments);
      };
    }

    // 2) Intercepta XMLHttpRequest
    var OrigXHR = window.XMLHttpRequest;
    if (OrigXHR) {
      var origOpen = OrigXHR.prototype.open;
      OrigXHR.prototype.open = function (method, url) {
        if (isAd(url)) { this._blocked = true; }
        return origOpen.apply(this, arguments);
      };
      var origSend = OrigXHR.prototype.send;
      OrigXHR.prototype.send = function () {
        if (this._blocked) return;
        return origSend.apply(this, arguments);
      };
    }

    // 3) Neutraliza window.open
    window.open = function () { return null; };

    // 4) Bloqueia top.location redirect (o player tenta redirecionar o app)
    try {
      var origTopLocation = window.top.location;
      Object.defineProperty(window.top, 'location', {
        configurable: false,
        get: function () { return origTopLocation; },
        set: function () { /* BLOQUEADO */ }
      });
    } catch (e) {}

    // 5) Remove overlays/banners de anúncio continuamente
    var AD_SEL = ${JSON.stringify(AD_CSS_SELECTORS)};
    function removeAds() {
      try {
        AD_SEL.forEach(function (sel) {
          document.querySelectorAll(sel).forEach(function (el) {
            // Não remove o próprio player de vídeo!
            if (el.tagName === 'VIDEO' || el.querySelector('video')) return;
            if (el.parentNode) el.parentNode.removeChild(el);
          });
        });
        // Remove iframes de anúncio por src
        document.querySelectorAll('iframe').forEach(function (iframe) {
          if (isAd(iframe.src)) {
            if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
          }
        });
      } catch (e) {}
    }
    removeAds();
    var observer = new MutationObserver(function () { removeAds(); });
    if (document.documentElement) {
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
    setInterval(removeAds, 1000);
  } catch (e) {}
})();
`;

// Inicializa no documento principal (apenas mobile)
export function initMobileAdblock() {
  const cap = typeof window !== 'undefined' ? window.Capacitor : undefined;
  const isMobile =
    !!(cap && cap.isNativePlatform && cap.isNativePlatform()) ||
    (typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent));

  if (!isMobile) return;

  // Injeta no documento principal
  try {
    const script = document.createElement('script');
    script.textContent = MOBILE_ADBLOCK_SCRIPT;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  } catch (e) {}

  // Re-injeta nos iframes quando carregam (se for same-origin)
  const injectIntoIframes = () => {
    try {
      document.querySelectorAll('iframe').forEach((iframe) => {
        try {
          if (iframe.contentWindow && iframe.contentWindow.document) {
            const s = iframe.contentWindow.document.createElement('script');
            s.textContent = MOBILE_ADBLOCK_SCRIPT;
            (iframe.contentWindow.document.head ||
              iframe.contentWindow.document.documentElement).appendChild(s);
            s.remove();
          }
        } catch (e) {
          /* cross-origin — o bloqueio nativo (Java) cuida */
        }
      });
    } catch (e) {}
  };

  const observer = new MutationObserver(() => injectIntoIframes());
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  setInterval(injectIntoIframes, 2000);
}
