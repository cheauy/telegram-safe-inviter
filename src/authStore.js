import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');

export const SESSION_COOKIE_NAME = 'tenhgram_session';

export function getDataDir() {
  return process.env.TELEGRAM_DATA_DIR || DEFAULT_DATA_DIR;
}

function getUsersFile() {
  return path.join(getDataDir(), 'users.json');
}

function getAuthSecretFile() {
  return path.join(getDataDir(), '.auth-secret');
}

function getUserConfigFile(userId) {
  const safeId = String(userId || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!safeId) throw new Error('Invalid user ID.');
  return path.join(getDataDir(), 'configs', `${safeId}.json`);
}

function readJsonFile(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJsonFile(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function getAuthSecret() {
  if (process.env.AUTH_SECRET?.trim()) return process.env.AUTH_SECRET.trim();
  const secretFile = getAuthSecretFile();
  if (fs.existsSync(secretFile)) {
    const existing = fs.readFileSync(secretFile, 'utf8').trim();
    if (existing) return existing;
  }
  const generated = crypto.randomBytes(32).toString('hex');
  fs.mkdirSync(path.dirname(secretFile), { recursive: true });
  fs.writeFileSync(secretFile, generated, 'utf8');
  return generated;
}

function hashPassword(password, salt) {
  return crypto.scryptSync(String(password), salt, 64).toString('hex');
}

function verifyPassword(password, salt, expectedHex) {
  const actual = Buffer.from(hashPassword(password, salt), 'hex');
  const expected = Buffer.from(String(expectedHex || ''), 'hex');
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

export function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export function listUsers() {
  const list = readJsonFile(getUsersFile(), []);
  return Array.isArray(list) ? list : [];
}

export function findUserById(userId) {
  return sanitizeUser(listUsers().find(u => u.id === userId) || null);
}

export function createUser({ name = '', email = '', password = '' }) {
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanName = String(name).trim() || cleanEmail.split('@')[0] || 'User';
  const rawPass = String(password);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('Please enter a valid email address.');
  }
  if (rawPass.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }
  if (cleanName.length < 2) {
    throw new Error('Name must be at least 2 characters.');
  }

  const users = listUsers();
  if (users.some(u => u.email === cleanEmail)) {
    throw new Error('An account with this email already exists. Please Sign In.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const userRecord = {
    id: `u_${crypto.randomBytes(8).toString('hex')}`,
    name: cleanName.slice(0, 60),
    email: cleanEmail,
    salt,
    passwordHash: hashPassword(rawPass, salt),
    webhookSecret: crypto.randomBytes(10).toString('hex'),
    createdAt: new Date().toISOString(),
  };

  users.push(userRecord);
  writeJsonFile(getUsersFile(), users);
  return sanitizeUser(userRecord);
}

export function authenticateUser({ email = '', password = '' }) {
  const cleanEmail = String(email).trim().toLowerCase();
  const rawPass = String(password);
  const users = listUsers();
  const user = users.find(u => u.email === cleanEmail);
  if (!user || !verifyPassword(rawPass, user.salt, user.passwordHash)) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }
  return sanitizeUser(user);
}

export function createSessionToken(userId, ttlMs = 30 * 86400_000) {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + ttlMs }),
    'utf8'
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getAuthSecret())
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

