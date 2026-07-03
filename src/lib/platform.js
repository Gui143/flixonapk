// ─────────────────────────────────────────────────────────────
//  Detecção de plataforma (Desktop Electron vs Mobile Capacitor vs TV Box)
//  Permite que o MESMO código sirva para PC, Android e TV Box.
// ─────────────────────────────────────────────────────────────

// TV Box não expõe window.Capacitor tão cedo, então também checamos o userAgent.
const isAndroidUserAgent =
  typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent.toLowerCase());

const cap = typeof window !== 'undefined' ? window.Capacitor : undefined;

// É Android nativo (APK / TV Box)?
export const isNativeMobile =
  !!(cap && cap.isNativePlatform && cap.isNativePlatform()) || isAndroidUserAgent;

// É Electron (PC)? (no mobile, window.flixon não existe)
export const isElectron =
  !!(typeof window !== 'undefined' && window.flixon) && !isNativeMobile;

// É TV Box (sem touch)?
export const isTV =
  isNativeMobile &&
  typeof navigator !== 'undefined' &&
  /tv|smarttv|bravia|google tv|aosp on tv/i.test(navigator.userAgent.toLowerCase());

// Largura útil pra decidir layout
export function isSmallScreen() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

export const platform = isNativeMobile ? 'android' : isElectron ? 'electron' : 'web';
