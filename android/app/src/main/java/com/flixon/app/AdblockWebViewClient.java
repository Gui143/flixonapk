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
 * WebViewClient — Neutraliza TODOS os anuncios de players de embed.
 *
 * Intercepta o HTML das paginas de embed (fembed + mirrors) e:
 *  1) Ativa a flag NATIVA adsDisabled=true
 *  2) Desativa todas as funcoes de boot de anuncios
 *  3) REMOVE o script waust.at (pop-under de cassino: Brazino 777, etc.)
 *  4) Neutraliza o sistema WAU inteiro
 *  5) Detecta desafio Cloudflare e faz pass-through (nao quebra o player)
 */
public class AdblockWebViewClient extends BridgeWebViewClient {

    private static final String[] EMBED_HOSTS = {
        "fembed.sx", "fembedhd.com", "fembed.net", "fembed.com",
        "feurl.com", "savemax.icu", "fembedhd.pro",
        "fembed-hd.com", "feurl.org", "saveseries.org",
        "fembed.su", "fembed.ru", "fembed.nu", "fembed.io"
    };

    public AdblockWebViewClient(Bridge bridge) {
        super(bridge);
    }

    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        String url = null;
        if (request != null && request.getUrl() != null) {
            url = request.getUrl().toString();
        }

        // Bloqueia script de pop-under de cassino (waust.at) em QUALQUER site
        if (url != null && isPopunderScript(url)) {
            return emptyResponse();
        }

        // Se for pagina de embed de player conhecido → modifica o HTML
        if (url != null && isEmbedPage(url)) {
            try {
                WebResourceResponse mod = fetchAndClean(url, request);
                if (mod != null) return mod;
            } catch (Exception e) {}
        }

