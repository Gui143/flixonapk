package com.flixon.app;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;

import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.os.Build;
import java.io.ByteArrayInputStream;

/**
 * WebViewClient que estende o do Capacitor (preserva toda a ponte JS)
 * e bloqueia requisições de anúncios via shouldInterceptRequest.
 *
 * Isto é o equivalente Android do session.webRequest.onBeforeRequest do Electron.
 * Bloqueia TODAS as requisições, inclusive dentro de iframes cross-origin
 * (fembed, streamtape, etc.) — onde injeção de JS não funciona.
 */
public class AdblockWebViewClient extends BridgeWebViewClient {

    private static final WebResourceResponse EMPTY =
        new WebResourceResponse("text/plain", "utf-8", new ByteArrayInputStream(new byte[0]));

    public AdblockWebViewClient(Bridge bridge) {
        super(bridge);
    }

    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        // Bloqueia anúncios em QUALQUER frame (principal e subframes/iframes)
        String host = null;
        if (request != null && request.getUrl() != null) {
            host = request.getUrl().getHost();
        }
        if (host != null && AdDomains.isAdHost(host)) {
            return EMPTY; // cancela a requisição
        }
        // Demais requisições: deixa o Capacitor tratar normalmente
        return super.shouldInterceptRequest(view, request);
    }
}
