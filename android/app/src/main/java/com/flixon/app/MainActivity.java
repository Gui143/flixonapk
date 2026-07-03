package com.flixon.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.graphics.Color;
import android.view.View;
import android.view.Window;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Bridge;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Fundo preto imersivo (identidade do FlixOn)
        try {
            Window window = getWindow();
            window.setStatusBarColor(Color.parseColor("#0a0a0a"));
            window.setNavigationBarColor(Color.parseColor("#0a0a0a"));
            window.getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            );
        } catch (Exception e) {}

        installAdblock();
    }

    /**
     * Instala a defesa anti-anúncio em 3 camadas:
     *
     * 1) WebViewClient:
     *    - shouldInterceptRequest: PASS-THROUGH (não quebra Cloudflare/player)
     *    - shouldOverrideUrlLoading: bloqueia navegação para anúncios
     *    - onPageStarted/onPageFinished: injeta JS anti-popup
     *
     * 2) WebChromeClient (A CHAVE):
     *    - setSupportMultipleWindows(true) => window.open() dispara onCreateWindow
     *    - onCreateWindow retorna false => janela NÃO é criada
     *    Isto garante que NENHUM popup abra, mesmo se o script do player
     *    tentar burlar o JS.
     *
     * 3) JavaScriptCanOpenWindowsAutomatically(false):
     *    Reforço extra contra popups automáticos.
     */
    private void installAdblock() {
        try {
            Bridge bridge = this.bridge;
            if (bridge == null) return;
            WebView webView = bridge.getWebView();
            if (webView == null) return;

            WebSettings settings = webView.getSettings();

            // Performance e compatibilidade
            settings.setDomStorageEnabled(true);
            settings.setJavaScriptEnabled(true);
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);

            // ══ 1) WebViewClient: pass-through na rede + bloqueio de navegação + JS ══
            webView.setWebViewClient(new AdblockWebViewClient(bridge));

            // ══ 2) WebChromeClient: BLOQUEIA criação de janelas (A CHAVE) ══
            // Habilita suporte a múltiplas janelas para que window.open()
            // dispare onCreateWindow (que retorna false = bloqueado)
            settings.setSupportMultipleWindows(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(false);
            webView.setWebChromeClient(new AdblockWebChromeClient(bridge));
        } catch (Exception e) {}
    }

    @Override
    public void onResume() {
        super.onResume();
        // Re-garante os clients ao voltar para o app
        try {
            if (this.bridge != null && this.bridge.getWebView() != null) {
                WebView wv = this.bridge.getWebView();
                if (!(wv.getWebViewClient() instanceof AdblockWebViewClient)) {
                    wv.setWebViewClient(new AdblockWebViewClient(this.bridge));
                }
                if (!(wv.getWebChromeClient() instanceof AdblockWebChromeClient)) {
                    wv.getSettings().setSupportMultipleWindows(true);
                    wv.getSettings().setJavaScriptCanOpenWindowsAutomatically(false);
                    wv.setWebChromeClient(new AdblockWebChromeClient(this.bridge));
                }
            }
        } catch (Exception e) {}
    }
}
