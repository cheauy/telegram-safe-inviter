import { removeExpiredGroupMember } from './option1BotInvite.js';
import { getSafetyLimits, loadState, recordAction, saveState } from './safetyState.js';

export function upsertSavedGroup(state, chatInfo, { userId = null, inputRef = '' } = {}) {
  if (!chatInfo || !chatInfo.id) {
    throw new Error('Group ID or @username could not be resolved.');
  }
  const id = String(chatInfo.id).trim();
  const cleanUsername = chatInfo.username ? String(chatInfo.username).replace(/^@/, '').trim() : null;
  const groups = Array.isArray(state.savedGroups) ? [...state.savedGroups] : [];

  const idx = groups.findIndex(
    g =>
      String(g.id) === id ||
      (cleanUsername && g.username && g.username.toLowerCase() === cleanUsername.toLowerCase()) ||
      (inputRef && g.inputRef && g.inputRef.toLowerCase() === String(inputRef).trim().toLowerCase())
  );

  const prev = idx >= 0 ? groups[idx] : {};
  const record = {
    id,
    inputRef: String(inputRef || prev.inputRef || (cleanUsername ? `@${cleanUsername}` : id)).trim(),
    title: chatInfo.title || prev.title || (cleanUsername ? `@${cleanUsername}` : id),
    username: cleanUsername || prev.username || null,
    type: chatInfo.type || prev.type || 'supergroup',
    description: chatInfo.description !== undefined ? chatInfo.description : (prev.description || ''),
    memberCount: chatInfo.memberCount !== undefined ? chatInfo.memberCount : (prev.memberCount ?? null),
    photoDataUrl: chatInfo.photoDataUrl !== undefined ? chatInfo.photoDataUrl : (prev.photoDataUrl || null),
    isAdmin: chatInfo.isAdmin !== undefined ? Boolean(chatInfo.isAdmin) : Boolean(prev.isAdmin),
    canInvite: chatInfo.canInvite !== undefined ? Boolean(chatInfo.canInvite) : Boolean(prev.canInvite),
    botStatus: chatInfo.botStatus || prev.botStatus || 'unknown',
    updatedAt: new Date().toISOString(),
  };

  if (idx >= 0) groups[idx] = record;
  else groups.unshift(record);

  state.savedGroups = groups.slice(0, 50);
  const saved = saveState(state, userId);
  return { group: record, savedGroups: saved.savedGroups };
}

export function removeSavedGroup(state, chatId, { userId = null } = {}) {
  const target = String(chatId || '').trim().toLowerCase();
  const groups = Array.isArray(state.savedGroups) ? state.savedGroups : [];
  state.savedGroups = groups.filter(g => {
    const gid = String(g.id || '').toLowerCase();
    const gun = g.username ? `@${g.username.toLowerCase()}` : '';
    const gin = String(g.inputRef || '').toLowerCase();
    return gid !== target && gun !== target && gin !== target;
  });
  return saveState(state, userId).savedGroups;
}

export function recordPendingLinkPolicy(
  state,
  { inviteLink, label = '', chatId = '', vipDays = 0, vipMinutes = 0, autoRemove = false, now = Date.now(), userId = null } = {}
) {
  const days = Math.max(0, Number(vipDays) || 0);
  const mins = Math.max(0, Number(vipMinutes) || 0);
  if (!inviteLink || (days <= 0 && mins <= 0)) return null;

  const policies = { ...(state.pendingLinkPolicies || {}) };
  policies[inviteLink] = {
    inviteLink,
    label: String(label || '').slice(0, 64),
    chatId: String(chatId || ''),
    vipDays: days,
    vipMinutes: mins,
    autoRemove: Boolean(autoRemove),
    createdAt: new Date(now).toISOString(),
  };

  const keys = Object.keys(policies);
  if (keys.length > 300) {
    for (const k of keys.slice(0, keys.length - 300)) delete policies[k];
  }

  state.pendingLinkPolicies = policies;
  saveState(state, userId);
  return policies[inviteLink];
}

