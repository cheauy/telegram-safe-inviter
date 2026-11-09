import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILE = path.join(ROOT_DIR, '.env');

function formatEnvValue(val) {
  const s = String(val ?? '').replace(/\r?\n/g, ' ').trim();
  if (!s) return '';
  if (/[\s#"'`]/.test(s)) {
    return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return s;
}

export function updateEnvFile(updates, envPath = ENV_FILE) {
  const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const lines = existing ? existing.split(/\r?\n/) : [];
  const remaining = { ...updates };

  const nextLines = lines.map(line => {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=/);
    if (!match) return line;
    const key = match[1];
    if (Object.hasOwn(remaining, key)) {
      const value = remaining[key];
      delete remaining[key];
      process.env[key] = String(value ?? '');
      return `${key}=${formatEnvValue(value)}`;
    }
    return line;
  });

  for (const [key, value] of Object.entries(remaining)) {
    process.env[key] = String(value ?? '');
    nextLines.push(`${key}=${formatEnvValue(value)}`);
  }

  fs.writeFileSync(envPath, nextLines.join('\n').replace(/\n+$/, '\n'), 'utf8');
}

function maskSecret(val) {
  const s = String(val || '').trim();
  if (!s) return '';
  if (s.length <= 8) return '••••••••';
  return `${s.slice(0, 4)}••••${s.slice(-4)}`;
}

export function getMaskedConfig(env = process.env, accounts = []) {
  const maskedAccounts = (Array.isArray(accounts) ? accounts : []).map(a => ({
    id: a.id,
    label: a.label || a.firstName || a.phone || 'Account',
    phone: a.phone || '',
    username: a.username || null,
    firstName: a.firstName || '',
    addedAt: a.addedAt || null,
  }));
  return {
    botConfigured: Boolean(env.TELEGRAM_BOT_TOKEN?.trim() && env.TELEGRAM_CHAT_ID?.trim()),
    botTokenSet: Boolean(env.TELEGRAM_BOT_TOKEN?.trim()),
    botTokenPreview: maskSecret(env.TELEGRAM_BOT_TOKEN),
    chatId: env.TELEGRAM_CHAT_ID || '',
    welcomeText: env.TELEGRAM_WELCOME_TEXT || 'Welcome {name}! Your request to join has been approved.',
    mtprotoConfigured:
      maskedAccounts.length > 0 ||
      Boolean(env.TELEGRAM_API_ID?.trim() && env.TELEGRAM_API_HASH?.trim() && env.TELEGRAM_STRING_SESSION?.trim()),
    apiId: env.TELEGRAM_API_ID || '',
    apiHashSet: Boolean(env.TELEGRAM_API_HASH?.trim()),
    apiHashPreview: maskSecret(env.TELEGRAM_API_HASH),
    sessionSet:
      maskedAccounts.length > 0 || Boolean(env.TELEGRAM_STRING_SESSION?.trim()),
    mtprotoAccounts: maskedAccounts,
    limits: {
      maxInvitesPerHour: Number(env.MTPROTO_MAX_INVITES_PER_HOUR || 4),
      maxInvitesPerDay: Number(env.MTPROTO_MAX_INVITES_PER_DAY || 15),
      maxContactsPerDay: Number(env.MTPROTO_MAX_CONTACTS_PER_DAY || 12),
    },
  };
}
