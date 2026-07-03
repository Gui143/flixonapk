package com.flixon.app;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;

import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Map;

/**
 * WebViewClient que estende o do Capacitor.
 *
 * ESTRATÉGIA DEFINITIVA CONTRA ANÚNCIOS DO FEMBED:
 *
 *  shouldInterceptRequest → modifica o HTML das páginas de embed do fembed.
 *    O fembed tem uma flag NATIVA "adsDisabled" que é false por padrão.
 *    Quando true, ele NÃO carrega popup ads, overlay ads nem pop-under.
 *    Interceptamos o HTML, trocamos false → true, e devolvemos modificado.
 *    É cirúrgico: SÓ páginas /e/ do fembed são tocadas. Nenhum outro site.
 *    Não quebra Cloudflare nem o player.
 *
 *  shouldOverrideUrlLoading → bloqueia navegação para anúncios/scams.
 *
 *  onCreateWindow → false (bloqueia popups via WebChromeClient).
 */
public class AdblockWebViewClient extends BridgeWebViewClient {

    public AdblockWebViewClient(Bridge bridge) {
        super(bridge);
    }

    // ═══════════════════════════════════════════
    //  INTERCEPTA E MODIFICA O HTML DO FEMBED
    //  Liga a flag adsDisabled = true (recurso NATIVO do próprio fembed)
    // ═══════════════════════════════════════════
    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        String url = null;
        if (request != null && request.getUrl() != null) {
            url = request.getUrl().toString();
        }

        // SÓ modifica páginas de embed do fembed (cirúrgico)
        if (url != null && isFembedEmbed(url)) {
            try {
                WebResourceResponse modified = fetchAndCleanFembed(url, request);
                if (modified != null) return modified;
            } catch (Exception e) {
                // Erro: deixa carregar normalmente (fallback)
            }
        }

        // Tudo o mais: pass-through normal
        return super.shouldInterceptRequest(view, request);
    }

    // ═══════════════════════════════════════════
    //  NAVEGAÇÃO: bloqueia anúncios/scams
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

    @Override
    public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
        super.onPageStarted(view, url, favicon);
        injectAntiPopupScript(view);
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        injectAntiPopupScript(view);
    }

    // ─────────────────────────────────────────────
    //  HELPERS
    // ─────────────────────────────────────────────

    /** Verifica se é uma página de embed do fembed */
    private boolean isFembedEmbed(String url) {
        if (url == null) return false;
        String lower = url.toLowerCase();
        return lower.contains("fembed") && lower.contains("/e/");
    }

    /**
     * Busca o HTML do fembed e desativa os anúncios nativamente.
     * A flag adsDisabled é do PRÓPRIO fembed — não é hack, é recurso deles.
     */
    private WebResourceResponse fetchAndCleanFembed(String url, WebResourceRequest request) {
        HttpURLConnection conn = null;
        try {
            conn = (HttpURLConnection) new URL(url).openConnection();
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(15000);
            conn.setInstanceFollowRedirects(true);
            conn.setRequestMethod("GET");

            // Copia headers da requisição original (User-Agent, etc.)
            Map<String, String> headers = request.getRequestHeaders();
            if (headers != null) {
                String ua = headers.get("User-Agent");
                if (ua != null) conn.setRequestProperty("User-Agent", ua);
                String ref = headers.get("Referer");
                if (ref != null) conn.setRequestProperty("Referer", ref);
            }
            conn.setRequestProperty("Accept", "text/html,application/xhtml+xml");
            conn.setRequestProperty("Accept-Language", "pt-BR,pt;q=0.9,en;q=0.8");

            InputStream is = conn.getInputStream();
            String html = readStream(is);

            // ══ DESATIVA ANÚNCIOS NATIVAMENTE (flag do próprio fembed) ══
            // Troca TODAS as variações de "adsDisabled = false" → "true"
            html = html.replaceAll("(?i)adsDisabled\\s*=\\s*false", "adsDisabled   = true");

            // Zera a div de boot de anúncios
            html = html.replace("$('#adBoot')", "$('#___disabled___')");

            // Desativa bootPopupAds inteiramente
            html = html.replaceAll("function\\s+bootPopupAds\\s*\\(",
                                   "function bootPopupAds_disabled_(");

            // Content-Type
            String contentType = "text/html";
            String ct = conn.getContentType();
            if (ct != null && ct.contains(";")) {
                contentType = ct.split(";")[0].trim();
            } else if (ct != null) {
                contentType = ct;
            }

            conn.disconnect();
            return new WebResourceResponse(
                contentType, "utf-8",
                new ByteArrayInputStream(html.getBytes("utf-8"))
            );
        } catch (Exception e) {
            if (conn != null) conn.disconnect();
            return null;
        }
    }

    /** Lê um InputStream totalmente para String */
    private String readStream(InputStream is) throws Exception {
        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        byte[] buffer = new byte[4096];
        int len;
        while ((len = is.read(buffer)) != -1) {
            baos.write(buffer, 0, len);
        }
        is.close();
        return baos.toString("utf-8");
    }

    /** Injeta JS anti-popup no documento principal */
    private void injectAntiPopupScript(WebView view) {
        view.evaluateJavascript(ANTI_POPUP_JS, null);
    }

    private static final String ANTI_POPUP_JS =
        "(function(){" +
        "  try {" +
        "    window.open = function() { return null; };" +
        "    try {" +
        "      Object.defineProperty(window.top, 'location', {" +
        "        configurable: false," +
        "        get: function() { return window.location; }," +
        "        set: function(v) { /* bloqueado */ }" +
        "      });" +
        "    } catch(e) {}" +
        "    var removeAds = function() {" +
        "      try {" +
        "        document.querySelectorAll('div[style*=\"z-index\"]').forEach(function(el) {" +
        "          try {" +
        "            var z = parseInt(el.style.zIndex || '0', 10);" +
        "            if (z > 100 && el.id.indexOf('player') === -1) {" +
        "              if (el.tagName !== 'VIDEO' && !(el.querySelector && el.querySelector('video'))) el.remove();" +
        "            }" +
        "          } catch(e) {}" +
        "        });" +
        "        document.querySelectorAll('iframe').forEach(function(el) {" +
        "          var src = (el.src || '').toLowerCase();" +
        "          if (src.indexOf('fembed') === -1 && src.indexOf('superflix') === -1 && src.indexOf('myembed') === -1) {" +
        "            if (src.indexOf('ads') !== -1 || src.indexOf('popup') !== -1 || src.indexOf('propeller') !== -1 || src.indexOf('popcash') !== -1 || src.indexOf('monetag') !== -1) el.remove();" +
        "          }" +
        "        });" +
        "      } catch(e) {}" +
        "    };" +
        "    removeAds();" +
        "    setInterval(removeAds, 500);" +
        "  } catch(e) {}" +
        "})();";
}
