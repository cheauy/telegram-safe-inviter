import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');

function getBaseDataDir() {
  return process.env.TELEGRAM_DATA_DIR || DEFAULT_DATA_DIR;
}

function getStateFile(userId = null) {
  if (userId) {
    const safeId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '');
    if (safeId) return path.join(getBaseDataDir(), 'states', `${safeId}.json`);
  }
  return process.env.TELEGRAM_STATE_FILE || path.join(getBaseDataDir(), 'safety-state.json');
}

const DEFAULTS = {
  circuitBrokenUntil: 0,
  circuitReason: null,
  floodWaitUntil: 0,
  nextAllowedActionAt: 0,
  inviteTimestamps: [],
  contactImportTimestamps: [],
  accountSafety: {},
  lastUsedAccountId: null,
  lastUpdateId: 0,
  pollingEnabled: false,
  savedGroups: [],
  memberships: [],
  pendingLinkPolicies: {},
  bulkQueue: {
    running: false,
    chatId: '',
    fallbackInviteLink: '',
    vipDays: 0,
    autoRemove: false,
    pausedReason: '',
    lastRunAt: null,
    items: [],
  },
  history: [],
};

export function inferOutcome(entry) {
  if (entry.outcome) return entry.outcome;
  const s = String(entry.status || '').toUpperCase();
  if (s === 'CUSTOMER_LEFT' || s === 'REMOVED' || s === 'REMOVED_EXPIRED' || s === 'LEFT' || s === 'KICKED') return 'left';
  if (
    s === 'DIRECT_INVITED' ||
    s === 'AUTO_APPROVED' ||
    s === 'JOINED' ||
    s === 'ALREADY_IN_GROUP' ||
    s === 'SENT_LINK_FALLBACK' ||
    s === 'PRIVACY_RESTRICTED_SENT_LINK_DM'
  ) {
    return 'success';
  }
  if (s === 'LINK_CREATED') return 'link';
  if (
    s.includes('FAIL') ||
    s.includes('ERROR') ||
    s.includes('PRIVACY') ||
    s.includes('NOT_FOUND') ||
    s.includes('FLOOD') ||
    s.includes('CAP_REACHED')
  ) {
    return 'failed';
  }
  return 'link';
}

