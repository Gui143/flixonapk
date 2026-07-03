// ─────────────────────────────────────────────────────────────
//  Adblock Mobile (camada JS — complementa o nativo)
//
//  IMPORTANTE: esta camada só remove elementos de DOM de anúncio
//  que já foram injetados e neutraliza window.open.
//  NÃO intercepta fetch/XHR por palavra-chave (quebra o player fembed).
//  O bloqueio de rede é feito pelo nativo (Java) por DOMÍNIO.
// ─────────────────────────────────────────────────────────────

// Seletores CSS de overlays de anúncio (cassino/tigrinho/popups)
const AD_CSS_SELECTORS = [
  '[id*="banner"]', '[id*="ad-banner"]', '[id*="popup"]',
  '[id*="overlay-ad"]', '[id*="advert"]', '[id*="promo"]',
  '[class*="banner-ad"]', '[class*="advert"]', '[class*="promo"]',
  '[class*="popup-ad"]',
  'ins.adsbygoogle',
  'div[style*="z-index: 2147483647"]',
  // Cassino / tigrinho
  '[class*="tigrinho"]', '[id*="tigrinho"]',
  '[class*="fortune-tiger"]', '[id*="fortune-tiger"]',
  '[class*="casino"]', '[id*="casino"]',
  // Iframes de anúncio por domínio conhecido (NÃO por palavra genérica)
  'iframe[src*="doubleclick"]', 'iframe[src*="googlesyndication"]',
  'iframe[src*="taboola"]', 'iframe[src*="outbrain"]',
  'iframe[src*="popads"]', 'iframe[src*="propeller"]',
  'iframe[src*="monetag"]', 'iframe[src*="adsterra"]'
];

export const MOBILE_ADBLOCK_SCRIPT = `
(function () {
  try {
    // 1) Neutraliza window.open (popups/pop-under)
    window.open = function () { return null; };

    // 2) Bloqueia top.location redirect (truque comum dos players)
    try {
      Object.defineProperty(window.top, 'location', {
        configurable: false,
        get: function () { return window.location; },
        set: function () { /* BLOQUEADO */ }
      });
    } catch (e) {}

    // 3) Intercepta cliques em links target=_blank (anúncios)
    document.addEventListener('click', function (ev) {
      try {
        var t = ev.target;
        while (t && t !== document.body) {
          if (t.tagName === 'A' && t.target === '_blank') {
            ev.preventDefault();
            ev.stopPropagation();
            return false;
          }
          t = t.parentNode;
        }
      } catch (e) {}
    }, true);

    // 4) Remove overlays de anúncio (NÃO remove o player de vídeo!)
    var SEL = ${JSON.stringify(AD_CSS_SELECTORS)};
    function removeAds() {
      try {
        SEL.forEach(function (sel) {
          document.querySelectorAll(sel).forEach(function (el) {
            // Protege o player: não remove nada que contenha <video>
            if (el.tagName === 'VIDEO') return;
            if (el.querySelector && el.querySelector('video')) return;
            if (el.parentNode) el.parentNode.removeChild(el);
          });
        });
      } catch (e) {}
    }
    removeAds();
    var observer = new MutationObserver(function () { removeAds(); });
    if (document.documentElement) {
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
    setInterval(removeAds, 1500);
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
}
