import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  authenticateUser,
  clearSessionCookieHeader,
  createSessionToken,
  createUser,
  findUserById,
  getRequestUser,
  listUsers,
  loadUserEnv,
  loadUserMtprotoAccounts,
  removeUserMtprotoAccount,
  saveUserEnv,
  sessionCookieHeader,
  upsertUserMtprotoAccount,
} from './authStore.js';
import {
  clearBotWebhook,
  createBotSafeInviteLink,
  fetchBotUpdates,
  handleTelegramUpdate,
  inspectBotIntegration,
  setupBotWebhook,
} from './option1BotInvite.js';
import {
  completeMtprotoLogin,
  inspectMtprotoPool,
  resetMtprotoClient,
  safeMtprotoContactAndInvite,
  startMtprotoLogin,
} from './option2MtprotoInvite.js';
import {
  evaluatePoolSafety,
  getDashboardSummary,
  getSafetyLimits,
  loadState,
  recordAction,
  saveState,
} from './safetyState.js';
import { getMaskedConfig } from './envStore.js';
import { controlBulkQueue, enqueueBulkCustomers, processBulkQueueStep } from './bulkQueue.js';
import { buildCsvExport, buildExcelExport, filterActivityRows } from './exportUtils.js';
import {
  activateMembershipFromEvent,
  markMembershipLeft,
  processExpiredMemberships,
  recordPendingLinkPolicy,
  removeSavedGroup,
  renewMembership,
  upsertSavedGroup,
  upsertVipMembership,
} from './membershipManager.js';
import { UI_HTML } from './ui.js';

const PORT = Number(process.env.PORT || 3040);
const PUBLIC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const STATIC_ASSETS = new Map([
  ['/logo.png', { file: 'logo.png', type: 'image/png' }],
  ['/icon-192.png', { file: 'icon-192.png', type: 'image/png' }],
  ['/icon-512.png', { file: 'icon-512.png', type: 'image/png' }],
  ['/apple-touch-icon.png', { file: 'apple-touch-icon.png', type: 'image/png' }],
  ['/favicon-32.png', { file: 'favicon-32.png', type: 'image/png' }],
  ['/favicon.ico', { file: 'favicon.ico', type: 'image/x-icon' }],
  ['/manifest.webmanifest', { file: 'manifest.webmanifest', type: 'application/manifest+json; charset=utf-8' }],
]);

const cachedChatTitles = new Map();
const syncBusyUsers = new Set();
const bulkBusyUsers = new Set();
const expiryBusyUsers = new Set();
const lastExpirySweepAt = new Map();

async function runBulkStepLocked(userId, env, opts = {}) {
  if (!userId || bulkBusyUsers.has(userId)) return { processed: false, reason: 'BUSY' };
  bulkBusyUsers.add(userId);
  try {
    const accounts = opts.accounts !== undefined ? opts.accounts : loadUserMtprotoAccounts(userId);
    return await processBulkQueueStep(userId, env, { ...opts, accounts });
  } finally {
    bulkBusyUsers.delete(userId);
  }
}

async function runExpirySweepLocked(userId, env, opts = {}) {
  if (!userId || expiryBusyUsers.has(userId)) return { checked: 0, expiredCount: 0, removedCount: 0, skipped: true };
  expiryBusyUsers.add(userId);
  try {
    return await processExpiredMemberships(userId, env, opts);
  } finally {
    expiryBusyUsers.delete(userId);
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1_000_000) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, payload, extraHeaders = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders });
  res.end(JSON.stringify(payload));
}

