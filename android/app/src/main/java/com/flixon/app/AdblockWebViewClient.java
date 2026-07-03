package com.flixon.app;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;

import android.net.Uri;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import java.io.ByteArrayInputStream;

/**
 * WebViewClient que estende o do Capacitor e adiciona:
 *
 * 1) BLOQUEIO DE RECURSOS (shouldInterceptRequest):
 *    Cancela anúncios antes de carregar, inclusive dentro de iframes.
 *    Verifica por DOMÍNIO e por PALAVRA-CHAVE na URL (pega cassinos rotativos).
 *
 * 2) BLOQUEIO DE NAVEGAÇÃO (shouldOverrideUrlLoading):
 *    Quando o player tenta abrir um anúncio (tigrinho/cassino),
 *    BLOQUEIA a navegação em vez de abrir no navegador externo.
 *    Isto é o que impede o app de sair pra tela do anúncio.
 */
public class AdblockWebViewClient extends BridgeWebViewClient {

    private static final WebResourceResponse EMPTY =
        new WebResourceResponse("text/plain", "utf-8", new ByteArrayInputStream(new byte[0]));

    public AdblockWebViewClient(Bridge bridge) {
        super(bridge);
    }

    // ═══════════════════════════════════════════
    //  1) BLOQUEIO DE RECURSOS (anúncios, scripts, iframes de ad)
    //     Funciona em TODOS os frames, inclusive iframes cross-origin
    // ═══════════════════════════════════════════
    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        String url = null;
        String host = null;
        if (request != null && request.getUrl() != null) {
            url = request.getUrl().toString();
            host = request.getUrl().getHost();
        }
        // Bloqueia por domínio E por palavra-chave na URL completa
        if (AdDomains.isAdHost(host) || AdDomains.isAdUrl(url)) {
            return EMPTY;
        }
        return super.shouldInterceptRequest(view, request);
    }

    // ═══════════════════════════════════════════
    //  2) BLOQUEIO DE NAVEGAÇÃO EXTERNA
    //     O Capacitor abre URLs externas via launchIntent (navegador).
    //     Se for anúncio (tigrinho), BLOQUEIA em vez de abrir.
    // ═══════════════════════════════════════════
    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        String url = null;
        if (request != null && request.getUrl() != null) {
            url = request.getUrl().toString();
        }
        // Se é anúncio → BLOQUEIA (return true = não navega)
        if (AdDomains.isAdUrl(url)) {
            return true;
        }
        // Caso contrário, deixa o Capacitor decidir (file://, links internos, etc.)
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