export function loadState(userId = null) {
  try {
    const file = getStateFile(userId);
    if (!fs.existsSync(file)) return structuredClone(DEFAULTS);
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    return {
      ...structuredClone(DEFAULTS),
      ...raw,
      accountSafety: raw.accountSafety && typeof raw.accountSafety === 'object' && !Array.isArray(raw.accountSafety)
        ? raw.accountSafety
        : {},
      savedGroups: Array.isArray(raw.savedGroups) ? raw.savedGroups : [],
      memberships: Array.isArray(raw.memberships) ? raw.memberships : [],
      pendingLinkPolicies: raw.pendingLinkPolicies && typeof raw.pendingLinkPolicies === 'object' && !Array.isArray(raw.pendingLinkPolicies)
        ? raw.pendingLinkPolicies
        : {},
      history: Array.isArray(raw.history) ? raw.history : [],
      bulkQueue: {
        ...structuredClone(DEFAULTS.bulkQueue),
        ...(raw.bulkQueue || {}),
        items: Array.isArray(raw.bulkQueue?.items) ? raw.bulkQueue.items : [],
      },
    };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

export function saveState(state, userId = null) {
  const file = getStateFile(userId);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const pruned = pruneTimers(state);
  fs.writeFileSync(file, JSON.stringify(pruned, null, 2));
  return pruned;
}

export function pruneTimers(state, now = Date.now()) {
  const dayAgo = now - 86400_000;
  const prunedAccountSafety = {};
  if (state.accountSafety && typeof state.accountSafety === 'object') {
    for (const [accId, bucket] of Object.entries(state.accountSafety)) {
      if (!bucket || typeof bucket !== 'object') continue;
      prunedAccountSafety[accId] = {
        circuitBrokenUntil: Number(bucket.circuitBrokenUntil || 0),
        circuitReason: bucket.circuitReason || null,
        floodWaitUntil: Number(bucket.floodWaitUntil || 0),
        nextAllowedActionAt: Number(bucket.nextAllowedActionAt || 0),
        inviteTimestamps: (Array.isArray(bucket.inviteTimestamps) ? bucket.inviteTimestamps : []).filter(ts => ts > dayAgo),
        contactImportTimestamps: (Array.isArray(bucket.contactImportTimestamps) ? bucket.contactImportTimestamps : []).filter(ts => ts > dayAgo),
      };
    }
  }
  return {
    ...state,
    inviteTimestamps: (state.inviteTimestamps || []).filter(ts => ts > dayAgo),
    contactImportTimestamps: (state.contactImportTimestamps || []).filter(ts => ts > dayAgo),
    accountSafety: prunedAccountSafety,
    memberships: (Array.isArray(state.memberships) ? state.memberships : []).slice(0, 1000),
    savedGroups: (Array.isArray(state.savedGroups) ? state.savedGroups : []).slice(0, 100),
    history: (state.history || []).slice(0, 500),
  };
}

export function getSafetyLimits(env = process.env) {
  return {
    maxInvitesPerHour: Number(env.MTPROTO_MAX_INVITES_PER_HOUR || 4),
    maxInvitesPerDay: Number(env.MTPROTO_MAX_INVITES_PER_DAY || 15),
    maxContactsPerDay: Number(env.MTPROTO_MAX_CONTACTS_PER_DAY || 12),
    minDelayMs: Number(env.MTPROTO_MIN_DELAY_MS || 60_000),
    maxDelayMs: Number(env.MTPROTO_MAX_DELAY_MS || 150_000),
  };
}

export function evaluateInviteSafety(state, { addContact = false, now = Date.now(), limits = getSafetyLimits() } = {}) {
  const clean = pruneTimers(state, now);
  const hourAgo = now - 3600_000;
  const invitesLastHour = clean.inviteTimestamps.filter(ts => ts > hourAgo).length;
  const invitesLastDay = clean.inviteTimestamps.length;
  const contactsLastDay = clean.contactImportTimestamps.length;

  if (clean.circuitBrokenUntil > now) {
    const minutesLeft = Math.ceil((clean.circuitBrokenUntil - now) / 60_000);
    return {
      allowed: false,
      code: 'CIRCUIT_BREAKER_ACTIVE',
      message: `Safety circuit breaker active (${clean.circuitReason || 'PEER_FLOOD'}). Paused for ${minutesLeft} more minutes to protect account.`,
      stats: { invitesLastHour, invitesLastDay, contactsLastDay, limits },
    };
  }

  if (clean.floodWaitUntil > now) {
    const secondsLeft = Math.ceil((clean.floodWaitUntil - now) / 1000);
    return {
      allowed: false,
      code: 'FLOOD_WAIT_ACTIVE',
      message: `Telegram FLOOD_WAIT active. Wait ${secondsLeft}s before next request.`,
      stats: { invitesLastHour, invitesLastDay, contactsLastDay, limits },
    };
  }

  if (clean.nextAllowedActionAt > now) {
    const secondsLeft = Math.ceil((clean.nextAllowedActionAt - now) / 1000);
    return {
      allowed: false,
      code: 'JITTER_COOLDOWN',
      message: `Human jitter spacing active. Wait ${secondsLeft}s before next invite.`,
      stats: { invitesLastHour, invitesLastDay, contactsLastDay, limits },
    };
  }

  if (invitesLastHour >= limits.maxInvitesPerHour) {
    return {
      allowed: false,
      code: 'HOURLY_CAP_REACHED',
      message: `Hourly safe limit reached (${invitesLastHour}/${limits.maxInvitesPerHour}). Use Option 1 (Bot Invite Link) or wait <1 hour.`,
      stats: { invitesLastHour, invitesLastDay, contactsLastDay, limits },
    };
  }

  if (invitesLastDay >= limits.maxInvitesPerDay) {
    return {
      allowed: false,
      code: 'DAILY_CAP_REACHED',
      message: `Daily safe limit reached (${invitesLastDay}/${limits.maxInvitesPerDay}). Use Option 1 (Bot Invite Link) for unlimited invites.`,
      stats: { invitesLastHour, invitesLastDay, contactsLastDay, limits },
    };
  }

  if (addContact && contactsLastDay >= limits.maxContactsPerDay) {
    return {
      allowed: false,
      code: 'CONTACT_DAILY_CAP_REACHED',
      message: `Daily contact-import limit reached (${contactsLastDay}/${limits.maxContactsPerDay}). Invite by @username or use Option 1.`,
      stats: { invitesLastHour, invitesLastDay, contactsLastDay, limits },
    };
  }

  return {
    allowed: true,
    code: 'OK',
    message: 'Safe to proceed.',
    stats: { invitesLastHour, invitesLastDay, contactsLastDay, limits },
  };
}

export function getAccountSafetyBucket(state, accountId = 'primary', { inheritRootIfMissing = false } = {}) {
  const existing = state?.accountSafety?.[accountId];
  if (existing && typeof existing === 'object') {
    return {
      circuitBrokenUntil: Number(existing.circuitBrokenUntil || 0),
      circuitReason: existing.circuitReason || null,
      floodWaitUntil: Number(existing.floodWaitUntil || 0),
      nextAllowedActionAt: Number(existing.nextAllowedActionAt || 0),
      inviteTimestamps: Array.isArray(existing.inviteTimestamps) ? [...existing.inviteTimestamps] : [],
      contactImportTimestamps: Array.isArray(existing.contactImportTimestamps) ? [...existing.contactImportTimestamps] : [],
    };
  }
  if (inheritRootIfMissing) {
    return {
      circuitBrokenUntil: Number(state?.circuitBrokenUntil || 0),
      circuitReason: state?.circuitReason || null,
      floodWaitUntil: Number(state?.floodWaitUntil || 0),
      nextAllowedActionAt: Number(state?.nextAllowedActionAt || 0),
      inviteTimestamps: Array.isArray(state?.inviteTimestamps) ? [...state.inviteTimestamps] : [],
      contactImportTimestamps: Array.isArray(state?.contactImportTimestamps) ? [...state.contactImportTimestamps] : [],
    };
  }
  return {
    circuitBrokenUntil: 0,
    circuitReason: null,
    floodWaitUntil: 0,
    nextAllowedActionAt: 0,
    inviteTimestamps: [],
    contactImportTimestamps: [],
  };
}

const BLOCK_PRIORITY = {
  JITTER_COOLDOWN: 1,
  FLOOD_WAIT_ACTIVE: 2,
  HOURLY_CAP_REACHED: 3,
  CONTACT_DAILY_CAP_REACHED: 4,
  DAILY_CAP_REACHED: 5,
  CIRCUIT_BREAKER_ACTIVE: 6,
};

export function pickAvailablePoolAccount(
  state,
  accounts = [],
  { addContact = false, now = Date.now(), limits = getSafetyLimits() } = {}
) {
  const clean = pruneTimers(state, now);
  if (!Array.isArray(accounts) || accounts.length === 0) {
    const single = evaluateInviteSafety(clean, { addContact, now, limits });
    return {
      account: single.allowed ? null : null,
      safety: single,
      perAccount: [],
    };
  }

  const hasSavedBuckets = Object.keys(clean.accountSafety || {}).length > 0;
  const perAccount = accounts.map((acc, idx) => {
    const inheritRoot = accounts.length <= 1 || (!hasSavedBuckets && idx === 0) || (acc.id === 'primary' && !clean.accountSafety?.[acc.id]);
    const bucket = getAccountSafetyBucket(clean, acc.id, { inheritRootIfMissing: inheritRoot });
    const safety = evaluateInviteSafety(bucket, { addContact, now, limits });
    return {
      account: acc,
      bucket,
      safety,
    };
  });

  const lastIdx = clean.lastUsedAccountId
    ? accounts.findIndex(a => a.id === clean.lastUsedAccountId)
    : -1;
  const startIdx = lastIdx >= 0 ? (lastIdx + 1) % accounts.length : 0;

  let chosen = null;
  for (let offset = 0; offset < accounts.length; offset++) {
    const candidate = perAccount[(startIdx + offset) % accounts.length];
    if (candidate.safety.allowed) {
      chosen = candidate;
      break;
    }
  }

  if (chosen) {
    return {
      account: chosen.account,
      safety: chosen.safety,
      perAccount,
    };
  }

  // Pick the least severe / shortest temporary block across the pool
  const sortedBlocked = [...perAccount].sort((a, b) => {
    const pa = BLOCK_PRIORITY[a.safety.code] || 99;
    const pb = BLOCK_PRIORITY[b.safety.code] || 99;
    if (pa !== pb) return pa - pb;
    const waitA = Math.max(a.bucket.nextAllowedActionAt || 0, a.bucket.floodWaitUntil || 0);
    const waitB = Math.max(b.bucket.nextAllowedActionAt || 0, b.bucket.floodWaitUntil || 0);
    return waitA - waitB;
  });
  const topBlocked = sortedBlocked[0].safety;
  const message = accounts.length > 1
    ? `All ${accounts.length} pool accounts paused: ${topBlocked.message}`
    : topBlocked.message;

  return {
    account: null,
    safety: { ...topBlocked, message },
    perAccount,
  };
}

export function evaluatePoolSafety(
  state,
  accounts = [],
  { addContact = false, now = Date.now(), limits = getSafetyLimits() } = {}
) {
  if (!Array.isArray(accounts) || accounts.length === 0) {
    const single = evaluateInviteSafety(state, { addContact, now, limits });
    return {
      ...single,
      poolSize: 0,
      activeAccountId: null,
      activeAccountLabel: null,
      accountSafetyStats: [],
    };
  }

  const picked = pickAvailablePoolAccount(state, accounts, { addContact, now, limits });
  const totalHour = picked.perAccount.reduce((sum, x) => sum + x.safety.stats.invitesLastHour, 0);
  const totalDay = picked.perAccount.reduce((sum, x) => sum + x.safety.stats.invitesLastDay, 0);
  const totalContacts = picked.perAccount.reduce((sum, x) => sum + x.safety.stats.contactsLastDay, 0);
  const count = accounts.length;

  const accountSafetyStats = picked.perAccount.map(x => ({
    id: x.account.id,
    label: x.account.label || x.account.firstName || x.account.phone || x.account.id,
    phone: x.account.phone || '',
    username: x.account.username || null,
    allowed: x.safety.allowed,
    code: x.safety.code,
    message: x.safety.message,
    stats: x.safety.stats,
    nextAllowedActionAt: x.bucket.nextAllowedActionAt || 0,
    floodWaitUntil: x.bucket.floodWaitUntil || 0,
    circuitBrokenUntil: x.bucket.circuitBrokenUntil || 0,
  }));

  if (count === 1) {
    return {
      ...picked.perAccount[0].safety,
      poolSize: 1,
      activeAccountId: accounts[0].id,
      activeAccountLabel: accountSafetyStats[0].label,
      accountSafetyStats,
    };
  }

  return {
    allowed: Boolean(picked.account),
    code: picked.safety.code,
    message: picked.account
      ? `Pool ready (${count} accounts) — Next rotation: ${picked.account.label || picked.account.phone || picked.account.id}`
      : picked.safety.message,
    stats: {
      invitesLastHour: totalHour,
      invitesLastDay: totalDay,
      contactsLastDay: totalContacts,
      limits: {
        maxInvitesPerHour: limits.maxInvitesPerHour * count,
        maxInvitesPerDay: limits.maxInvitesPerDay * count,
        maxContactsPerDay: limits.maxContactsPerDay * count,
        perAccount: limits,
      },
    },
    poolSize: count,
    activeAccountId: picked.account?.id || null,
    activeAccountLabel: picked.account ? (picked.account.label || picked.account.phone || picked.account.id) : null,
    accountSafetyStats,
  };
}

export function recordAction(
  state,
  entry,
  { now = Date.now(), limits = getSafetyLimits(), userId = null, accountId = null, poolSize = 1 } = {}
) {
  const clean = pruneTimers(state, now);
  if (entry.updateId && clean.history.some(item => item.updateId === entry.updateId)) {
    return clean;
  }

  const jitter = Math.floor(limits.minDelayMs + Math.random() * Math.max(1000, limits.maxDelayMs - limits.minDelayMs));
  const updateRoot = !accountId || poolSize <= 1;
  const isCountedInvite = entry.countedInvite ?? (entry.status === 'DIRECT_INVITED' || entry.status === 'INVITED');
  const isCountedContact = entry.countedContact ?? (entry.status === 'CONTACT_ADDED');
  const circuitHours = entry.circuitBreakHours || (entry.status === 'CIRCUIT_BREAK_24H' ? 24 : 0);

  if (updateRoot) {
    if (isCountedInvite) clean.inviteTimestamps.push(now);
    if (isCountedContact) clean.contactImportTimestamps.push(now);
    if (isCountedInvite || isCountedContact) {
      clean.nextAllowedActionAt = now + jitter;
    }
    if (entry.floodWaitSeconds) {
      clean.floodWaitUntil = now + Math.ceil(entry.floodWaitSeconds * 1.2) * 1000;
    }
    if (circuitHours) {
      clean.circuitBrokenUntil = now + circuitHours * 3600_000;
      clean.circuitReason = entry.circuitReason || 'PEER_FLOOD';
    }
  }

  if (accountId) {
    const bucket = getAccountSafetyBucket(clean, accountId, {
      inheritRootIfMissing: !clean.accountSafety?.[accountId] && poolSize <= 1,
    });
    if (isCountedInvite) bucket.inviteTimestamps.push(now);
    if (isCountedContact) bucket.contactImportTimestamps.push(now);
    if (isCountedInvite || isCountedContact) {
      bucket.nextAllowedActionAt = now + jitter;
    }
    if (entry.floodWaitSeconds) {
      bucket.floodWaitUntil = now + Math.ceil(entry.floodWaitSeconds * 1.2) * 1000;
    }
    if (circuitHours) {
      bucket.circuitBrokenUntil = now + circuitHours * 3600_000;
      bucket.circuitReason = entry.circuitReason || 'PEER_FLOOD';
    }
    clean.accountSafety = { ...(clean.accountSafety || {}), [accountId]: bucket };
    clean.lastUsedAccountId = accountId;
  }

  const normalized = {
    id: `${now}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date(now).toISOString(),
    ...entry,
    ...(accountId ? { accountId } : {}),
    outcome: inferOutcome(entry),
  };

  clean.history.unshift(normalized);
  return saveState(clean, userId);
}

export function getDashboardSummary(state) {
  const history = state.history || [];
  let success = 0;
  let failed = 0;
  let left = 0;
  let links = 0;
  for (const item of history) {
    const out = inferOutcome(item);
    if (out === 'success') success++;
    else if (out === 'failed') failed++;
    else if (out === 'left') left++;
    else if (out === 'link') links++;
  }
  return { success, failed, left, links, total: history.length };
}
