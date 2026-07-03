// Persistência local (localStorage). No Electron ele também é persistido
// no userData da app. Chave/valor em JSON.

export function load(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Falha ao salvar', key, e);
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    /* noop */
  }
}

export const KEYS = {
  users: 'flixon.users',
  session: 'flixon.session',
  mylist: 'flixon.mylist',
  prefs: 'flixon.prefs',
  plans: 'flixon.plans',
  adminContent: 'flixon.admin.content',
  analyticsConsent: 'flixon.analytics.consent',
  analyticsEvents: 'flixon.analytics.events',
  consentShown: 'flixon.consent.shown',
  cryptoSalt: 'flixon.crypto.salt'
};
