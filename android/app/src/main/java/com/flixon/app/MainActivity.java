package com.flixon.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.graphics.Color;
import android.view.View;
import android.view.Window;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Bridge;

/**
 * ═══════════════════════════════════════════════════════════
 *  MainActivity — Instala as 4 camadas de proteção anti-anúncio
 * ═══════════════════════════════════════════════════════════
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Tema escuro imersivo
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
     * Instala as 4 camadas de defesa anti-anúncio.
     */
    private void installAdblock() {
        try {
            Bridge bridge = this.bridge;
            if (bridge == null) return;
            WebView webView = bridge.getWebView();
            if (webView == null) return;

            WebSettings settings = webView.getSettings();

            // ── Configurações de performance e compatibilidade ──
            settings.setDomStorageEnabled(true);
            settings.setJavaScriptEnabled(true);
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);

            // ═══════════════════════════════════════════════════
            //  CAMADA 1+2+4: WebViewClient
            //  Bloqueia anúncios na rede + bloqueia navegação
            //  + injeta JS anti-popup
            // ═══════════════════════════════════════════════════
            webView.setWebViewClient(new AdblockWebViewClient(bridge));

            // ═══════════════════════════════════════════════════
            //  CAMADA 3: WebChromeClient (bloqueio de popups)
            //
            //  setSupportMultipleWindows(true) faz window.open()
            //  disparar onCreateWindow (que retorna false = bloqueado)
            // ═══════════════════════════════════════════════════
            settings.setSupportMultipleWindows(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(false);
            webView.setWebChromeClient(new AdblockWebChromeClient(bridge));

        } catch (Exception e) {
            // Se falhar, o app continua funcionando (apenas sem adblock)
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        // Re-garante as camadas ao voltar para o app
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