export function verifySessionToken(token) {
  try {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const [payload, sig] = token.split('.');
    const expectedSig = crypto
      .createHmac('sha256', getAuthSecret())
      .update(payload)
      .digest('base64url');

    const a = Buffer.from(sig, 'utf8');
    const b = Buffer.from(expectedSig, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!parsed?.uid || !parsed?.exp || parsed.exp < Date.now()) return null;
    return findUserById(parsed.uid);
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader = '') {
  const out = {};
  for (const part of String(cookieHeader).split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    try { out[k] = decodeURIComponent(v); } catch { out[k] = v; }
  }
  return out;
}

export function getRequestUser(req) {
  const cookies = parseCookies(req?.headers?.cookie || '');
  return verifySessionToken(cookies[SESSION_COOKIE_NAME] || cookies.teleguard_session);
}

export function sessionCookieHeader(token, maxAgeSeconds = 30 * 86400) {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookieHeader() {
  return [
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    `teleguard_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  ];
}

export function loadUserEnv(userId) {
  const userOverrides = readJsonFile(getUserConfigFile(userId), {});
  return {
    TELEGRAM_BOT_TOKEN: userOverrides.TELEGRAM_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN ?? '',
    TELEGRAM_CHAT_ID: userOverrides.TELEGRAM_CHAT_ID ?? process.env.TELEGRAM_CHAT_ID ?? '',
    TELEGRAM_WELCOME_TEXT: userOverrides.TELEGRAM_WELCOME_TEXT ?? process.env.TELEGRAM_WELCOME_TEXT ?? '',
    TELEGRAM_API_ID: userOverrides.TELEGRAM_API_ID ?? process.env.TELEGRAM_API_ID ?? '',
    TELEGRAM_API_HASH: userOverrides.TELEGRAM_API_HASH ?? process.env.TELEGRAM_API_HASH ?? '',
    TELEGRAM_STRING_SESSION: userOverrides.TELEGRAM_STRING_SESSION ?? process.env.TELEGRAM_STRING_SESSION ?? '',
    MTPROTO_MAX_INVITES_PER_HOUR: userOverrides.MTPROTO_MAX_INVITES_PER_HOUR ?? process.env.MTPROTO_MAX_INVITES_PER_HOUR ?? '4',
    MTPROTO_MAX_INVITES_PER_DAY: userOverrides.MTPROTO_MAX_INVITES_PER_DAY ?? process.env.MTPROTO_MAX_INVITES_PER_DAY ?? '15',
    MTPROTO_MAX_CONTACTS_PER_DAY: userOverrides.MTPROTO_MAX_CONTACTS_PER_DAY ?? process.env.MTPROTO_MAX_CONTACTS_PER_DAY ?? '12',
  };
}

export function saveUserEnv(userId, updates) {
  const file = getUserConfigFile(userId);
  const current = readJsonFile(file, {});
  const next = { ...current };
  for (const [k, v] of Object.entries(updates || {})) {
    if (v !== undefined) next[k] = Array.isArray(v) ? v : String(v);
  }
  writeJsonFile(file, next);
  return loadUserEnv(userId);
}

export function loadUserMtprotoAccounts(userId) {
  const userOverrides = userId ? readJsonFile(getUserConfigFile(userId), {}) : {};
  const list = Array.isArray(userOverrides.MTPROTO_ACCOUNTS) ? userOverrides.MTPROTO_ACCOUNTS : [];
  if (list.length > 0) return list;

  const env = userId ? loadUserEnv(userId) : process.env;
  if (env.TELEGRAM_API_ID?.trim() && env.TELEGRAM_API_HASH?.trim() && env.TELEGRAM_STRING_SESSION?.trim()) {
    return [
      {
        id: 'primary',
        label: 'Primary Account',
        apiId: String(env.TELEGRAM_API_ID).trim(),
        apiHash: String(env.TELEGRAM_API_HASH).trim(),
        sessionString: String(env.TELEGRAM_STRING_SESSION).trim(),
        phone: '',
        username: null,
        firstName: 'Primary Account',
        addedAt: null,
      },
    ];
  }
  return [];
}

export function upsertUserMtprotoAccount(userId, account) {
  const file = getUserConfigFile(userId);
  const current = readJsonFile(file, {});
  const existing = loadUserMtprotoAccounts(userId);
  const cleanPhone = String(account.phone || '').trim();
  const cleanSession = String(account.sessionString || '').trim();
  const cleanId = account.id || `acc_${crypto.randomBytes(4).toString('hex')}`;

  const matchIdx = existing.findIndex(
    a => (account.id && a.id === account.id) || (cleanPhone && a.phone === cleanPhone) || (cleanSession && a.sessionString === cleanSession)
  );

  const record = {
    id: matchIdx >= 0 ? existing[matchIdx].id : cleanId,
    label: String(account.label || account.firstName || cleanPhone || `Account ${existing.length + 1}`).trim().slice(0, 48),
    apiId: String(account.apiId || '').trim(),
    apiHash: String(account.apiHash || '').trim(),
    sessionString: cleanSession,
    phone: cleanPhone,
    username: account.username || null,
    firstName: account.firstName || '',
    addedAt: (matchIdx >= 0 && existing[matchIdx].addedAt) || new Date().toISOString(),
  };

  if (matchIdx >= 0) existing[matchIdx] = record;
  else existing.push(record);

  const next = {
    ...current,
    MTPROTO_ACCOUNTS: existing,
    TELEGRAM_API_ID: existing[0].apiId,
    TELEGRAM_API_HASH: existing[0].apiHash,
    TELEGRAM_STRING_SESSION: existing[0].sessionString,
  };
  writeJsonFile(file, next);
  return existing;
}

export function removeUserMtprotoAccount(userId, accountId) {
  const file = getUserConfigFile(userId);
  const current = readJsonFile(file, {});
  const existing = loadUserMtprotoAccounts(userId);
  const remaining = existing.filter(a => a.id !== accountId);

  const next = {
    ...current,
    MTPROTO_ACCOUNTS: remaining,
    TELEGRAM_API_ID: remaining[0]?.apiId || current.TELEGRAM_API_ID || '',
    TELEGRAM_API_HASH: remaining[0]?.apiHash || current.TELEGRAM_API_HASH || '',
    TELEGRAM_STRING_SESSION: remaining[0]?.sessionString || '',
  };
  writeJsonFile(file, next);
  return remaining;
}
