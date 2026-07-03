package com.flixon.app;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Bloqueio de anúncios por DOMÍNIO + PALAVRA-CHAVE na URL.
 * Pega domínios rotativos de cassino (tigrinho) que mudam sempre.
 */
public class AdDomains {

    // ── Domínios conhecidos de anúncios/trackers ──
    private static final Set<String> DOMAINS = new HashSet<>(Arrays.asList(
        "doubleclick.net", "googlesyndication.com", "googleadservices.com",
        "googletagmanager.com", "google-analytics.com", "adservice.google.com",
        "adsystem.com", "googletagservices.com",
        "adsrvr.org", "adnxs.com", "appnexus.com", "criteo.com", "criteo.net",
        "taboola.com", "taboolasyndication.com", "outbrain.com",
        "pubmatic.com", "rubiconproject.com", "openx.net", "adform.net",
        "smartadserver.com", "revcontent.com", "mgid.com", "media.net",
        "zedo.com", "undertone.com", "tribalfusion.com", "yieldmo.com",
        "casalemedia.com", "moatads.com", "serving-sys.com", "3lift.com",
        "bidswitch.net", "contextweb.com", "justpremium.com",
        "scorecardresearch.com", "quantserve.com", "chartbeat.com",
        "hotjar.com", "mixpanel.com", "segment.io", "amplitude.com",
        "bluekai.com", "demdex.net", "evidon.com", "truste.com",
        "facebook.net", "connect.facebook.net", "adroll.com", "rlcdn.com",
        "agkn.com", "adsafeprotected.com",
        "propellerads.com", "propeller-tracking.com",
        "popads.net", "popcash.net", "popmyads.com", "propu.sh",
        "onclickperformance.com", "onclickads.net", "onclicktop.com",
        "meonchain.com", "highperformanceformat.com", "buzzblocks.com",
        "adsterra.com", "adcash.com", "hilltopads.net", "adskeeper.com",
        "mobmatches.com", "protinator.com",
        "exoclick.com", "exosrv.com", "mainexosrv.com",
        "juicyads.com", "trafficjunky.com", "trafficjunky.net",
        "trafficstars.com", "plugrush.com", "ero-advertising.com",
        "adxpansion.com", "adtng.com", "adtng.net", "trafficfactory.biz",
        "tsyndicate.com", "tsyndicate.net", "clickadu.com", "clickaine.com",
        "realsrv.com",
        "adf.ly", "bc.vc", "sh.st", "shorte.st", "ouo.io",
        "linkbucks.com", "clk.sh", "oko.sh",
        "bidvertiser.com", "infolinks.com", "kontera.com",
        "vibrantmedia.com", "intellitxt.com",
        "ninthrotation.com", "egresshazard.com",
        "greenredigreen.com", "graphtie.com", "strigops.com",
        // ── Cassino / apostas (tigrinho e similares) ──
        "monetag.com", "profitabledisplaynetwork.com",
        "pubpower.com", "displaynetworksolutions.com"
    ));

    // ── Palavras-chave na URL completa (pega domínios rotativos) ──
    private static final String[] URL_KEYWORDS = {
        // Fortune Tiger (tigrinho) e jogos similares
        "fortune-tiger", "fortune_tiger", "fortunetiger", "fortune.tiger",
        "jogo-do-tigre", "jogodotigre", "tigrinho", "tigre-jogo",
        "fortune-rabbit", "fortunerabbit", "fortune-mouse", "fortunemouse",
        "fortune-ox", "fortuneox", "fortune-dragon", "fortunedragon",
        "fortune-elephant", "fortune-rat",
        "happy-tiger", "tiger-fortune", "lucky-tiger",
        // Cassino / apostas
        "cassino-online", "casino-online", "/casino/", "cassino-jogo",
        "apostas-online", "aposta-online", "apostar-agora",
        "jogos-de-caca", "caça-níqueis", "caca-niqueis",
        "crash-game", "aviator-jogo", "aviator-game", "aviator-bet",
        "slots-online", "slot-online", "/slots/",
        "roleta-online", "blackjack-online", "poker-online",
        "pix-bet", "bet-online", "bet365-", "betano-",
        // Padrões de anúncio/redirecionamento
        "popunder", "pop-under", "pop_under",
        "adclick", "ad-click", "/ads/", "/adv/",
        "/redirect?u=", "/go.php?", "/clk?", "/click?",
        "/banner-ad/", "/promo-ad/",
        "girar-e-ganhar", "ganhe-agora", "jogue-agora",
        "bonus-de-cadastro", "bônus-grátis",
        // Redes de anúncio comuns em players
        "monetag", "propellerads", "adskeeper", "hilltopads",
        "adcash", "adsterra", "popads", "popcash",
        "onclickperformance", "highperformanceformat"
    };

    /** Verifica por DOMÍNIO */
    public static boolean isAdHost(String host) {
        if (host == null) return false;
        host = host.toLowerCase();
        if (DOMAINS.contains(host)) return true;
        for (String d : DOMAINS) {
            if (host.endsWith("." + d)) return true;
        }
        return false;
    }

    /** Verifica por PALAVRA-CHAVE na URL completa (pega domínios rotativos) */
    public static boolean isAdUrl(String url) {
        if (url == null) return false;
        String lower = url.toLowerCase();
        // 1. Checa domínio
        try {
            String host = java.net.URI.create(url).getHost();
            if (isAdHost(host)) return true;
        } catch (Exception e) {}
        // 2. Checa palavras-chave
        for (String kw : URL_KEYWORDS) {
            if (lower.contains(kw)) return true;
        }
        return false;
    }
}
