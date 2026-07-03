package com.flixon.app;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebChromeClient;

import android.os.Message;
import android.webkit.WebView;

/**
 * WebChromeClient que estende o do Capacitor (preserva upload de arquivos,
 * permissões de câmera, etc.) e BLOQUEIA a criação de novas janelas.
 *
 * Isto é a defesa definitiva contra popups/pop-under:
 *
 * Com setSupportMultipleWindows(true), qualquer chamada a window.open()
 * dispara onCreateWindow. Retornando false, a janela NÃO é criada.
 *
 * Diferente de setSupportMultipleWindows(false) (que alguns scripts
 * conseguem burlar), esta abordagem garante que NENHUMA nova janela
 * ou popup seja aberta — pelo FemBed ou qualquer outro player.
 */
public class AdblockWebChromeClient extends BridgeWebChromeClient {

    public AdblockWebChromeClient(Bridge bridge) {
        super(bridge);
    }

    @Override
    public boolean onCreateWindow(WebView view, boolean isDialog,
                                  boolean isUserGesture, Message resultMsg) {
        // BLOQUEIA toda nova janela (popups de anúncio/scam)
        // return false = não cria a janela
        return false;
    }
}
