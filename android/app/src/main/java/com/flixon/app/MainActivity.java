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

        // Fundo preto imersivo
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

    private void installAdblock() {
        try {
            Bridge bridge = this.bridge;
            if (bridge == null) return;
            WebView webView = bridge.getWebView();
            if (webView == null) return;

            WebSettings settings = webView.getSettings();

            // Performance
            settings.setDomStorageEnabled(true);
            settings.setJavaScriptEnabled(true);
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);

            // ══ 1) ADBLOCK NATIVO + BLOQUEIO DE NAVEGAÇÃO ══
            // Intercepta anúncios na rede (shouldInterceptRequest)
            // E bloqueia navegação para URLs de anúncio (shouldOverrideUrlLoading)
            // → Impede o "tigrinho" de abrir/abandonar o app
            webView.setWebViewClient(new AdblockWebViewClient(bridge));

            // ══ 2) BLOQUEIO DE POPUPS ══
            // supportMultipleWindows=false => window.open() retorna null
            // → Nenhum popup de anúncio abre
            settings.setSupportMultipleWindows(false);
            settings.setJavaScriptCanOpenWindowsAutomatically(false);
        } catch (Exception e) {}
    }

    @Override
    public void onResume() {
        super.onResume();
        try {
            if (this.bridge != null && this.bridge.getWebView() != null) {
                WebView wv = this.bridge.getWebView();
                if (!(wv.getWebViewClient() instanceof AdblockWebViewClient)) {
                    wv.setWebViewClient(new AdblockWebViewClient(this.bridge));
                }
            }
        } catch (Exception e) {}
    }
}