async function applyTelegramEvent(update, { source = 'OPTION_1_WEBHOOK', userId = null, env = process.env } = {}) {
  const result = await handleTelegramUpdate(update, {
    botToken: env.TELEGRAM_BOT_TOKEN,
    welcomeTemplate: env.TELEGRAM_WELCOME_TEXT || 'Welcome {name}! Your request to join has been approved.',
  });
  if (!result.handled) return result;

  const target = result.username
    ? `${result.firstName} (@${result.username})`
    : `${result.firstName} (${result.approvedUserId || result.userId})`;

  if (result.chatTitle && userId) cachedChatTitles.set(userId, result.chatTitle);

  recordAction(
    loadState(userId),
    {
      updateId: update.update_id || undefined,
      option: source,
      outcome: result.outcome,
      status: result.status,
      target,
      name: result.firstName,
      username: result.username,
      userId: result.approvedUserId || result.userId,
      chatTitle: result.chatTitle,
      inviteName: result.inviteName,
      inviteLink: result.inviteLink,
      reason: result.reason,
    },
    { limits: getSafetyLimits(env), userId }
  );

  if (result.outcome === 'success') {
    activateMembershipFromEvent(loadState(userId), result, { userId });
  } else if (result.outcome === 'left') {
    markMembershipLeft(loadState(userId), {
      telegramUserId: result.userId,
      chatId: result.chatId,
      username: result.username,
      status: result.status,
      userId,
    });
  }

  return result;
}

export async function syncBotUpdatesOnce(userId, env = loadUserEnv(userId)) {
  if (!userId) throw new Error('User ID is required.');
  if (syncBusyUsers.has(userId)) return { processed: 0, skipped: true };
  if (!env.TELEGRAM_BOT_TOKEN?.trim()) {
    throw new Error('Set TELEGRAM_BOT_TOKEN in Integrate Telegram first.');
  }
  syncBusyUsers.add(userId);
  try {
    const state = loadState(userId);
    const updates = await fetchBotUpdates({
      botToken: env.TELEGRAM_BOT_TOKEN,
      offset: state.lastUpdateId ? state.lastUpdateId + 1 : 0,
      timeout: 0,
    });
    let processed = 0;
    let maxId = state.lastUpdateId || 0;

    for (const upd of updates) {
      if (upd.update_id > maxId) maxId = upd.update_id;
      const res = await applyTelegramEvent(upd, { source: 'OPTION_1_POLL', userId, env });
      if (res.handled) processed++;
    }

    if (maxId > (state.lastUpdateId || 0)) {
      const latest = loadState(userId);
      latest.lastUpdateId = maxId;
      saveState(latest, userId);
    }

    return { processed, totalUpdates: updates.length };
  } finally {
    syncBusyUsers.delete(userId);
  }
}

