package com.flixon.app;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;

import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;

import java.io.ByteArrayInputStream;
import java.util.regex.Pattern;

/**
 * ═══════════════════════════════════════════════════════════
 *  Adblock DEFINITIVO para o Fembed no Android (WebView)
 * ═══════════════════════════════════════════════════════════
 *
 *  CAMADA 1 — shouldInterceptRequest:
 *    Bloqueia na REDE as URLs de anúncio do fembed:
 *      • api.php?action=getAds  →  o iframe de anúncio (vem do getPlayer)
 *      • waust.at, popads, monetag, etc.  →  pop-under de cassino
 *    O iframe de anúncio carrega VAZIO (sem conteúdo = sem anúncio).
 *    NÃO intercepta getPlayer nem a página do player (não quebra o vídeo).
 *
 *  CAMADA 2 — shouldOverrideUrlLoading:
 *    Bloqueia a navegação para domínios de cassino/scam
 *    (Brazino 777, Blaze, Fortune Tiger, etc.).
 *    O usuário NUNCA sai do app para uma página de anúncio.
 *
 *  CAMADA 3 — onCreateWindow (no WebChromeClient):
 *    setSupportMultipleWindows(true) + onCreateWindow → false.
 *    window.open() dispara onCreateWindow, que retorna false.
 *    NENHUM popup/janela abre — impossível de burlar via JS.
 *
 *  CAMADA 4 — JS injection (onPageStarted + onPageFinished):
 *    Neutraliza window.open, top.location redirect,
 *    e remove overlays de anúncio do DOM.
 * ═══════════════════════════════════════════════════════════
 */
public class AdblockWebViewClient extends BridgeWebViewClient {

    // ── URLs de anúncio para bloquear na rede ──
    // getAds é o iframe de anúncio que o fembed injeta na resposta de getPlayer
    private static final String[] AD_URL_PATTERNS = {
        "action=getads",      // iframe de anúncio do fembed
        "waust.at",           // pop-under de cassino (brazino, blaze)
        "popads.net",         // rede de pop-under
        "popcash.net",        // rede de pop-under
        "propellerads.com",   // rede de anúncio
        "monetag.com",        // rede de anúncio
        "adsterra.com",       // rede de anúncio
        "hilltopads.com",     // rede de anúncio
        "onclickperformance.com",
        "highperformanceformat.com",
        "alphonso.tv",
        "admaven.com",
        "adskeeper.com",
        "adsystem.com",
        "doubleclick.net",
        "googlesyndication.com"
    };

    public AdblockWebViewClient(Bridge bridge) {
        super(bridge);
    }

    // ═══════════════════════════════════════════
    //  CAMADA 1: Bloqueia anúncios na REDE
    // ═══════════════════════════════════════════
    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        String url = null;
        if (request != null && request.getUrl() != null) {
            url = request.getUrl().toString();
        }
        if (url == null) return super.shouldInterceptRequest(view, request);

        String lower = url.toLowerCase();

        // Bloqueia todas as URLs de anúncio conhecidas
        for (String pattern : AD_URL_PATTERNS) {
            if (lower.contains(pattern)) {
                // Retorna resposta VAZIA → o iframe/script carrega sem conteúdo
                return new WebResourceResponse(
                    "text/plain", "utf-8",
                    new ByteArrayInputStream(new byte[0])
                );
            }
        }

        // Tudo o mais: pass-through (player carrega normalmente)
        return super.shouldInterceptRequest(view, request);
    }

    // ═══════════════════════════════════════════
    //  CAMADA 2: Bloqueia navegação para anúncios/scams
    // ═══════════════════════════════════════════
    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        String url = null;
        if (request != null && request.getUrl() != null) {
            url = request.getUrl().toString();
        }
        if (AdDomains.isAdUrl(url)) {
            return true; // true = NÃO navega (bloqueia)
        }
        return super.shouldOverrideUrlLoading(view, request);
    }

    @Override
    @Deprecated
    public boolean shouldOverrideUrlLoading(WebView view, String url) {
        if (AdDomains.isAdUrl(url)) {
            return true;
        }
        return super.shouldOverrideUrlLoading(view, url);
    }

    // ═══════════════════════════════════════════
    //  CAMADA 4: Injeção de JS anti-anúncio
    // ═══════════════════════════════════════════
    @Override
    public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
        super.onPageStarted(view, url, favicon);
        // Injeta ANTES dos scripts do fembed carregarem
        injectAntiAdScript(view);
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        // Re-injeta após o carregamento completo
        injectAntiAdScript(view);
    }

    /**
     * Script JS que:
     * 1) Mata window.open (nenhum popup)
     * 2) Bloqueia top.location redirect
     * 3) Remove iframes de anúncio (getAds) do DOM
     * 4) Intercepta cliques em links _blank
     * 5) Remove overlays com z-index alto
     */
    private void injectAntiAdScript(WebView view) {
        view.evaluateJavascript(ANTI_AD_JS, null);
    }

    private static final String ANTI_AD_JS =
        // ══ IIFE auto-executável ══
        "(function(){" +
        "  try {" +
        // 1) Mata window.open — nenhum popup abre
        "    window.open = function() { return null; };" +

        // 2) Bloqueia redirect forçado do player
        "    try {" +
        "      Object.defineProperty(window.top, 'location', {" +
        "        configurable: false," +
        "        get: function() { return window.location; }," +
        "        set: function(v) { /* BLOQUEADO */ }" +
        "      });" +
        "    } catch(e) {}" +

        // 3) Intercepta cliques que tentam abrir _blank
        "    document.addEventListener('click', function(ev) {" +
        "      try {" +
        "        var t = ev.target;" +
        "        while (t && t !== document.body) {" +
        "          if (t.tagName === 'A' && t.target === '_blank') {" +
        "            ev.preventDefault(); ev.stopPropagation(); return false;" +
        "          }" +
        "          t = t.parentNode;" +
        "        }" +
        "      } catch(e) {}" +
        "    }, true);" +

        // 4) Remove anúncios do DOM periodicamente
        "    var rmAds = function() {" +
        "      try {" +
        // Remove iframes de anúncio (getAds, popunder, etc.)
        "        document.querySelectorAll('iframe').forEach(function(f) {" +
        "          var s = (f.src || '').toLowerCase();" +
        "          if (s.indexOf('getads') !== -1 || s.indexOf('waust') !== -1 ||" +
        "              s.indexOf('propeller') !== -1 || s.indexOf('popcash') !== -1 ||" +
        "              s.indexOf('monetag') !== -1 || s.indexOf('popads') !== -1 ||" +
        "              s.indexOf('brazino') !== -1 || s.indexOf('blaze') !== -1) {" +
        "            f.remove();" +
        "          }" +
        "        });" +
        // Remove overlays com z-index alto (não remove o player!)
        "        document.querySelectorAll('div[style*=\"z-index\"]').forEach(function(el) {" +
        "          try {" +
        "            var z = parseInt(el.style.zIndex || '0', 10);" +
        "            if (z > 100 && el.id.indexOf('player') === -1) {" +
        "              if (el.tagName !== 'VIDEO' && !(el.querySelector && el.querySelector('video'))) {" +
        "                el.remove();" +
        "              }" +
        "            }" +
        "          } catch(e) {}" +
        "        });" +
        "      } catch(e) {}" +
        "    };" +

        // Executa imediatamente + a cada 800ms
        "    rmAds();" +
        "    setInterval(rmAds, 800);" +

        "  } catch(e) {}" +
        "})();";
}
