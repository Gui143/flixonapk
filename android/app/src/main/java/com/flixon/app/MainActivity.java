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

        // Fundo preto imersivo (antes do WebView carregar)
        try {
            Window window = getWindow();
            window.setStatusBarColor(Color.parseColor("#0a0a0a"));
            window.setNavigationBarColor(Color.parseColor("#0a0a0a"));
            window.getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            );
        } catch (Exception e) { /* noop */ }

        // Instala o bloqueador de anúncios e bloqueio de popups nativos
        installAdblock();
    }

    /**
     * Instala o AdblockWebViewClient no WebView do Capacitor.
     * Este é o equivalente Android do session.webRequest do Electron.
     * Intercepta TODAS as requisições (inclusive dentro de iframes cross-origin).
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

            // 1) ADBLOCK NATIVO: intercepta e cancela requisições de anúncios
            //    (funciona inclusive dentro de iframes cross-origin: fembed, etc.)
            webView.setWebViewClient(new AdblockWebViewClient(bridge));

            // 2) BLOQUEIO DE POPUPS: com supportMultipleWindows=false,
            //    window.open() do JS não cria janela nova => sem anúncios em popup
            settings.setSupportMultipleWindows(false);
            settings.setJavaScriptCanOpenWindowsAutomatically(false);
        } catch (Exception e) {
            // Se falhar, o app continua funcionando (sem adblock)
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        // Re-garante o adblock ao voltar para o app
        try {
            if (this.bridge != null && this.bridge.getWebView() != null) {
                WebView wv = this.bridge.getWebView();
                if (!(wv.getWebViewClient() instanceof AdblockWebViewClient)) {
                    wv.setWebViewClient(new AdblockWebViewClient(this.bridge));
                }
            }
        } catch (Exception e) { /* noop */ }
    }
}