export function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

      if (req.method === 'GET' && url.pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(UI_HTML);
      }

      if (req.method === 'GET' && STATIC_ASSETS.has(url.pathname)) {
        const asset = STATIC_ASSETS.get(url.pathname);
        const filePath = path.join(PUBLIC_DIR, asset.file);
        if (fs.existsSync(filePath)) {
          res.writeHead(200, {
            'Content-Type': asset.type,
            'Cache-Control': 'public, max-age=3600',
          });
          return res.end(fs.readFileSync(filePath));
        }
      }

      // ============ AUTH ENDPOINTS ============
      if (req.method === 'GET' && url.pathname === '/api/auth/me') {
        const user = getRequestUser(req);
        return sendJson(res, 200, { authenticated: Boolean(user), user: user || null });
      }

      if (req.method === 'POST' && url.pathname === '/api/auth/signup') {
        const body = await readJson(req);
        const user = createUser({
          name: body.name,
          email: body.email,
          password: body.password,
        });
        const token = createSessionToken(user.id);
        return sendJson(
          res,
          201,
          { ok: true, user },
          { 'Set-Cookie': sessionCookieHeader(token) }
        );
      }

      if (req.method === 'POST' && url.pathname === '/api/auth/login') {
        const body = await readJson(req);
        const user = authenticateUser({
          email: body.email,
          password: body.password,
        });
        const token = createSessionToken(user.id);
        return sendJson(
          res,
          200,
          { ok: true, user },
          { 'Set-Cookie': sessionCookieHeader(token) }
        );
      }

      if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
        return sendJson(
          res,
          200,
          { ok: true },
          { 'Set-Cookie': clearSessionCookieHeader() }
        );
      }

      // Webhook endpoint called by Telegram (accepts optional ?u=<userId>)
      if (req.method === 'POST' && url.pathname === '/api/option1/webhook') {
        const update = await readJson(req);
        const queryUserId = url.searchParams.get('u');
        const targetUser = (queryUserId && findUserById(queryUserId)) || listUsers()[0] || null;
        const targetUserId = targetUser?.id || null;
        const targetEnv = targetUserId ? loadUserEnv(targetUserId) : process.env;
        const result = await applyTelegramEvent(update, {
          source: 'OPTION_1_WEBHOOK',
          userId: targetUserId,
          env: targetEnv,
        });
        return sendJson(res, 200, result);
      }

      // ============ AUTHENTICATED WORKSPACE ROUTES ============
      const user = getRequestUser(req);
      if (!user) {
        return sendJson(res, 401, {
          error: 'Please sign in to access your saved Tenh Gram workspace.',
          code: 'UNAUTHORIZED',
        });
      }

      const userEnv = loadUserEnv(user.id);
      const limits = getSafetyLimits(userEnv);
      const mtAccounts = loadUserMtprotoAccounts(user.id);

      if (req.method === 'GET' && url.pathname === '/api/status') {
        const state = loadState(user.id);
        const poolSafety = evaluatePoolSafety(state, mtAccounts, { limits });
        return sendJson(res, 200, {
          user,
          safety: poolSafety,
          poolSummary: {
            size: poolSafety.poolSize,
            activeAccountId: poolSafety.activeAccountId,
            activeAccountLabel: poolSafety.activeAccountLabel,
          },
          accountSafetyStats: poolSafety.accountSafetyStats || [],
          summary: getDashboardSummary(state),
          history: state.history || [],
          bulkQueue: state.bulkQueue,
          savedGroups: state.savedGroups || [],
          memberships: state.memberships || [],
          config: getMaskedConfig(userEnv, mtAccounts),
          pollingEnabled: Boolean(state.pollingEnabled),
          chatTitle: cachedChatTitles.get(user.id) || '',
        });
      }

      if (req.method === 'GET' && url.pathname === '/api/status/export') {
        const state = loadState(user.id);
        const format = (url.searchParams.get('format') || 'csv').toLowerCase();
        const outcome = url.searchParams.get('outcome') || 'all';
        const method = url.searchParams.get('method') || 'all';
        const q = url.searchParams.get('q') || '';
        const rows = filterActivityRows(state.history || [], { outcome, method, q });
        const dateTag = new Date().toISOString().slice(0, 10);
        const safeOutcome = outcome.replace(/[^a-z0-9_-]/gi, '') || 'all';

        if (format === 'excel' || format === 'xls') {
          const xml = buildExcelExport(rows, `Tenh Gram ${safeOutcome}`);
          res.writeHead(200, {
            'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
            'Content-Disposition': `attachment; filename="tenh-gram-${safeOutcome}-${dateTag}.xls"`,
          });
          return res.end(xml);
        }

        const csv = buildCsvExport(rows);
        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="tenh-gram-${safeOutcome}-${dateTag}.csv"`,
        });
        return res.end(csv);
      }

      if (req.method === 'POST' && url.pathname === '/api/bulk/enqueue') {
        const body = await readJson(req);
        const state = loadState(user.id);
        const enqueued = enqueueBulkCustomers(state, {
          text: body.text || '',
          chatId: body.chatId !== undefined ? body.chatId : (state.bulkQueue?.chatId || userEnv.TELEGRAM_CHAT_ID),
          fallbackInviteLink: body.fallbackInviteLink !== undefined ? body.fallbackInviteLink : state.bulkQueue?.fallbackInviteLink,
          vipDays: body.vipDays,
          autoRemove: body.autoRemove,
          userId: user.id,
        });
        if (body.autoStart && enqueued.added > 0) {
          controlBulkQueue(loadState(user.id), { action: 'start', userId: user.id });
          runBulkStepLocked(user.id, userEnv, { accounts: mtAccounts }).catch(() => {});
        }
        return sendJson(res, 200, { ok: true, ...enqueued, queue: loadState(user.id).bulkQueue });
      }

      if (req.method === 'POST' && url.pathname === '/api/bulk/control') {
        const body = await readJson(req);
        const queue = controlBulkQueue(loadState(user.id), {
          action: body.action,
          itemId: body.itemId,
          fallbackInviteLink: body.fallbackInviteLink,
          chatId: body.chatId,
          vipDays: body.vipDays,
          autoRemove: body.autoRemove,
          userId: user.id,
        });
        if (body.action === 'start') {
          runBulkStepLocked(user.id, userEnv, { accounts: mtAccounts }).catch(() => {});
        }
        return sendJson(res, 200, { ok: true, queue });
      }

      if (req.method === 'POST' && url.pathname === '/api/bulk/step') {
        const stepResult = await runBulkStepLocked(user.id, userEnv, { forceWhenPaused: true, accounts: mtAccounts });
        const latest = loadState(user.id);
        return sendJson(res, 200, {
          ok: true,
          stepResult,
          safety: evaluatePoolSafety(latest, mtAccounts, { limits }),
          queue: latest.bulkQueue,
        });
      }

      if (req.method === 'POST' && url.pathname === '/api/option1/create-link') {
        const body = await readJson(req);
        const targetChatId = body.chatId || userEnv.TELEGRAM_CHAT_ID;
        const vipDays = Math.max(0, Number(body.vipDays) || 0);
        const vipMinutes = Math.max(0, Number(body.vipMinutes) || 0);
        const autoRemove = Boolean(body.autoRemove);
        try {
          const result = await createBotSafeInviteLink({
            botToken: userEnv.TELEGRAM_BOT_TOKEN,
            chatId: targetChatId,
            label: body.label,
            mode: body.mode,
            expireHours: body.expireHours,
          });
          if (vipDays > 0 || vipMinutes > 0) {
            recordPendingLinkPolicy(loadState(user.id), {
              inviteLink: result.inviteLink,
              label: result.name,
              chatId: targetChatId,
              vipDays,
              vipMinutes,
              autoRemove,
              userId: user.id,
            });
          }
          recordAction(
            loadState(user.id),
            {
              option: 'OPTION_1_BOT_LINK',
              outcome: 'link',
              target: result.name,
              name: result.name,
              status: 'LINK_CREATED',
              inviteLink: result.inviteLink,
              vipDays: vipDays || undefined,
              autoRemove: vipDays > 0 ? autoRemove : undefined,
            },
            { limits, userId: user.id }
          );
          return sendJson(res, 200, { ...result, vipDays, autoRemove });
        } catch (err) {
          recordAction(
            loadState(user.id),
            {
              option: 'OPTION_1_BOT_LINK',
              outcome: 'failed',
              target: body.label || 'Safe Invite Link',
              name: body.label || 'Safe Invite Link',
              status: 'BOT_LINK_FAILED',
              reason: err.message,
            },
            { limits, userId: user.id }
          );
          throw err;
        }
      }

      if (req.method === 'POST' && url.pathname === '/api/option2/contact-invite') {
        const body = await readJson(req);
        const targetChatId = body.chatId || userEnv.TELEGRAM_CHAT_ID;
        const vipDays = Math.max(0, Number(body.vipDays) || 0);
        const vipMinutes = Math.max(0, Number(body.vipMinutes) || 0);
        const autoRemove = Boolean(body.autoRemove);
        const result = await safeMtprotoContactAndInvite({
          phone: body.phone,
          username: body.username,
          firstName: body.firstName,
          lastName: body.lastName,
          chatId: targetChatId,
          fallbackInviteLink: body.fallbackInviteLink,
          userId: user.id,
          env: userEnv,
          accounts: mtAccounts,
          accountId: body.accountId || null,
        });
        if (result.outcome === 'success' && (vipDays > 0 || vipMinutes > 0)) {
          const st = loadState(user.id);
          if (result.status === 'SENT_LINK_FALLBACK' && result.fallbackInviteLink) {
            recordPendingLinkPolicy(st, {
              inviteLink: result.fallbackInviteLink,
              label: body.firstName || result.target,
              chatId: targetChatId,
              vipDays,
              vipMinutes,
              autoRemove,
              userId: user.id,
            });
          } else if (!result.skippedAlreadyMember && result.invitedUserId) {
            const grp = (st.savedGroups || []).find(g => g.id === targetChatId || (g.username && '@' + g.username === targetChatId));
            upsertVipMembership(st, {
              telegramUserId: result.invitedUserId,
              name: body.firstName || result.target,
              username: body.username || result.username || '',
              phone: body.phone || '',
              chatId: targetChatId,
              chatTitle: grp?.title || targetChatId,
              source: 'OPTION_2_MTPROTO',
              vipDays,
              vipMinutes,
              autoRemove,
              userId: user.id,
            });
          }
        }
        return sendJson(res, 200, result);
      }

      if (req.method === 'GET' && url.pathname === '/api/telegram/inspect') {
        let bot = null;
        try {
          bot = await inspectBotIntegration({
            botToken: userEnv.TELEGRAM_BOT_TOKEN,
            chatId: userEnv.TELEGRAM_CHAT_ID,
          });
          if (bot?.chat?.id) {
            cachedChatTitles.set(user.id, bot.chat.title);
            upsertSavedGroup(loadState(user.id), bot.chat, {
              userId: user.id,
              inputRef: userEnv.TELEGRAM_CHAT_ID,
            });
          }
        } catch (err) {
          bot = { connected: false, error: err.message };
        }

        let mtproto = null;
        try {
          mtproto = await inspectMtprotoPool(userEnv, { userId: user.id, accounts: mtAccounts });
        } catch (err) {
          mtproto = { connected: false, error: err.message, accounts: [] };
        }

        return sendJson(res, 200, { bot, mtproto, savedGroups: loadState(user.id).savedGroups || [] });
      }

      if (req.method === 'POST' && url.pathname === '/api/telegram/config') {
        const body = await readJson(req);
        const updates = {};
        if (body.botToken !== undefined) updates.TELEGRAM_BOT_TOKEN = String(body.botToken).trim();
        if (body.chatId !== undefined) {
          updates.TELEGRAM_CHAT_ID = String(body.chatId).trim();
          cachedChatTitles.delete(user.id);
        }
        if (body.welcomeText !== undefined) updates.TELEGRAM_WELCOME_TEXT = String(body.welcomeText);
        if (body.apiId !== undefined) updates.TELEGRAM_API_ID = String(body.apiId).trim();
        if (body.apiHash !== undefined) updates.TELEGRAM_API_HASH = String(body.apiHash).trim();
        if (body.maxInvitesPerHour !== undefined) updates.MTPROTO_MAX_INVITES_PER_HOUR = String(Math.max(1, Number(body.maxInvitesPerHour) || 4));
        if (body.maxInvitesPerDay !== undefined) updates.MTPROTO_MAX_INVITES_PER_DAY = String(Math.max(1, Number(body.maxInvitesPerDay) || 15));

        const nextEnv = saveUserEnv(user.id, updates);
        if (updates.TELEGRAM_API_ID || updates.TELEGRAM_API_HASH) await resetMtprotoClient(user.id);
        return sendJson(res, 200, { ok: true, config: getMaskedConfig(nextEnv, loadUserMtprotoAccounts(user.id)) });
      }

      if (req.method === 'POST' && url.pathname === '/api/telegram/polling') {
        const body = await readJson(req);
        const enabled = Boolean(body.enabled);
        if (enabled) {
          if (!userEnv.TELEGRAM_BOT_TOKEN?.trim()) {
            throw new Error('Save your TELEGRAM_BOT_TOKEN first.');
          }
          await clearBotWebhook({ botToken: userEnv.TELEGRAM_BOT_TOKEN });
        }
        const state = loadState(user.id);
        state.pollingEnabled = enabled;
        saveState(state, user.id);
        if (enabled) {
          syncBotUpdatesOnce(user.id, userEnv).catch(() => {});
        }
        return sendJson(res, 200, { ok: true, pollingEnabled: enabled });
      }

      if (req.method === 'POST' && url.pathname === '/api/telegram/sync') {
        if (userEnv.TELEGRAM_BOT_TOKEN?.trim()) {
          await clearBotWebhook({ botToken: userEnv.TELEGRAM_BOT_TOKEN }).catch(() => {});
        }
        const result = await syncBotUpdatesOnce(user.id, userEnv);
        const latest = loadState(user.id);
        return sendJson(res, 200, { ok: true, ...result, lastUpdateId: latest.lastUpdateId });
      }

      if (req.method === 'POST' && url.pathname === '/api/telegram/webhook-setup') {
        const body = await readJson(req);
        const state = loadState(user.id);
        state.pollingEnabled = false;
        saveState(state, user.id);
        await setupBotWebhook({
          botToken: userEnv.TELEGRAM_BOT_TOKEN,
          url: String(body.url || '').trim(),
        });
        return sendJson(res, 200, { ok: true });
      }

      if (req.method === 'POST' && url.pathname === '/api/telegram/mtproto/send-code') {
        const body = await readJson(req);
        const result = await startMtprotoLogin({
          apiId: body.apiId || userEnv.TELEGRAM_API_ID,
          apiHash: body.apiHash || userEnv.TELEGRAM_API_HASH,
          phoneNumber: body.phoneNumber,
        });
        return sendJson(res, 200, result);
      }

      if (req.method === 'POST' && url.pathname === '/api/telegram/mtproto/verify-code') {
        const body = await readJson(req);
        const result = await completeMtprotoLogin({
          loginId: body.loginId,
          phoneCode: body.phoneCode,
          password: body.password,
        });
        if (result.status === 'SIGNED_IN') {
          const accounts = upsertUserMtprotoAccount(user.id, {
            label: body.label || result.user?.firstName || result.user?.phone || '',
            apiId: result.apiId,
            apiHash: result.apiHash,
            sessionString: result.sessionString,
            phone: result.user?.phone || '',
            username: result.user?.username || null,
            firstName: result.user?.firstName || '',
          });
          await resetMtprotoClient(user.id);
          return sendJson(res, 200, {
            status: 'SIGNED_IN',
            user: result.user,
            config: getMaskedConfig(loadUserEnv(user.id), accounts),
          });
        }
        return sendJson(res, 200, result);
      }

      if (req.method === 'POST' && url.pathname === '/api/telegram/mtproto/remove') {
        const body = await readJson(req);
        if (!body.accountId) throw new Error('Account ID is required.');
        const remaining = removeUserMtprotoAccount(user.id, body.accountId);
        await resetMtprotoClient(user.id, body.accountId);
        return sendJson(res, 200, {
          ok: true,
          config: getMaskedConfig(loadUserEnv(user.id), remaining),
        });
      }

      // ============ SAVED GROUPS / CHANNELS PROFILE ROUTES ============
      if (req.method === 'POST' && url.pathname === '/api/groups/save') {
        const body = await readJson(req);
        const rawChatId = String(body.chatId || userEnv.TELEGRAM_CHAT_ID || '').trim();
        if (!rawChatId) throw new Error('Enter a Group/Channel ID (-100...) or @username.');

        let chatInfo = null;
        if (body.title) {
          chatInfo = {
            id: rawChatId,
            title: String(body.title).trim(),
            username: body.username ? String(body.username).replace(/^@/, '').trim() : null,
            type: body.type || 'supergroup',
            memberCount: body.memberCount !== undefined ? Number(body.memberCount) : null,
            photoDataUrl: body.photoDataUrl || null,
            isAdmin: Boolean(body.isAdmin),
            canInvite: Boolean(body.canInvite),
            botStatus: body.botStatus || (body.isAdmin ? 'administrator' : 'unknown'),
          };
        } else {
          if (!userEnv.TELEGRAM_BOT_TOKEN?.trim()) {
            throw new Error('Save your Bot Token in Integrate Telegram first to load group profile, photo, and member count.');
          }
          const inspected = await inspectBotIntegration({
            botToken: userEnv.TELEGRAM_BOT_TOKEN,
            chatId: rawChatId,
          });
          if (inspected.chatError) throw new Error(inspected.chatError);
          if (!inspected.chat) throw new Error('Could not read Telegram group/channel info.');
          chatInfo = inspected.chat;
        }

        const saved = upsertSavedGroup(loadState(user.id), chatInfo, {
          userId: user.id,
          inputRef: rawChatId,
        });
        let nextEnv = userEnv;
        if (body.select !== false) {
          nextEnv = saveUserEnv(user.id, { TELEGRAM_CHAT_ID: saved.group.id });
          cachedChatTitles.set(user.id, saved.group.title);
        }
        return sendJson(res, 200, {
          ok: true,
          group: saved.group,
          savedGroups: saved.savedGroups,
          config: getMaskedConfig(nextEnv, mtAccounts),
        });
      }

      if (req.method === 'POST' && url.pathname === '/api/groups/refresh') {
        const body = await readJson(req);
        const targetId = String(body.chatId || userEnv.TELEGRAM_CHAT_ID || '').trim();
        if (!targetId) throw new Error('Select or enter a group/channel first.');
        if (!userEnv.TELEGRAM_BOT_TOKEN?.trim()) {
          throw new Error('Save your Bot Token first to refresh live member count & photo.');
        }
        const inspected = await inspectBotIntegration({
          botToken: userEnv.TELEGRAM_BOT_TOKEN,
          chatId: targetId,
        });
        if (inspected.chatError) throw new Error(inspected.chatError);
        if (!inspected.chat) throw new Error('Group not reachable by Bot.');
        const saved = upsertSavedGroup(loadState(user.id), inspected.chat, {
          userId: user.id,
          inputRef: targetId,
        });
        if (saved.group.id === userEnv.TELEGRAM_CHAT_ID) {
          cachedChatTitles.set(user.id, saved.group.title);
        }
        return sendJson(res, 200, { ok: true, group: saved.group, savedGroups: saved.savedGroups });
      }

      if (req.method === 'POST' && url.pathname === '/api/groups/select') {
        const body = await readJson(req);
        const targetId = String(body.chatId || '').trim();
        if (!targetId) throw new Error('Group ID is required.');
        const nextEnv = saveUserEnv(user.id, { TELEGRAM_CHAT_ID: targetId });
        const state = loadState(user.id);
        const match = (state.savedGroups || []).find(
          g => g.id === targetId || (g.username && `@${g.username}` === targetId)
        );
        if (match?.title) cachedChatTitles.set(user.id, match.title);
        return sendJson(res, 200, {
          ok: true,
          config: getMaskedConfig(nextEnv, mtAccounts),
          savedGroups: state.savedGroups || [],
        });
      }

      if (req.method === 'POST' && url.pathname === '/api/groups/remove') {
        const body = await readJson(req);
        if (!body.chatId) throw new Error('Group ID is required.');
        const savedGroups = removeSavedGroup(loadState(user.id), body.chatId, { userId: user.id });
        return sendJson(res, 200, { ok: true, savedGroups });
      }

      // ============ PAID / VIP EXPIRY ROUTES ============
      if (req.method === 'POST' && url.pathname === '/api/memberships/renew') {
        const body = await readJson(req);
        if (!body.membershipId) throw new Error('Membership ID is required.');
        const membership = renewMembership(loadState(user.id), {
          membershipId: body.membershipId,
          addDays: body.addDays || 30,
          autoRemove: body.autoRemove,
          userId: user.id,
        });
        return sendJson(res, 200, {
          ok: true,
          membership,
          memberships: loadState(user.id).memberships || [],
        });
      }

      if (req.method === 'POST' && url.pathname === '/api/memberships/remove-expired') {
        const body = await readJson(req);
        const forceIds = body.membershipId ? [String(body.membershipId)] : null;
        const result = await runExpirySweepLocked(user.id, userEnv, { forceIds });
        const latest = loadState(user.id);
        return sendJson(res, 200, {
          ok: true,
          ...result,
          memberships: latest.memberships || [],
          history: latest.history || [],
          summary: getDashboardSummary(latest),
        });
      }

      return sendJson(res, 404, { error: 'Not found' });
    } catch (err) {
      const status = Number(err.statusCode) || 400;
      return sendJson(res, status, { error: err.message || 'Request failed', code: err.code || 'ERROR' });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  createServer().listen(PORT, () => {
    console.log(`Tenh Gram (Option 1 + Option 2) running on http://localhost:${PORT}`);
  });

  setInterval(() => {
    const now = Date.now();
    for (const u of listUsers()) {
      const state = loadState(u.id);
      const env = loadUserEnv(u.id);
      if (state.pollingEnabled && env.TELEGRAM_BOT_TOKEN?.trim()) {
        syncBotUpdatesOnce(u.id, env).catch(() => {});
      }
      if (state.bulkQueue?.running) {
        const accounts = loadUserMtprotoAccounts(u.id);
        runBulkStepLocked(u.id, env, { accounts }).catch(() => {});
      }
      const lastSweep = lastExpirySweepAt.get(u.id) || 0;
      if (now - lastSweep >= 30_000 && Array.isArray(state.memberships) && state.memberships.some(m => m.autoRemove && (m.status === 'active' || m.status === 'expired'))) {
        lastExpirySweepAt.set(u.id, now);
        runExpirySweepLocked(u.id, env, { now }).catch(() => {});
      }
    }
  }, 5000);
}