export function upsertVipMembership(
  state,
  {
    telegramUserId = '',
    name = 'Customer',
    username = '',
    phone = '',
    chatId = '',
    chatTitle = '',
    source = 'OPTION_1_BOT_LINK',
    inviteLink = '',
    inviteName = '',
    vipDays = 0,
    vipMinutes = 0,
    autoRemove = false,
    now = Date.now(),
    userId = null,
  } = {}
) {
  const days = Math.max(0, Number(vipDays) || 0);
  const mins = Math.max(0, Number(vipMinutes) || 0);
  const durationMs = mins > 0 ? mins * 60_000 : days * 86400_000;
  if (durationMs <= 0) return null;

  const list = Array.isArray(state.memberships) ? [...state.memberships] : [];
  const cleanUid = telegramUserId ? String(telegramUserId).trim() : '';
  const cleanUser = username ? String(username).replace(/^@/, '').trim().toLowerCase() : '';
  const cleanPhone = String(phone || '').trim();
  const cleanChat = String(chatId || '').trim();

  const matchIdx = list.findIndex(m => {
    const sameChat = !cleanChat || !m.chatId || String(m.chatId) === cleanChat;
    if (!sameChat) return false;
    if (cleanUid && m.telegramUserId && String(m.telegramUserId) === cleanUid) return true;
    if (cleanUser && m.username && m.username.toLowerCase() === cleanUser) return true;
    if (cleanPhone && m.phone && m.phone === cleanPhone) return true;
    return false;
  });

  const existing = matchIdx >= 0 ? list[matchIdx] : null;
  const expiresAt = new Date(now + durationMs).toISOString();
  const record = {
    id: existing?.id || `vip_${now.toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    telegramUserId: cleanUid || existing?.telegramUserId || '',
    name: String(name || existing?.name || 'Customer').slice(0, 64),
    username: cleanUser || existing?.username || '',
    phone: cleanPhone || existing?.phone || '',
    chatId: cleanChat || existing?.chatId || '',
    chatTitle: chatTitle || existing?.chatTitle || cleanChat,
    source: source || existing?.source || 'OPTION_1_BOT_LINK',
    inviteLink: inviteLink || existing?.inviteLink || '',
    inviteName: inviteName || existing?.inviteName || '',
    vipDays: days || existing?.vipDays || 0,
    vipMinutes: mins || existing?.vipMinutes || 0,
    autoRemove: Boolean(autoRemove),
    joinedAt: existing?.joinedAt || new Date(now).toISOString(),
    expiresAt,
    status: 'active',
    removedAt: null,
    lastError: '',
  };

  if (matchIdx >= 0) list[matchIdx] = record;
  else list.unshift(record);

  state.memberships = list.slice(0, 1000);
  saveState(state, userId);
  return record;
}

export function activateMembershipFromEvent(state, eventResult, { now = Date.now(), userId = null } = {}) {
  if (!eventResult) return null;
  if (eventResult.outcome && eventResult.outcome !== 'success') return null;
  const policies = state.pendingLinkPolicies || {};
  let policy = eventResult.inviteLink ? policies[eventResult.inviteLink] : null;
  if (!policy && eventResult.inviteName) {
    policy = Object.values(policies).find(p => p.label && p.label === eventResult.inviteName) || null;
  }
  if (!policy) return null;

  return upsertVipMembership(state, {
    telegramUserId: eventResult.approvedUserId || eventResult.telegramUserId || eventResult.userId || '',
    name: eventResult.name || eventResult.firstName || policy.label || 'Customer',
    username: eventResult.username || '',
    chatId: eventResult.chatId || policy.chatId,
    chatTitle: eventResult.chatTitle || policy.chatId,
    source: 'OPTION_1_BOT_LINK',
    inviteLink: eventResult.inviteLink || policy.inviteLink,
    inviteName: eventResult.inviteName || policy.label,
    vipDays: policy.vipDays,
    vipMinutes: policy.vipMinutes,
    autoRemove: policy.autoRemove,
    now,
    userId,
  });
}

export function markMembershipLeft(
  state,
  { telegramUserId = '', chatId = '', username = '', status = 'CUSTOMER_LEFT', now = Date.now(), userId = null } = {}
) {
  const list = Array.isArray(state.memberships) ? state.memberships : [];
  if (!list.length) return false;
  const cleanUid = telegramUserId ? String(telegramUserId).trim() : '';
  const cleanUser = username ? String(username).replace(/^@/, '').trim().toLowerCase() : '';
  const cleanChat = String(chatId || '').trim();
  let changed = false;

  for (const m of list) {
    if (m.status === 'removed' || m.status === 'left') continue;
    const sameChat = !cleanChat || !m.chatId || String(m.chatId) === cleanChat;
    if (!sameChat) continue;
    if ((cleanUid && String(m.telegramUserId) === cleanUid) || (cleanUser && m.username?.toLowerCase() === cleanUser)) {
      m.status = status === 'REMOVED_EXPIRED' ? 'removed' : 'left';
      m.removedAt = new Date(now).toISOString();
      changed = true;
    }
  }

  if (changed) saveState(state, userId);
  return changed;
}

export function renewMembership(
  state,
  { membershipId, addDays = 30, autoRemove, now = Date.now(), userId = null } = {}
) {
  const list = Array.isArray(state.memberships) ? state.memberships : [];
  const item = list.find(m => m.id === membershipId);
  if (!item) throw new Error('Membership record not found.');

  const days = Math.max(1, Number(addDays) || 30);
  const currentExp = item.expiresAt ? Date.parse(item.expiresAt) : 0;
  const baseMs = Number.isFinite(currentExp) && currentExp > now ? currentExp : now;

  item.expiresAt = new Date(baseMs + days * 86400_000).toISOString();
  item.vipDays = (Number(item.vipDays) || 0) + days;
  item.status = 'active';
  item.removedAt = null;
  item.lastError = '';
  if (autoRemove !== undefined) item.autoRemove = Boolean(autoRemove);

  saveState(state, userId);
  return item;
}

export async function processExpiredMemberships(
  userId,
  userEnv = process.env,
  { removeFn, now = Date.now(), forceIds = null } = {}
) {
  let latestState = loadState(userId);
  const list = Array.isArray(latestState.memberships) ? latestState.memberships : [];
  if (!list.length) return { checked: 0, expiredCount: 0, removedCount: 0, errors: [] };

  const removeMember = removeFn || removeExpiredGroupMember;
  const limits = getSafetyLimits(userEnv);
  const forcedSet = Array.isArray(forceIds) && forceIds.length > 0 ? new Set(forceIds) : null;

  let expiredCount = 0;
  let removedCount = 0;
  const errors = [];
  let stateDirty = false;

  for (const m of list) {
    if (m.status === 'removed' || m.status === 'left') continue;
    const expMs = Date.parse(m.expiresAt || '');
    const isDue = forcedSet ? forcedSet.has(m.id) : (Number.isFinite(expMs) && expMs <= now);
    if (!isDue) continue;

    expiredCount++;
    const shouldKick = forcedSet ? forcedSet.has(m.id) : Boolean(m.autoRemove);
    if (!shouldKick) {
      if (m.status !== 'expired') {
        m.status = 'expired';
        stateDirty = true;
      }
      continue;
    }

    const targetChatId = m.chatId || userEnv.TELEGRAM_CHAT_ID || '';
    if (!m.telegramUserId) {
      m.status = 'expired';
      m.lastError = 'Telegram user ID unavailable for auto-remove (member joined outside bot tracking).';
      stateDirty = true;
      errors.push({ id: m.id, error: m.lastError });
      continue;
    }
    if (!targetChatId) {
      m.status = 'expired';
      m.lastError = 'No target group ID set for expired member removal.';
      stateDirty = true;
      errors.push({ id: m.id, error: m.lastError });
      continue;
    }
    if (!removeFn && !userEnv.TELEGRAM_BOT_TOKEN?.trim()) {
      m.status = 'expired';
      m.lastError = 'TELEGRAM_BOT_TOKEN is required to auto-remove expired members.';
      stateDirty = true;
      errors.push({ id: m.id, error: m.lastError });
      continue;
    }

    try {
      await removeMember({
        botToken: userEnv.TELEGRAM_BOT_TOKEN,
        chatId: targetChatId,
        userId: m.telegramUserId,
      });
      m.status = 'removed';
      m.removedAt = new Date(now).toISOString();
      m.lastError = '';
      removedCount++;
      stateDirty = true;

      latestState.memberships = list;
      latestState = recordAction(
        latestState,
        {
          option: 'OPTION_1_BOT_LINK',
          outcome: 'left',
          status: 'REMOVED_EXPIRED',
          target: m.username ? `@${m.username}` : (m.phone || m.name || String(m.telegramUserId)),
          name: m.name || 'Customer',
          username: m.username || null,
          phone: m.phone || null,
          userId: m.telegramUserId,
          chatTitle: m.chatTitle || targetChatId,
          reason: `VIP/Paid expiry (${m.vipDays ? `${m.vipDays}d` : `${m.vipMinutes || 0}m`}) reached — auto-removed`,
        },
        { limits, userId, now }
      );
    } catch (err) {
      m.status = 'expired';
      m.lastError = err.message || 'Auto-remove failed';
      stateDirty = true;
      errors.push({ id: m.id, error: m.lastError });
    }
  }

  if (stateDirty) {
    latestState.memberships = list;
    saveState(latestState, userId);
  }

  return {
    checked: list.length,
    expiredCount,
    removedCount,
    removed: removedCount,
    expired: expiredCount,
    errors,
  };
}