        return super.shouldInterceptRequest(view, request);
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        String url = null;
        if (request != null && request.getUrl() != null) {
            url = request.getUrl().toString();
        }
        if (AdDomains.isAdUrl(url)) return true;
        return super.shouldOverrideUrlLoading(view, request);
    }

    @Override
    @Deprecated
    public boolean shouldOverrideUrlLoading(WebView view, String url) {
        if (AdDomains.isAdUrl(url)) return true;
        return super.shouldOverrideUrlLoading(view, url);
    }

    @Override
    public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
        super.onPageStarted(view, url, favicon);
        injectAntiPopup(view);
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        injectAntiPopup(view);
    }

    // ─── HELPERS ───

    /** Scripts de pop-under de cassino (brazino, blaze, etc.) */
    private boolean isPopunderScript(String url) {
        if (url == null) return false;
        String lower = url.toLowerCase();
        return lower.contains("waust.at") ||
               lower.contains("waust.") ||
               lower.contains("popads.net") ||
               lower.contains("popcash.net") ||
               lower.contains("propellerads.com") ||
               lower.contains("onclickperformance.com") ||
               lower.contains("highperformanceformat.com") ||
               lower.contains("monetag.com") ||
               lower.contains("adsterra.com") ||
               lower.contains("hilltopads.com");
    }

    private boolean isEmbedPage(String url) {
        if (url == null) return false;
        String lower = url.toLowerCase();
        if (!lower.contains("/e/") && !lower.contains("/v/")) return false;
        for (String host : EMBED_HOSTS) {
            if (lower.contains(host)) return true;
        }
        return lower.contains("fembed");
    }

    private WebResourceResponse fetchAndClean(String url, WebResourceRequest request) {
        HttpURLConnection conn = null;
        try {
            conn = (HttpURLConnection) new URL(url).openConnection();
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(15000);
            conn.setInstanceFollowRedirects(true);
            conn.setRequestMethod("GET");
            Map<String, String> headers = request.getRequestHeaders();
            if (headers != null) {
                String ua = headers.get("User-Agent");
                if (ua != null) conn.setRequestProperty("User-Agent", ua);
                String ref = headers.get("Referer");
                if (ref != null) conn.setRequestProperty("Referer", ref);
            }
            conn.setRequestProperty("Accept", "text/html,application/xhtml+xml");
            conn.setRequestProperty("Accept-Language", "pt-BR,pt;q=0.9");

            int code = conn.getResponseCode();
            InputStream is = conn.getInputStream();
            String html = readStream(is);

            // ══ DETECTA DESAFIO CLOUDFLARE → PASS-THROUGH ══
            // Se Cloudflare bloqueou nosso fetch (bot detection),
            // deixa o WebView carregar normalmente (ele passa no desafio).
            if (isCloudflareChallenge(html, code)) {
                conn.disconnect();
                return null; // null = pass-through
            }

            // ══════════════════════════════════════════════
            //  NEUTRALIZACAO COMPLETA DE ANUNCIOS
            // ══════════════════════════════════════════════

            // 1) REMOVE script de pop-under de cassino (waust.at)
            //    Isto é o que causa Brazino 777, Blaze, etc.
            html = html.replaceAll(
                "(?is)<script[^>]*src=\"[^\"]*waust\\.at[^\"]*\"[^>]*>\\s*</script>", "");
            html = html.replaceAll(
                "(?is)<script[^>]*src='[^']*waust\\.at[^']*'[^>]*>\\s*</script>", "");
            // Também remove pela forma sem protocolo (//waust.at)
            html = html.replaceAll(
                "(?is)<script[^>]*src=[\"']?//waust\\.at[^\"']*[\"']?[^>]*>\\s*</script>", "");

            // 2) Flag nativa adsDisabled = false -> true
            html = html.replaceAll("(?i)(const|let|var)?\\s*adsDisabled\\s*=\\s*false",
                                   "adsDisabled   = true");
            html = html.replaceAll("(?i)adsDisabled\\s*\\?\\s*1\\s*:\\s*0", "1");

            // 3) popupAdsBooted = false -> true
            html = html.replaceAll("(?i)(let|var)\\s+popupAdsBooted\\s*=\\s*false",
                                   "popupAdsBooted = true");

            // 4) Desativa bootPopupAds
            html = html.replaceAll("function\\s+bootPopupAds\\s*\\(", "function bootPopupAds_X_(");

            // 5) Desativa bootAdsIfExternalServer
            html = html.replaceAll("function\\s+bootAdsIfExternalServer\\s*\\(", "function bootAdsIfExt_X_(");

            // 6) Neutraliza div #adBoot
            html = html.replace("$('#adBoot')", "$('#___no___')");
            html = html.replace("\"#adBoot\"", "\"#___no___\"");

            // 7) Desativa window.open
            html = html.replaceAll("window\\.open\\s*=", "window.__no_open__=");

            // 8) Remove chamadas diretas de bootPopupAds()
            html = html.replaceAll("bootPopupAds\\s*\\(", "bootPopupAds_X_(");

            // 9) Neutraliza o sistema WAU (pop-under de cassino)
            html = html.replaceAll("(?i)var\\s+_wau\\s*=", "var _wau_DISABLED =");
            html = html.replaceAll("(?i)_wau\\s*=", "_wau_DISABLED =");
            html = html.replaceAll("WAU_small\\s*\\(", "WAU_DISABLED(");
            html = html.replaceAll("WAU_la\\s*\\(", "WAU_DISABLED(");
            html = html.replaceAll("WAU_cps\\s*\\(", "WAU_DISABLED(");

            // 10) Injeta script anti-ad no INICIO do <head>
            //     Roda ANTES dos scripts do fembed
            String earlyBlock = "<script>" +
                "(function(){" +
                "window.open=function(){return null;};" +
                "try{Object.defineProperty(window.top,'location'," +
                "{configurable:false,get:function(){return window.location;}," +
                "set:function(){}});}catch(e){}" +
                "window._wau=undefined;" +
                "window.WAU_small=function(){};" +
                "window.WAU_la=function(){};" +
                "window.WAU_cps=function(){};" +
                "var obs=new MutationObserver(function(){" +
                "document.querySelectorAll('iframe').forEach(function(f){" +
                "var s=(f.src||'').toLowerCase();" +
                "if(s.indexOf('fembed')===-1&&s.indexOf('superflix')===-1&&s.indexOf('myembed')===-1){" +
                "if(s.indexOf('ads')!==-1||s.indexOf('popup')!==-1||s.indexOf('waust')!==-1||s.indexOf('propeller')!==-1||s.indexOf('popcash')!==-1||s.indexOf('monetag')!==-1||s.indexOf('brazino')!==-1||s.indexOf('blaze')!==-1){" +
                "f.remove();" +
                "}}});" +
                "});" +
                "if(document.documentElement)obs.observe(document.documentElement,{childList:true,subtree:true});" +
                "setInterval(function(){" +
                "document.querySelectorAll('div[style*=\"z-index\"]').forEach(function(el){" +
                "try{var z=parseInt(el.style.zIndex||'0',10);" +
                "if(z>100&&el.id.indexOf('player')===-1){" +
                "if(el.tagName!=='VIDEO'&&!(el.querySelector&&el.querySelector('video')))el.remove();}}catch(e){}});" +
                "},500);" +
                "})();" +
                "</script>";
            html = html.replaceFirst("(?i)<head[^>]*>", "$0" + earlyBlock);

            String ct = conn.getContentType();
            String mime = "text/html";
            if (ct != null) mime = ct.contains(";") ? ct.split(";")[0].trim() : ct;
            conn.disconnect();
            return new WebResourceResponse(mime, "utf-8", new ByteArrayInputStream(html.getBytes("utf-8")));
        } catch (Exception e) {
            if (conn != null) conn.disconnect();
            return null;
        }
    }

    /** Detecta se a resposta é um desafio Cloudflare (bot check) */
    private boolean isCloudflareChallenge(String html, int code) {
        if (html == null) return false;
        // Status 403/503 = bloqueado
        if (code == 403 || code == 503) return true;
        // Marcadores de desafio Cloudflare no HTML
        String lower = html.toLowerCase();
        if (lower.contains("just a moment")) return true;
        if (lower.contains("checking your browser")) return true;
        if (lower.contains("cf-challenge")) return true;
        if (lower.contains("challenge-platform")) return true;
        if (lower.contains("ddos protection")) return true;
        if (lower.contains("ray id") && lower.length() < 5000) return true;
        return false;
    }

    private WebResourceResponse emptyResponse() {
        return new WebResourceResponse("text/plain", "utf-8", new ByteArrayInputStream(new byte[0]));
    }

    private String readStream(InputStream is) throws Exception {
        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        byte[] buf = new byte[4096];
        int len;
        while ((len = is.read(buf)) != -1) baos.write(buf, 0, len);
        is.close();
        return baos.toString("utf-8");
    }

    private void injectAntiPopup(WebView view) {
        view.evaluateJavascript(ANTI_JS, null);
    }

    private static final String ANTI_JS =
        "(function(){try{" +
        "window.open=function(){return null;};" +
        "try{Object.defineProperty(window.top,'location',{configurable:false,get:function(){return window.location;},set:function(){}});}catch(e){}" +
        "}catch(e){}})();";
}
