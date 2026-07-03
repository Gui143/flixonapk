// ─────────────────────────────────────────────────────────────
//  Segurança honesta (protege o USUÁRIO, não esconde o app)
//  - Hash de senha (PBKDF2/SHA-256, 150k iterações) — nunca guarda a senha
//  - Criptografia AES-GCM para dados sensíveis guardados
//  - Sanitização anti-XSS e validação de URLs (anti-phishing real)
//  - Checksum de integridade dos dados persistidos
// ─────────────────────────────────────────────────────────────
import { load, save, KEYS } from './store';

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
function fromB64(str) {
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
export function randomBytes(n) {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return a;
}

// PBKDF2 -> bits brutos
async function pbkdf2Bits(password, salt, iterations = 150000, len = 32) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    key,
    len * 8
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await pbkdf2Bits(password, salt);
  return { salt: b64(salt), hash: b64(hash) };
}

export async function verifyPassword(password, storedHash, storedSalt) {
  if (!storedHash || !storedSalt) return false;
  const hash = await pbkdf2Bits(password, fromB64(storedSalt));
  // comparação em tempo constante
  const a = new Uint8Array(fromB64(storedHash));
  const b = hash;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ── Cofre AES-GCM para dados sensíveis (ex.: tokens admin exportados) ──
const VAULT_PASS = 'FLIXON_LOCAL_VAULT_v1';
async function getVaultKey() {
  let saltB64 = load(KEYS.cryptoSalt);
  if (!saltB64) {
    saltB64 = b64(randomBytes(16));
    save(KEYS.cryptoSalt, saltB64);
  }
  const raw = await pbkdf2Bits(VAULT_PASS, fromB64(saltB64));
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt'
  ]);
}

export async function encryptData(obj) {
  const key = await getVaultKey();
  const iv = randomBytes(12);
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(JSON.stringify(obj))
  );
  return b64(iv) + ':' + b64(ct);
}

export async function decryptData(str) {
  try {
    const [ivb, ctb] = String(str).split(':');
    const key = await getVaultKey();
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromB64(ivb) },
      key,
      fromB64(ctb)
    );
    return JSON.parse(dec.decode(pt));
  } catch {
    return null;
  }
}

// ── Anti-XSS / sanitização ──
export function sanitizeText(s) {
  return String(s ?? '').replace(/[<>]/g, (c) => (c === '<' ? '&lt;' : '&gt;'));
}
const ALLOWED_EMBED_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'www.youtube-nocookie.com',
  'player.vimeo.com',
  'vimeo.com',
  'www.dailymotion.com',
  'drive.google.com'
]);

// Validação de URL para embeds do admin (bloqueia javascript:/data:/http)
export function isSafeEmbedUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (!['https:'].includes(u.protocol)) return false;
  if (ALLOWED_EMBED_HOSTS.has(u.hostname)) return true;
  return true; // demais https permitidos, mas marcados como "não verificado" na UI
}

// Proteção anti-phishing real: bloqueia esquemas perigosos e domínios que
// tentam se passar pelo FlixOn.
export function isLikelyPhishingUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    return true;
  }
  if (['javascript:', 'data:', 'vbscript:', 'file:'].includes(u.protocol))
    return true;
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(u.hostname)) return true; // IP puro
  if (
    u.hostname.includes('flixon') &&
    u.hostname !== 'flixonapp.vercel.app' &&
    !u.hostname.endsWith('.flixon.app')
  )
    return true; // impersonação de marca
  return false;
}

// Integridade dos dados persistidos (SHA-256)
export async function integrityChecksum(obj) {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    enc.encode(JSON.stringify(obj))
  );
  return b64(buf).slice(0, 16);
}
