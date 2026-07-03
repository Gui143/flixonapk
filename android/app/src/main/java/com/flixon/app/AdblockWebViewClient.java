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
 * Adblock para players de embed (fembed + mirrors).
 *
 * ESTRATÉGIA SEGURA (não quebra o player):
 *
 * 1) shouldInterceptRequest:
 *    a) BLOQUEIA api.php?action=getAds → retorna vazio (anúncio não carrega)
 *    b) BLOQUEIA scripts de pop-under (waust.at, etc.)
 *    c) Modifica HTML da página /e/ (adsDisabled=true, bootPopupAds off)
 *    NÃO intercepta getPlayer — deixa o WebView carregar com seus cookies/POST.
 *
 * 2) shouldOverrideUrlLoading: bloqueia navegação para cassinos/scams.
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
        if (url == null) return super.shouldInterceptRequest(view, request);
        String lower = url.toLowerCase();

        // ══ A) BLOQUEIA api.php?action=getAds (anúncio) ══
        // O fembed injeta um iframe com action=getAds na resposta de getPlayer.
        // Bloqueamos essa URL → o iframe fica vazio → sem anúncio.
        // NÃO bloqueamos getPlayer (deixamos o player carregar normalmente).
        if (lower.contains("action=getads")) {
            return emptyResponse();
        }

        // ══ B) Bloqueia scripts de pop-under de cassino ══
        if (isPopunderScript(url)) {
            return emptyResponse();
        }

        // ══ C) Modifica HTML da página de embed ══
        if (isEmbedPage(url)) {
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

    private boolean isPopunderScript(String url) {
        String lower = url.toLowerCase();
        return lower.contains("waust.at") || lower.contains("waust.") ||
               lower.contains("popads.net") || lower.contains("popcash.net") ||
               lower.contains("propellerads.com") || lower.contains("monetag.com") ||
               lower.contains("adsterra.com") || lower.contains("hilltopads.com") ||
               lower.contains("onclickperformance.com") ||
               lower.contains("highperformanceformat.com") ||
               lower.contains("alphonso.tv") || lower.contains("admaven.com");
    }

    private boolean isEmbedPage(String url) {
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

            int code = conn.getResponseCode();
            InputStream is = conn.getInputStream();
            String html = readStream(is);

            // Cloudflare challenge → pass-through (não interfere)
            if (isCloudflareChallenge(html, code)) {
                conn.disconnect();
                return null;
            }

            // ══ NEUTRALIZAÇÃO DE ANÚNCIOS (sem tocar no player) ══

            // 1) Remove script waust.at (pop-under de cassino)
            html = html.replaceAll("(?is)<script[^>]*src=[\"']?[^\"']*waust\\.at[^\"']*[\"']?[^>]*>\\s*</script>", "");

            // 2) adsDisabled = true (flag nativa)
            html = html.replaceAll("(?i)(const|let|var)?\\s*adsDisabled\\s*=\\s*false", "adsDisabled   = true");
            html = html.replaceAll("(?i)adsDisabled\\s*\\?\\s*1\\s*:\\s*0", "1");

            // 3) popupAdsBooted = true (não bootar de novo)
            html = html.replaceAll("(?i)(let|var)\\s+popupAdsBooted\\s*=\\s*false", "popupAdsBooted = true");

            // 4) Desativa funções de anúncio
            html = html.replaceAll("function\\s+bootPopupAds\\s*\\(", "function bootPopupAds_X_(");
            html = html.replaceAll("function\\s+bootAdsIfExternalServer\\s*\\(", "function bootAdsIfExt_X_(");
            html = html.replaceAll("bootPopupAds\\s*\\(", "bootPopupAds_X_(");

            // 5) Neutraliza #adBoot
            html = html.replace("$('#adBoot')", "$('#___no___')");
            html = html.replace("\"#adBoot\"", "\"#___no___\"");

            // 6) Desativa window.open
            html = html.replaceAll("window\\.open\\s*=", "window.__no_open__=");

            // 7) Neutraliza sistema WAU (pop-under)
            html = html.replaceAll("(?i)var\\s+_wau\\s*=", "var _wau_DISABLED =");

            // 8) Injeta anti-ad no <head>
            String earlyBlock = "<script>" +
                "(function(){" +
                "window.open=function(){return null;};" +
                "try{Object.defineProperty(window.top,'location'," +
                "{configurable:false,get:function(){return window.location;}," +
                "set:function(){}});}catch(e){}" +
                "var obs=new MutationObserver(function(){" +
                "document.querySelectorAll('iframe').forEach(function(f){" +
                "var s=(f.src||'').toLowerCase();" +
                "if(s.indexOf('getads')!==-1||s.indexOf('waust')!==-1||s.indexOf('brazino')!==-1||s.indexOf('blaze')!==-1){" +
                "f.remove();}});" +
                "});" +
                "if(document.documentElement)obs.observe(document.documentElement,{childList:true,subtree:true});" +
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

    private boolean isCloudflareChallenge(String html, int code) {
        if (html == null) return false;
        if (code == 403 || code == 503) return true;
        String lower = html.toLowerCase();
        return lower.contains("just a moment") || lower.contains("checking your browser") ||
               lower.contains("cf-challenge") ||
               (lower.contains("challenge-platform") && lower.length() < 5000);
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
