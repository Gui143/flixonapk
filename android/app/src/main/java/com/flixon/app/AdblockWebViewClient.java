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
 * Intercepta o HTML das paginas de embed (fembed + mirrors) e ativa
 * a flag NATIVA adsDisabled=true, alem de desativar todas as funcoes
 * de boot de anuncios (bootPopupAds, bootAdsIfExternalServer).
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

    private boolean isEmbedPage(String url) {
        if (url == null) return false;
        String lower = url.toLowerCase();
        if (!lower.contains("/e/") && !lower.contains("/v/")) return false;
        for (String host : EMBED_HOSTS) {
            if (lower.contains(host)) return true;
        }
        if (lower.contains("fembed")) return true;
        return false;
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

            InputStream is = conn.getInputStream();
            String html = readStream(is);

            // === NEUTRALIZACAO COMPLETA DE ANUNCIOS ===

            // 1) Flag nativa adsDisabled = false -> true
            html = html.replaceAll("(?i)(const|let|var)?\\s*adsDisabled\\s*=\\s*false", "adsDisabled   = true");
            html = html.replaceAll("(?i)adsDisabled\\s*\\?\\s*1\\s*:\\s*0", "1");

            // 2) popupAdsBooted = false -> true (nao bootar de novo)
            html = html.replaceAll("(?i)(let|var)\\s+popupAdsBooted\\s*=\\s*false", "popupAdsBooted = true");

            // 3) Desativa bootPopupAds
            html = html.replaceAll("function\\s+bootPopupAds\\s*\\(", "function bootPopupAds_X_(");

            // 4) Desativa bootAdsIfExternalServer
            html = html.replaceAll("function\\s+bootAdsIfExternalServer\\s*\\(", "function bootAdsIfExternalServer_X_(");

            // 5) Neutraliza div #adBoot
            html = html.replace("$('#adBoot')", "$('#___no___')");
            html = html.replace("\"#adBoot\"", "\"#___no___\"");

            // 6) Desativa window.open
            html = html.replaceAll("window\\.open\\s*=", "window.__no_open__=");

            // 7) Remove chamadas diretas de bootPopupAds()
            html = html.replaceAll("bootPopupAds\\s*\\(", "bootPopupAds_X_(");

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
        "var rm=function(){try{" +
        "document.querySelectorAll('div[style*=\"z-index\"]').forEach(function(el){try{var z=parseInt(el.style.zIndex||'0',10);if(z>100&&el.id.indexOf('player')===-1){if(el.tagName!=='VIDEO'&&!(el.querySelector&&el.querySelector('video')))el.remove();}}catch(e){}});" +
        "document.querySelectorAll('iframe').forEach(function(el){var s=(el.src||'').toLowerCase();if(s.indexOf('fembed')===-1&&s.indexOf('superflix')===-1&&s.indexOf('myembed')===-1){if(s.indexOf('ads')!==-1||s.indexOf('popup')!==-1||s.indexOf('propeller')!==-1||s.indexOf('popcash')!==-1||s.indexOf('monetag')!==-1)el.remove();}});" +
        "}catch(e){}};" +
        "rm();setInterval(rm,500);" +
        "}catch(e){}})();";
}
