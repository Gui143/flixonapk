package com.flixon.app;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebChromeClient;

import android.os.Message;
import android.webkit.WebView;

/**
 * ═══════════════════════════════════════════════════════════
 *  CAMADA 3 — Bloqueio DEFINITIVO de popups
 * ═══════════════════════════════════════════════════════════
 *
 *  Estende o BridgeWebChromeClient do Capacitor (preserva upload
 *  de arquivos, permissões de câmera/mic, etc.) e BLOQUEIA
 *  a criação de qualquer nova janela.
 *
 *  Funcionamento:
 *    Com setSupportMultipleWindows(true), qualquer window.open()
 *    dispara onCreateWindow. Retornando false, a janela NÃO é criada.
 *
 *  Diferente de setSupportMultipleWindows(false) (que alguns scripts
 *  do fembed conseguem burlar), esta abordagem é IMPOSSÍVEL de contornar:
 *    • O script chama window.open() → o Android intercepta → retorna false
 *    • Nenhum popup, pop-under, ou nova aba abre
 *
 *  Isso elimina os anúncios do tipo "Brazino 777" e "Instale o navegador"
 *  que abriam em janelas separadas.
 * ═══════════════════════════════════════════════════════════
 */
public class AdblockWebChromeClient extends BridgeWebChromeClient {

    public AdblockWebChromeClient(Bridge bridge) {
        super(bridge);
    }

    @Override
    public boolean onCreateWindow(WebView view, boolean isDialog,
                                  boolean isUserGesture, Message resultMsg) {
        // ══ BLOQUEIA TODA nova janela/popup ══
        // return false = a janela NÃO é criada
        // Isto captura: popups, pop-unders, target=_blank, window.open()
        return false;
    }
}
