// ─────────────────────────────────────────────────────────────
//  FlixOn — Processo principal do Electron
//  Defesa em camadas contra anúncios/popups de players de embed:
//   1) Adblock de rede (cancela requisições de anúncios)
//   2) Bloqueio de popup (setWindowOpenHandler => deny, sem abrir navegador)
//   3) Bloqueio de navegação (will-navigate => impede redirect do app)
//   4) Injeção anti-anúncio nos frames de embed (neutraliza window.open/click)
//   + Embeds funcionam: remove X-Frame-Options e simula Referer
// ─────────────────────────────────────────────────────────────
const { app, BrowserWindow, ipcMain, session, shell, net } = require('electron');
const path = require('path');
const { isAdHost, incBlocked } = require('./adblocker');
const { isVideoEmbedHost, buildEmbedHeaders } = require('./embedSupport');

const isDev = !!process.env.VITE_DEV_SERVER_URL;
let mainWindow = null;

const UPDATE_MANIFEST_URL = '';
const APP_VERSION = require('../package.json').version;

const ALLOWED_ORIGINS = isDev
  ? ['http://localhost:5173', 'http://127.0.0.1:5173']
  : ['file://'];

function senderURL(e) {
  try {
    if (e.senderFrame && e.senderFrame.url) return e.senderFrame.url;
    if (e.sender && typeof e.sender.getURL === 'function') return e.sender.getURL();
  } catch {
    /* noop */
  }
  return '';
}
function isAllowed(e) {
  const url = senderURL(e);
  return url ? ALLOWED_ORIGINS.some((o) => url.startsWith(o)) : false;
}

function hostOf(urlStr) {
  try {
    return new URL(urlStr).hostname.toLowerCase();
  } catch {
    return '';
  }
}

// Script injetado nos frames de embed para neutralizar anúncios e popups.
// Sobrescreve window.open, bloqueia cliques em elementos de anúncio típicos,
// e impede redirecionamentos via top.location.
const ANTI_AD_SCRIPT = `
(function () {
  try {
    // 1) Neutraliza window.open (popups/pop-under)
    window.open = function () { return null; };
    // 2) Neutraliza tentativas de redirecionar a janela principal
    try {
      Object.defineProperty(window.top, 'location', {
        configurable: false,
        get: function () { return window.location; },
        set: function () { /* bloqueado */ }
      });
    } catch (e) {}
    // 3) Intercepta cliques que tentam abrir anúncios (target=_blank, onclick navigate)
    document.addEventListener('click', function (ev) {
      try {
        var t = ev.target;
        while (t && t !== document.body) {
          if (t.tagName === 'A' && t.target && t.target.toLowerCase() === '_blank') {
            ev.preventDefault();
            ev.stopPropagation();
            return false;
          }
          if (t.onclick && /location\\.\\s*href|window\\.open|http/i.test(String(t.onclick))) {
            ev.preventDefault();
            ev.stopPropagation();
            return false;
          }
          t = t.parentNode;
        }
      } catch (e) {}
    }, true);
    // 4) Remove overlays de anúncio comuns (banners fixos no topo/base)
    var removeAds = function () {
      try {
        var sels = [
          '[id*="banner"]', '[id*="ad-"]', '[id*="ads"]', '[id*="popup"]',
          '[class*="banner"]', '[class*="advert"]', '[class*="promo"]',
          'ins.adsbygoogle', 'iframe[src*="doubleclick"]',
          'iframe[src*="googlesyndication"]', 'iframe[src*="taboola"]',
          'div[style*="z-index: 2147483647"]'
        ];
        sels.forEach(function (sel) {
          document.querySelectorAll(sel).forEach(function (el) {
            if (el && el.parentNode) el.parentNode.removeChild(el);
          });
        });
      } catch (e) {}
    };
    removeAds();
    setInterval(removeAds, 1500);
  } catch (e) {}
})();
`;

// ── Configura a session com UM handler por evento (sem conflito) ──
function configureSession() {
  const ses = session.defaultSession;

  // CSP do app (apenas para o documento principal)
  const csp = [
    "default-src 'self'",
    "img-src 'self' https: data:",
    "media-src 'self' https: blob:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https: blob:",
      "frame-src https:",
      "script-src 'self'"
    ].join('; ');

  // ── onHeadersReceived (ÚNICO handler) ──
  // Remove bloqueadores de iframe de TODAS as respostas + aplica CSP só no app
  ses.webRequest.onHeadersReceived((details, callback) => {
    const headers = Object.assign({}, details.responseHeaders || {});

    // Remove cabeçalhos que bloqueiam iframe (qualquer host)
    for (const key of Object.keys(headers)) {
      const lower = key.toLowerCase();
      if (lower === 'x-frame-options') {
        delete headers[key];
      } else if (
        lower === 'content-security-policy' ||
        lower === 'content-security-policy-report-only'
      ) {
        const val = Array.isArray(headers[key])
          ? headers[key].join('; ')
          : String(headers[key]);
        headers[key] = [val.replace(/frame-ancestors[^;]*;?\s*/gi, '')];
      } else if (
        lower === 'cross-origin-opener-policy' ||
        lower === 'cross-origin-embedder-policy' ||
        lower === 'cross-origin-resource-policy' ||
        lower === 'cross-origin-embedder-policy-report-only'
      ) {
        delete headers[key];
      }
    }

    // Aplica CSP do FlixOn SOMENTE no documento do app
    if (details.resourceType === 'mainFrame') {
      headers['Content-Security-Policy'] = [csp];
    }

    callback({ responseHeaders: headers });
  });

  // ── onBeforeRequest (ÚNICO handler) ──
  // Cancela anúncios antes de saírem (mais eficiente)
  ses.webRequest.onBeforeRequest((details, callback) => {
    const host = hostOf(details.url);
    if (isAdHost(host)) {
      incBlocked();
      return callback({ cancel: true });
    }
    callback({});
  });

  // ── onBeforeSendHeaders (ÚNICO handler) ──
  // Bloqueia anúncios + simula Referer para hosts de embed
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    const host = hostOf(details.url);

    // Bloqueia anúncios
    if (isAdHost(host)) {
      incBlocked();
      return callback({ cancel: true });
    }

    // Ajusta Referer/Origin para players de embed
    if (isVideoEmbedHost(host)) {
      return callback({ requestHeaders: buildEmbedHeaders(host, details.requestHeaders) });
    }

    callback({ requestHeaders: details.requestHeaders });
  });
}

