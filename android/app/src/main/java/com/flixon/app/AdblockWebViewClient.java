package com.flixon.app;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;

import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;

/**
 * WebViewClient que estende o do Capacitor.
 *
 * ESTRATÉGIA (conforme diagnóstico de erro 1200 do Cloudflare):
 *
 *  shouldInterceptRequest → PASS-THROUGH TOTAL.
 *    NÃO bloqueia nada na rede. Motivo: bloquear requisições quebra o
 *    Cloudflare (Error 1200 - Rate Limited) e pode quebrar cookies de
 *    sessão do player. O conteúdo do player precisa fluir livremente.
 *
 *  shouldOverrideUrlLoading → bloqueia navegação para anúncios/scams.
 *    O tigrinho/scam tenta navegar pra URL externa → bloqueado.
 *
 *  onPageStarted / onPageFinished → INJETA JS anti-popup.
 *    Neutraliza window.open, remove overlays, bloqueia redirects.
 *    Isto é o que realmente impede o popup do "instale o navegador".
 */
public class AdblockWebViewClient extends BridgeWebViewClient {

    public AdblockWebViewClient(Bridge bridge) {
        super(bridge);
    }

    // ═══════════════════════════════════════════
    //  RECURSOS: PASS-THROUGH TOTAL (não quebra Cloudflare/player)
    // ═══════════════════════════════════════════
    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        return super.shouldInterceptRequest(view, request);
    }

    // ═══════════════════════════════════════════
    //  NAVEGAÇÃO: bloqueia anúncios/scams por DOMÍNIO e PALAVRA-CHAVE
    // ═══════════════════════════════════════════
    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        String url = null;
        if (request != null && request.getUrl() != null) {
            url = request.getUrl().toString();
        }
        if (AdDomains.isAdUrl(url)) {
            return true;
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
    //  INJEÇÃO DE JS — quando a página COMEÇA a carregar
    //  Roda cedo, antes dos scripts de anúncio do player
    // ═══════════════════════════════════════════
    @Override
    public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
        super.onPageStarted(view, url, favicon);
        injectAntiPopupScript(view);
    }

    // ═══════════════════════════════════════════
    //  INJEÇÃO DE JS — quando a página TERMINA de carregar
    //  Garante que o script esteja ativo após o player inicializar
    // ═══════════════════════════════════════════
    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        injectAntiPopupScript(view);
    }

    /**
     * Injeta o script anti-popup no documento principal.
     * O script neutraliza window.open, remove overlays de anúncio
     * e bloqueia redirecionamentos forçados.
     */
    private void injectAntiPopupScript(WebView view) {
        view.evaluateJavascript(ANTI_POPUP_JS, null);
    }

    // Script JS anti-popup (injetado em onPageStarted e onPageFinished)
    private static final String ANTI_POPUP_JS =
        "(function(){" +
        "  try {" +
        // 1) Neutraliza window.open (popups/pop-under)
        "    window.open = function() { return null; };" +
        // 2) Neutraliza tentativas de redirecionar a janela principal
        "    try {" +
        "      Object.defineProperty(window, 'location', {" +
        "        configurable: false," +
        "        get: function() { return document.location; }," +
        "        set: function(v) { /* bloqueado */ }" +
        "      });" +
        "    } catch(e) {}" +
        "    try {" +
        "      Object.defineProperty(window.top, 'location', {" +
        "        configurable: false," +
        "        get: function() { return window.location; }," +
        "        set: function(v) { /* bloqueado */ }" +
        "      });" +
        "    } catch(e) {}" +
        // 3) Remove overlays de anúncio com z-index alto (não remove o player!)
        "    var removeAds = function() {" +
        "      try {" +
        "        document.querySelectorAll('div[style*=\"z-index\"]').forEach(function(el) {" +
        "          try {" +
        "            var z = parseInt(el.style.zIndex || '0', 10);" +
        "            if (z > 100 && !el.id.includes('player') && !el.className.includes('player')) {" +
        "              if (el.tagName !== 'VIDEO' && !(el.querySelector && el.querySelector('video'))) {" +
        "                el.remove();" +
        "              }" +
        "            }" +
        "          } catch(e) {}" +
        "        });" +
        // Remove iframes de anúncio (não os do player legítimo)
        "        document.querySelectorAll('iframe').forEach(function(el) {" +
        "          var src = (el.src || '').toLowerCase();" +
        "          if (src.indexOf('fembed') === -1 && src.indexOf('superflix') === -1 && src.indexOf('myembed') === -1) {" +
        "            if (src.indexOf('ads') !== -1 || src.indexOf('ad.') !== -1 || src.indexOf('popup') !== -1 || src.indexOf('propeller') !== -1 || src.indexOf('popcash') !== -1 || src.indexOf('adsterra') !== -1 || src.indexOf('monetag') !== -1) {" +
        "              el.remove();" +
        "            }" +
        "          }" +
        "        });" +
        // Remove elementos com classes suspeitas
        "        document.querySelectorAll('[class*=\"popup\"],[class*=\"advert\"],[class*=\"banner-ad\"],[class*=\"overlay-ad\"]').forEach(function(el) {" +
        "          if (el.tagName !== 'VIDEO' && !(el.querySelector && el.querySelector('video'))) el.remove();" +
        "        });" +
        "      } catch(e) {}" +
        "    };" +
        "    removeAds();" +
        "    setInterval(removeAds, 500);" +
        // 4) Intercepta cliques que tentam abrir _blank ou redirecionar
        "    document.addEventListener('click', function(ev) {" +
        "      try {" +
        "        var t = ev.target;" +
        "        while (t && t !== document.body) {" +
        "          if (t.tagName === 'A' && t.target === '_blank') { ev.preventDefault(); ev.stopPropagation(); return false; }" +
        "          if (t.onclick) {" +
        "            var oc = String(t.onclick);" +
        "            if (oc.indexOf('window.open') !== -1 || oc.indexOf('location.href') !== -1) { ev.preventDefault(); ev.stopPropagation(); return false; }" +
        "          }" +
        "          t = t.parentNode;" +
        "        }" +
        "      } catch(e) {}" +
        "    }, true);" +
        "  } catch(e) {}" +
        "})();";
}
