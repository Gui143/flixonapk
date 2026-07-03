package com.flixon.app;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Lista de domínios de anúncios/trackers (mesma do PC e do mobile JS).
 * Usada pelo WebViewClient nativo para bloquear requisições.
 */
public class AdDomains {
    private static final Set<String> DOMAINS = new HashSet<>(Arrays.asList(
        // Google / DoubleClick
        "doubleclick.net", "googlesyndication.com", "googleadservices.com",
        "googletagmanager.com", "google-analytics.com", "adservice.google.com",
        "adsystem.com", "googletagservices.com",
        // Grandes redes
        "adsrvr.org", "adnxs.com", "appnexus.com", "criteo.com", "criteo.net",
        "taboola.com", "taboolasyndication.com", "outbrain.com",
        "pubmatic.com", "rubiconproject.com", "openx.net", "adform.net",
        "smartadserver.com", "revcontent.com", "mgid.com", "media.net",
        "zedo.com", "undertone.com", "tribalfusion.com", "yieldmo.com",
        "casalemedia.com", "moatads.com", "serving-sys.com", "3lift.com",
        "bidswitch.net", "contextweb.com", "justpremium.com",
        // Trackers
        "scorecardresearch.com", "quantserve.com", "chartbeat.com",
        "hotjar.com", "mixpanel.com", "segment.io", "amplitude.com",
        "bluekai.com", "demdex.net", "evidon.com", "truste.com",
        "facebook.net", "connect.facebook.net", "adroll.com", "rlcdn.com",
        "agkn.com", "adsafeprotected.com",
        // Popups / redirects
        "propellerads.com", "propeller-tracking.com",
        "popads.net", "popcash.net", "popmyads.com", "propu.sh",
        "onclickperformance.com", "onclickads.net", "onclicktop.com",
        "meonchain.com", "highperformanceformat.com", "buzzblocks.com",
        "adsterra.com", "adcash.com", "hilltopads.net", "adskeeper.com",
        "mobmatches.com", "protinator.com",
        // Adult / vídeo
        "exoclick.com", "exosrv.com", "mainexosrv.com",
        "juicyads.com", "trafficjunky.com", "trafficjunky.net",
        "trafficstars.com", "plugrush.com", "ero-advertising.com",
        "adxpansion.com", "adtng.com", "adtng.net", "trafficfactory.biz",
        "tsyndicate.com", "tsyndicate.net", "clickadu.com", "clickaine.com",
        "realsrv.com",
        // Encurtadores
        "adf.ly", "bc.vc", "sh.st", "shorte.st", "ouo.io",
        "linkbucks.com", "clk.sh", "oko.sh",
        // Outros
        "bidvertiser.com", "infolinks.com", "kontera.com",
        "vibrantmedia.com", "intellitxt.com",
        // Malvertising
        "ninthrotation.com", "egresshazard.com",
        "greenredigreen.com", "graphtie.com", "strigops.com"
    ));

    public static boolean isAdHost(String host) {
        if (host == null) return false;
        host = host.toLowerCase();
        if (DOMAINS.contains(host)) return true;
        // checa subdomínios (ex: ad.doubleclick.net)
        for (String d : DOMAINS) {
            if (host.endsWith("." + d)) return true;
        }
        return false;
    }
}
