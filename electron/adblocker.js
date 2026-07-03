// ─────────────────────────────────────────────────────────────
//  Adblocker (processo principal - CommonJS)
//  Lista própria (não pode importar do src/, que é ES Module).
//  Mantida em sincronia com src/lib/adblockList.js (mobile).
// ─────────────────────────────────────────────────────────────

const AD_DOMAINS = [
  // Google / DoubleClick
  'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
  'googletagmanager.com', 'google-analytics.com', 'adservice.google.com',
  'adsystem.com', 'googletagservices.com',
  // Grandes redes de anúncios
  'adsrvr.org', 'adnxs.com', 'appnexus.com', 'criteo.com', 'criteo.net',
  'taboola.com', 'taboolasyndication.com', 'outbrain.com',
  'pubmatic.com', 'rubiconproject.com', 'openx.net', 'adform.net',
  'smartadserver.com', 'revcontent.com', 'mgid.com', 'media.net',
  'zedo.com', 'undertone.com', 'tribalfusion.com', 'yieldmo.com',
  'casalemedia.com', 'moatads.com', 'serving-sys.com', '3lift.com',
  'bidswitch.net', 'contextweb.com', 'justpremium.com',
  // Trackers / telemetria
  'scorecardresearch.com', 'quantserve.com', 'chartbeat.com',
  'hotjar.com', 'mixpanel.com', 'segment.io', 'amplitude.com',
  'bluekai.com', 'demdex.net', 'evidon.com', 'truste.com',
  'facebook.net', 'connect.facebook.net', 'adroll.com', 'rlcdn.com',
  'agkn.com', 'adsafeprotected.com',
  // Popups / pop-under / redirects
  'propellerads.com', 'propeller-tracking.com',
  'popads.net', 'popcash.net', 'popmyads.com', 'propu.sh',
  'onclickperformance.com', 'onclickads.net', 'onclicktop.com',
  'meonchain.com', 'highperformanceformat.com', 'buzzblocks.com',
  'adsterra.com', 'adcash.com', 'hilltopads.net', 'adskeeper.com',
  'mobmatches.com', 'protinator.com',
  // Redes adult/vídeo
  'exoclick.com', 'exosrv.com', 'mainexosrv.com',
  'juicyads.com', 'trafficjunky.com', 'trafficjunky.net',
  'trafficstars.com', 'plugrush.com', 'ero-advertising.com',
  'adxpansion.com', 'adtng.com', 'adtng.net', 'trafficfactory.biz',
  'tsyndicate.com', 'tsyndicate.net', 'clickadu.com', 'clickaine.com',
  'realsrv.com',
  // Encurtadores
  'adf.ly', 'bc.vc', 'sh.st', 'shorte.st', 'ouo.io',
  'linkbucks.com', 'clk.sh', 'oko.sh',
  // Outros
  'bidvertiser.com', 'infolinks.com', 'kontera.com',
  'vibrantmedia.com', 'intellitxt.com',
  // Malvertising
  'ninthrotation.com', 'egresshazard.com',
  'greenredigreen.com', 'graphtie.com', 'strigops.com'
];

let blockedCount = 0;

function isAdHost(hostname) {
  if (!hostname) return false;
  const h = hostname.toLowerCase();
  return AD_DOMAINS.some((d) => h === d || h.endsWith('.' + d));
}

function getBlockedCount() {
  return blockedCount;
}
function incBlocked() {
  blockedCount++;
}

module.exports = { isAdHost, getBlockedCount, incBlocked, AD_DOMAINS };
