package com.flixon.app;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;

import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import java.io.ByteArrayInputStream;

/**
 * WebViewClient que estende o do Capacitor e replica o adblock do PC.
 *
 * Esta é a versão EQUIVALENTE ao session.webRequest.onBeforeRequest do Electron:
 *
 *  shouldInterceptRequest → bloqueia por DOMÍNIO (isAdHost).
 *    Intercepta TODAS as requisições, inclusive de iframes cross-origin
 *    (fembed, etc.). Os scripts de anúncio/scam (propellerads, adsterra,
 *    popcash...) nunca carregam → sem popup de roleta/scam.
 *    NUNCA usa palavra-chave aqui (quebraria o player fembed).
 *
 *  shouldOverrideUrlLoading → bloqueia por DOMÍNIO e PALAVRA-CHAVE.
 *    Pega o tigrinho e scams com domínios rotativos.
 */
public class AdblockWebViewClient extends BridgeWebViewClient {

    private static final WebResourceResponse EMPTY =
        new WebResourceResponse("text/plain", "utf-8", new ByteArrayInputStream(new byte[0]));

    public AdblockWebViewClient(Bridge bridge) {
        super(bridge);
    }

    // ═══════════════════════════════════════════
    //  RECURSOS: bloqueia por DOMÍNIO apenas (igual o PC).
    //  Intercepta todos os frames, inclusive iframes do fembed.
    //  Cancela redes de anúncio/scam ANTES de carregar.
    // ═══════════════════════════════════════════
    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        String host = null;
        if (request != null && request.getUrl() != null) {
            host = request.getUrl().getHost();
        }
        if (AdDomains.isAdHost(host)) {
            return EMPTY;
        }
        return super.shouldInterceptRequest(view, request);
    }

    // ═══════════════════════════════════════════
    //  NAVEGAÇÃO: bloqueia anúncios/scams por DOMÍNIO e PALAVRA-CHAVE.
    //  Impede que o app saia para a tela do anúncio (tigrinho).
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
}