// ── Verificação de atualização ──
function checkForUpdate() {
  if (!UPDATE_MANIFEST_URL || !mainWindow) return;
  try {
    const req = net.request(UPDATE_MANIFEST_URL);
    let body = '';
    req.on('response', (res) => {
      res.on('data', (c) => (body += c.toString()));
      res.on('end', () => {
        try {
          const m = JSON.parse(body);
          if (m.version && isNewer(m.version, APP_VERSION)) {
            mainWindow?.webContents?.send('update-available', {
              version: m.version,
              url: m.url || '',
              notes: m.notes || ''
            });
          }
        } catch {
          /* noop */
        }
      });
    });
    req.on('error', () => {});
    req.end();
  } catch {
    /* noop */
  }
}

function isNewer(remote, current) {
  const r = String(remote).split('.').map(Number);
  const c = String(current).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((r[i] || 0) > (c[i] || 0)) return true;
    if ((r[i] || 0) < (c[i] || 0)) return false;
  }
  return false;
}

function createWindow() {
  configureSession();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 940,
    minHeight: 600,
    frame: false,
    backgroundColor: '#0a0a0a',
    title: 'FlixOn',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  const wc = mainWindow.webContents;

  // ═══════════════════════════════════════════════════════════
  //  BLOQUEIO DE POPUPS (a correção principal)
  //  Negar TODOS os popups vindos de iframes de players, SEM abrir
  //  no navegador. Antes eu chamava shell.openExternal => abria anúncios.
  // ═══════════════════════════════════════════════════════════
  wc.setWindowOpenHandler(({ url }) => {
    // Bloqueia TUDO silenciosamente. Popups de players de embed são
    // sempre anúncios/redirects. Não abrimos no navegador.
    return { action: 'deny' };
  });

  // ═══════════════════════════════════════════════════════════
  //  BLOQUEIO DE NAVEGAÇÃO NÃO SOLICITADA
  //  Players tentam redirecionar a página principal (top-level).
  //  Permitimos apenas file:// (o app) e navegação interna via hash.
  // ═══════════════════════════════════════════════════════════
  wc.on('will-navigate', (e, url) => {
    // Permite apenas o próprio app e dev server. Redirecionamentos
    // http(s) vindos de players = anúncios/redirect => bloqueados.
    if (url.startsWith('file://') || url.startsWith('http://localhost')) {
      return;
    }
    e.preventDefault();
  });

  // ═══════════════════════════════════════════════════════════
  //  INJEÇÃO ANTI-ANÚNCIO nos frames de embed
  //  Neutraliza window.open, clicks de anúncio e remove overlays.
  // ═══════════════════════════════════════════════════════════
  wc.on('did-frame-finish-load', (e, isMainFrame) => {
    if (isMainFrame) return;
    // Injeta em todos os subframes (players de embed)
    try {
      const frames = wc.mainFrame.framesInSubtree || [];
      for (const frame of frames) {
        if (frame === wc.mainFrame) continue;
        if (frame.url && /^https?:/i.test(frame.url)) {
          frame.executeJavaScript(ANTI_AD_SCRIPT, true).catch(() => {});
        }
      }
    } catch {
      /* noop */
    }
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    wc.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // ── IPC ──
  ipcMain.on('win:minimize', (e) => isAllowed(e) && mainWindow?.minimize());
  ipcMain.on('win:toggle-maximize', (e) => {
    if (!isAllowed(e) || !mainWindow) return;
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  });
  ipcMain.on('win:close', (e) => isAllowed(e) && mainWindow?.close());
  ipcMain.handle('win:is-maximized', (e) =>
    isAllowed(e) ? !!mainWindow?.isMaximized() : false
  );
  ipcMain.handle('shell:open-external', (e, url) => {
    if (!isAllowed(e)) return false;
    try {
      const u = new URL(url);
      if (u.protocol === 'http:' || u.protocol === 'https:') {
        shell.openExternal(u.href);
        return true;
      }
    } catch {
      /* noop */
    }
    return false;
  });
  ipcMain.handle('app:version', (e) => (isAllowed(e) ? APP_VERSION : null));

  const syncMax = () =>
    mainWindow?.webContents?.send('win:maximize-changed', !!mainWindow?.isMaximized());
  mainWindow.on('maximize', syncMax);
  mainWindow.on('unmaximize', syncMax);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  setTimeout(checkForUpdate, 5000);
  setInterval(checkForUpdate, 6 * 60 * 60 * 1000);
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
