package com.flixon.app;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;

import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;

/**
 * WebViewClient que estende o do Capacitor.
 *
 * ESTRATÉGIA MÍNIMA E SEGURA (não quebra o player):
 *
 *  shouldInterceptRequest  → PASS-THROUGH (não bloqueia nada).
 *    Motivo: bloquear recursos quebrava players como o fembed (loading infinito).
 *    O player precisa carregar TODOS os seus scripts/CDN para funcionar.
 *
 *  shouldOverrideUrlLoading → BLOQUEIA só URLs de anúncio/cassino (tigrinho).
 *    É aqui que o "tigrinho" é pego: ele tenta navegar pra uma URL de cassino,
 *    e nós bloqueamos (return true), impedindo que o app saia para o anúncio.
 *
 *  Popups → bloqueados via setSupportMultipleWindows(false) no MainActivity.
 */
public class AdblockWebViewClient extends BridgeWebViewClient {

    public AdblockWebViewClient(Bridge bridge) {
        super(bridge);
    }

    // ═══════════════════════════════════════════
    //  RECURSOS: PASS-THROW TOTAL.
    //  Não bloqueamos NADA aqui para garantir que o player carregue.
    // ═══════════════════════════════════════════
    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        // Deixa o Capacitor tratar normalmente (serve os arquivos locais do app)
        return super.shouldInterceptRequest(view, request);
    }

    // ═══════════════════════════════════════════
    //  NAVEGAÇÃO: bloqueia anúncios/cassino (tigrinho) por DOMÍNIO e PALAVRA-CHAVE.
    //  Isto impede que o app saia para a tela do anúncio.
    // ═══════════════════════════════════════════
    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        String url = null;
        if (request != null && request.getUrl() != null) {
            url = request.getUrl().toString();
        }
        // Se é anúncio/cassino → BLOQUEIA a navegação
        if (AdDomains.isAdUrl(url)) {
            return true;  // true = não navega
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
