// ─────────────────────────────────────────────────────────────
//  Adblock para Mobile (Android WebView / TV Box)
//
//  No Electron usamos session.webRequest (processo principal).
//  No WebView do Android isso não existe, então injetamos JS que:
//   1) Intercepta fetch() e XMLHttpRequest bloqueando domínios de anúncio
//   2) Remove overlays/banners de anúncio via MutationObserver
//   3) Neutraliza window.open (popups/pop-under)
// ─────────────────────────────────────────────────────────────
import { AD_DOMAINS } from '../lib/adblockList';

// Script injetado no documento principal e nos iframes de embed.
// Roda cedo (antes dos scripts de anúncio carregarem).
export const MOBILE_ADBLOCK_SCRIPT = `
(function () {
  try {
    var AD = ${JSON.stringify(AD_DOMAINS)};
    function isAd(url) {
      try { var h = new URL(url).hostname.toLowerCase(); }
      catch (e) { return false; }
      return AD.some(function (d) { return h === d || h.indexOf('.' + d) === h.length - d.length - 1; });
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
        if (this._blocked) { return; }
        return origSend.apply(this, arguments);
      };
    }

    // 3) Neutraliza window.open (popups/pop-under)
    window.open = function () { return null; };

    // 4) Intercepta criação de <iframe>, <script>, <img> de anúncio
    function blockNode(node) {
      if (!node || node.nodeType !== 1) return;
      var url = node.src || node.href || node.data || '';
      if (url && isAd(url)) {
        node.remove ? node.remove() : (node.parentNode && node.parentNode.removeChild(node));
        return;
      }
    }
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(blockNode);
      });
    });
    if (document.documentElement) {
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    // 5) Remove overlays/banners de anúncio típicos
    function removeAds() {
      try {
        var sels = [
          '[id*="banner"]', '[id*="ad-"]', '[id*="ads"]', '[id*="popup"]',
          '[class*="banner"]', '[class*="advert"]', '[class*="promo"]',
          '[class*="overlay"]', 'ins.adsbygoogle',
          'iframe[src*="doubleclick"]', 'iframe[src*="googlesyndication"]',
          'iframe[src*="taboola"]', 'iframe[src*="outbrain"]',
          'div[style*="z-index: 2147483647"]'
        ];
        sels.forEach(function (sel) {
          try {
            document.querySelectorAll(sel).forEach(function (el) {
              if (el && el.parentNode) el.parentNode.removeChild(el);
            });
          } catch (e) {}
        });
      } catch (e) {}
    }
    removeAds();
    setInterval(removeAds, 1500);
  } catch (e) {}
})();
`;

// Inicializa o adblock mobile no documento principal.
// No Electron, o adblock já roda no processo principal (este é no-op).
export function initMobileAdblock() {
  // Só injeta em ambiente mobile (Capacitor/WebView)
  const cap = typeof window !== 'undefined' ? window.Capacitor : undefined;
  const isMobile =
    !!(cap && cap.isNativePlatform && cap.isNativePlatform()) ||
    (typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent));

  if (!isMobile) return;

  // Injeta imediatamente (cabeça do documento)
  try {
    const script = document.createElement('script');
    script.textContent = MOBILE_ADBLOCK_SCRIPT;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  } catch (e) {
    /* noop */
  }

  // Re-injeta nos iframes de embed quando carregam
  const injectIntoIframes = () => {
    try {
      document.querySelectorAll('iframe').forEach((iframe) => {
        try {
          if (iframe.contentWindow) {
            const s = iframe.contentWindow.document.createElement('script');
            s.textContent = MOBILE_ADBLOCK_SCRIPT;
            (iframe.contentWindow.document.head ||
              iframe.contentWindow.document.documentElement).appendChild(s);
            s.remove();
          }
        } catch (e) {
          /* iframe cross-origin — não conseguimos injetar */
        }
      });
    } catch (e) {}
  };

  // Observa novos iframes
  const observer = new MutationObserver(() => injectIntoIframes());
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  setInterval(injectIntoIframes, 2000);
}
