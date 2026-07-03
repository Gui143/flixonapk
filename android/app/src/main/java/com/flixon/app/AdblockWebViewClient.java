package com.flixon.app;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;

import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import java.io.ByteArrayInputStream;

/**
 * WebViewClient que estende o do Capacitor e adiciona bloqueio de anúncios.
 *
 * IMPORTANTE — duas camadas distintas:
 *
 * 1) shouldInterceptRequest (RECURSOS):
 *    Bloqueia APENAS por DOMÍNIO (isAdHost). NUNCA por palavra-chave.
 *    Motivo: palavras como "/ads/", "/adv/" aparecem em URLs legítimas do
 *    player (fembed), e bloqueá-las quebra o vídeo (loading infinito).
 *
 * 2) shouldOverrideUrlLoading (NAVEGAÇÃO):
 *    Bloqueia por DOMÍNIO e por PALAVRA-CHAVE (isAdUrl).
 *    É aqui que o "tigrinho" (Fortune Tiger) é pego — ele tenta navegar
 *    para uma URL de cassino, e nós bloqueamos a navegação.
 */
public class AdblockWebViewClient extends BridgeWebViewClient {

    private static final WebResourceResponse EMPTY =
        new WebResourceResponse("text/plain", "utf-8", new ByteArrayInputStream(new byte[0]));

    public AdblockWebViewClient(Bridge bridge) {
        super(bridge);
    }

    // ═══════════════════════════════════════════
    //  RECURSOS: bloqueia SÓ por domínio (não por palavra-chave!)
    //  Isto garante que o player fembed carregue seus scripts/CDN normalmente.
    // ═══════════════════════════════════════════
    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        String host = null;
        if (request != null && request.getUrl() != null) {
            host = request.getUrl().getHost();
        }
        // SÓ por domínio — nunca por palavra-chave (senão quebra o player)
        if (AdDomains.isAdHost(host)) {
            return EMPTY;
        }
        return super.shouldInterceptRequest(view, request);
    }

    // ═══════════════════════════════════════════
    //  NAVEGAÇÃO: bloqueia por domínio E por palavra-chave.
    //  O tigrinho tenta redirecionar a página pra cá → bloqueado.
    // ═══════════════════════════════════════════
    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        String url = null;
        if (request != null && request.getUrl() != null) {
            url = request.getUrl().toString();
        }
        // Se é anúncio/cassino por domínio ou palavra-chave → BLOQUEIA
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
