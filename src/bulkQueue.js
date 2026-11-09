import { evaluatePoolSafety, getSafetyLimits, inferOutcome, loadState, saveState } from './safetyState.js';
import { upsertVipMembership } from './membershipManager.js';

function splitDelimitedLine(line) {
  const delimiter = line.includes('\t') ? '\t' : (line.includes(';') && !line.includes(',') ? ';' : ',');
  const fields = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      fields.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur.trim());
  return fields;
}

export function normalizePhone(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  const digits = s.replace(/[^\d]/g, '');
  if (digits.length < 7 || digits.length > 15) return '';
  if (s.startsWith('+')) return `+${digits}`;
  if (/^[\d\s().-]+$/.test(s) && digits.length >= 8) return `+${digits}`;
  return '';
}

export function normalizeUsername(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (s.startsWith('@')) {
    const clean = s.slice(1).trim();
    return /^[a-zA-Z][a-zA-Z0-9_]{3,31}$/.test(clean) ? clean : '';
  }
  if (/^(https?:\/\/)?t\.me\/[a-zA-Z][a-zA-Z0-9_]{3,31}\/?$/i.test(s)) {
    return s.replace(/^.*t\.me\//i, '').replace(/\/+$/, '');
  }
  return '';
}

function isHeaderRow(cells) {
  const joined = cells.map(c => c.toLowerCase()).join('|');
  return /(^|\|)(name|first_?name|customer|full_?name|phone|tel|mobile|username|user|telegram)(\||$)/.test(joined);
}

export function parseBulkCustomers(rawText = '') {
  const lines = String(rawText || '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  if (!lines.length) {
    return { rows: [], invalidRows: [] };
  }

  let startIndex = 0;
  let colMap = null;
  const firstCells = splitDelimitedLine(lines[0]);

  if (isHeaderRow(firstCells)) {
    startIndex = 1;
    colMap = { name: -1, phone: -1, username: -1 };
    firstCells.forEach((h, i) => {
      const k = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (colMap.name === -1 && /^(name|firstname|customer|customername|fullname)$/.test(k)) colMap.name = i;
      else if (colMap.phone === -1 && /^(phone|phonenumber|tel|telephone|mobile|whatsapp)$/.test(k)) colMap.phone = i;
      else if (colMap.username === -1 && /^(username|user|telegram|handle|tg)$/.test(k)) colMap.username = i;
    });
  }

  const rows = [];
  const invalidRows = [];

  for (let i = startIndex; i < lines.length; i++) {
    const cells = splitDelimitedLine(lines[i]);
    let name = '';
    let phone = '';
    let username = '';

    if (colMap) {
      if (colMap.name >= 0) name = (cells[colMap.name] || '').trim();
      if (colMap.phone >= 0) phone = normalizePhone(cells[colMap.phone]);
      if (colMap.username >= 0) username = normalizeUsername(cells[colMap.username]);
    }

    if (!phone && !username) {
      name = '';
      for (const cell of cells) {
        if (!phone) {
          const p = normalizePhone(cell);
          if (p) {
            phone = p;
            continue;
          }
        }
        if (!username) {
          const u = normalizeUsername(cell);
          if (u) {
            username = u;
            continue;
          }
        }
        if (!name && cell && !/^\+?\d+$/.test(cell)) {
          name = cell;
        }
      }
      // Support single un-prefixed handle like `dara_kh` on headerless lists
      if (!colMap && !phone && !username && cells.length === 1 && /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(cells[0])) {
        username = cells[0];
      }
    }

    if (!phone && !username) {
      invalidRows.push({ line: i + 1, raw: lines[i], reason: 'Missing valid phone (+code) or @username' });
      continue;
    }

    rows.push({
      name: (name || (username ? `@${username}` : phone)).slice(0, 64),
      phone,
      username,
    });
  }

  return { rows, invalidRows };
}

function getIdentityKeys(item) {
  const keys = [];
  const phone = normalizePhone(item.phone || item.target);
  if (phone) keys.push(`p:${phone}`);
  const uname = normalizeUsername(item.username ? `@${String(item.username).replace(/^@/, '')}` : item.target);
  if (uname) keys.push(`u:${uname.toLowerCase()}`);
  if (item.userId) keys.push(`id:${item.userId}`);
  return keys;
}

export function buildKnownTargetSets(state) {
  // History is newest-first; walk oldest -> newest so if a user later left, they can be re-invited.
  const chronological = [...(state.history || [])].reverse();
  const activeMembers = new Set();

  for (const h of chronological) {
    const out = inferOutcome(h);
    const keys = getIdentityKeys(h);
    if (out === 'success') {
      keys.forEach(k => activeMembers.add(k));
    } else if (out === 'left') {
      keys.forEach(k => activeMembers.delete(k));
    }
  }

  const queuedPending = new Set();
  for (const q of state.bulkQueue?.items || []) {
    if (q.status === 'pending' || q.status === 'processing') {
      getIdentityKeys(q).forEach(k => queuedPending.add(k));
    }
  }

  return { activeMembers, queuedPending };
}

export function enqueueBulkCustomers(
  state,
  { text = '', chatId = '', fallbackInviteLink = '', vipDays = undefined, autoRemove = undefined, userId = null } = {}
) {
  const { rows, invalidRows } = parseBulkCustomers(text);
  const { activeMembers, queuedPending } = buildKnownTargetSets(state);
  const seenInBatch = new Set();

  const existingQueue = state.bulkQueue || {
    running: false,
    chatId: '',
    fallbackInviteLink: '',
    vipDays: 0,
    autoRemove: false,
    pausedReason: '',
    lastRunAt: null,
    items: [],
  };

  const addedItems = [];
  const skipped = [];

  for (const r of rows) {
    const keys = getIdentityKeys(r);
    const label = r.phone || `@${r.username}`;

    if (keys.some(k => seenInBatch.has(k))) {
      skipped.push({ target: label, name: r.name, reason: 'Duplicate inside pasted/CSV list' });
      continue;
    }
    if (keys.some(k => queuedPending.has(k))) {
      skipped.push({ target: label, name: r.name, reason: 'Already pending in queue' });
      continue;
    }
    if (keys.some(k => activeMembers.has(k))) {
      skipped.push({ target: label, name: r.name, reason: 'Already in group or invited' });
      continue;
    }

    keys.forEach(k => {
      seenInBatch.add(k);
      queuedPending.add(k);
    });

    addedItems.push({
      id: `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      name: r.name,
      phone: r.phone || '',
      username: r.username || '',
      target: label,
      status: 'pending',
      resultStatus: '',
      reason: '',
      createdAt: new Date().toISOString(),
      processedAt: null,
    });
  }

  state.bulkQueue = {
    running: Boolean(existingQueue.running),
    chatId: String(chatId ?? existingQueue.chatId ?? '').trim(),
    fallbackInviteLink: String(fallbackInviteLink ?? existingQueue.fallbackInviteLink ?? '').trim(),
    vipDays: vipDays !== undefined ? Math.max(0, Number(vipDays) || 0) : Math.max(0, Number(existingQueue.vipDays) || 0),
    autoRemove: autoRemove !== undefined ? Boolean(autoRemove) : Boolean(existingQueue.autoRemove),
    pausedReason: existingQueue.pausedReason || '',
    lastRunAt: existingQueue.lastRunAt || null,
    items: [...existingQueue.items, ...addedItems].slice(0, 500),
  };

  const saved = saveState(state, userId);
  return {
    added: addedItems.length,
    skippedDuplicates: skipped.filter(s => s.reason.includes('Duplicate') || s.reason.includes('pending')).length,
    skippedAlreadyInGroup: skipped.filter(s => s.reason.includes('Already in group')).length,
    skippedDetails: skipped.slice(0, 30),
    invalidRows,
    queue: saved.bulkQueue,
  };
}

export function controlBulkQueue(
  state,
  { action = '', itemId = '', fallbackInviteLink, chatId, vipDays, autoRemove, userId = null } = {}
) {
  const q = state.bulkQueue || {
    running: false,
    chatId: '',
    fallbackInviteLink: '',
    vipDays: 0,
    autoRemove: false,
    pausedReason: '',
    lastRunAt: null,
    items: [],
  };

  if (fallbackInviteLink !== undefined) q.fallbackInviteLink = String(fallbackInviteLink).trim();
  if (chatId !== undefined) q.chatId = String(chatId).trim();
  if (vipDays !== undefined) q.vipDays = Math.max(0, Number(vipDays) || 0);
  if (autoRemove !== undefined) q.autoRemove = Boolean(autoRemove);

  if (action === 'start') {
    q.running = true;
    q.pausedReason = '';
  } else if (action === 'pause') {
    q.running = false;
    q.pausedReason = 'Paused by user';
  } else if (action === 'clear_done') {
    q.items = q.items.filter(it => it.status === 'pending' || it.status === 'processing');
  } else if (action === 'clear_all') {
    q.running = false;
    q.pausedReason = '';
    q.items = [];
  } else if (action === 'remove_item' && itemId) {
    q.items = q.items.filter(it => it.id !== itemId);
  }

  state.bulkQueue = q;
  return saveState(state, userId).bulkQueue;
}

export async function processBulkQueueStep(
  userId,
  userEnv = process.env,
  { inviterFn, forceWhenPaused = false, accounts = [] } = {}
) {
  const state = loadState(userId);
  const q = state.bulkQueue;
  if (!q || !Array.isArray(q.items)) return { processed: false, reason: 'NO_QUEUE' };
  if (!q.running && !forceWhenPaused) return { processed: false, reason: 'PAUSED' };

  const idx = q.items.findIndex(it => it.status === 'pending');
  if (idx === -1) {
    q.running = false;
    q.pausedReason = '';
    saveState(state, userId);
    return { processed: false, reason: 'QUEUE_EMPTY' };
  }

  const item = q.items[idx];
  const { activeMembers } = buildKnownTargetSets(state);
  if (getIdentityKeys(item).some(k => activeMembers.has(k))) {
    item.status = 'skipped';
    item.resultStatus = 'ALREADY_IN_GROUP';
    item.reason = 'Already in group or invited';
    item.processedAt = new Date().toISOString();
    q.lastRunAt = item.processedAt;
    if (!q.items.some(it => it.status === 'pending')) q.running = false;
    saveState(state, userId);
    return { processed: true, item, outcome: 'skipped' };
  }

  const limits = getSafetyLimits(userEnv);
  const pool = Array.isArray(accounts) ? accounts : [];
  const safety = evaluatePoolSafety(state, pool, { addContact: Boolean(item.phone), limits });
  if (!safety.allowed) {
    q.pausedReason = safety.message;
    if (safety.code === 'CIRCUIT_BREAKER_ACTIVE') {
      q.running = false;
    }
    saveState(state, userId);
    return { processed: false, blocked: true, code: safety.code, message: safety.message };
  }

  const runInvite = inviterFn || (await import('./option2MtprotoInvite.js')).safeMtprotoContactAndInvite;

  try {
    const res = await runInvite({
      phone: item.phone,
      username: item.username,
      firstName: item.name || 'Customer',
      chatId: q.chatId || userEnv.TELEGRAM_CHAT_ID,
      fallbackInviteLink: q.fallbackInviteLink || '',
      userId,
      env: userEnv,
      accounts: pool,
    });

    const latest = loadState(userId);
    const curItem = latest.bulkQueue.items.find(it => it.id === item.id) || item;
    const viaLabel = res.accountLabel && pool.length > 1 ? ` (via ${res.accountLabel})` : '';
    if (res.skippedAlreadyMember || res.status === 'ALREADY_IN_GROUP') {
      curItem.status = 'skipped';
      curItem.resultStatus = 'ALREADY_IN_GROUP';
      curItem.reason = (res.message || 'Already a member of target group') + viaLabel;
    } else if (res.outcome === 'success') {
      curItem.status = 'done';
      curItem.resultStatus = res.status || 'DIRECT_INVITED';
      curItem.reason = (res.message || '') + viaLabel;
      if (!res.skippedAlreadyMember && Number(latest.bulkQueue.vipDays) > 0 && res.invitedUserId) {
        const targetChat = latest.bulkQueue.chatId || userEnv.TELEGRAM_CHAT_ID || '';
        const grp = (latest.savedGroups || []).find(g => g.id === targetChat || (g.username && '@' + g.username === targetChat));
        upsertVipMembership(latest, {
          telegramUserId: res.invitedUserId,
          name: item.name || 'Customer',
          username: item.username || res.username || '',
          phone: item.phone || '',
          chatId: targetChat,
          chatTitle: grp?.title || targetChat,
          source: 'OPTION_2_BULK',
          vipDays: Number(latest.bulkQueue.vipDays),
          autoRemove: Boolean(latest.bulkQueue.autoRemove),
          userId,
        });
      }
    } else {
      curItem.status = 'failed';
      curItem.resultStatus = res.status || 'FAILED';
      curItem.reason = (res.message || res.reason || 'Failed') + viaLabel;
    }
    curItem.processedAt = new Date().toISOString();
    latest.bulkQueue.lastRunAt = curItem.processedAt;
    latest.bulkQueue.pausedReason = '';

    if (res.status === 'CIRCUIT_BREAK_24H' && !res.poolRemainingHealthy) {
      latest.bulkQueue.running = false;
      latest.bulkQueue.pausedReason = res.message;
    } else if (!latest.bulkQueue.items.some(it => it.status === 'pending')) {
      latest.bulkQueue.running = false;
    }

    saveState(latest, userId);
    return { processed: true, item: curItem, result: res };
  } catch (err) {
    const latest = loadState(userId);
    const curItem = latest.bulkQueue.items.find(it => it.id === item.id) || item;
    curItem.status = 'failed';
    curItem.resultStatus = err.code || 'ERROR';
    curItem.reason = err.message || 'Invite failed';
    curItem.processedAt = new Date().toISOString();
    latest.bulkQueue.lastRunAt = curItem.processedAt;
    if (err.code === 'CIRCUIT_BREAKER_ACTIVE') {
      latest.bulkQueue.running = false;
      latest.bulkQueue.pausedReason = err.message;
    } else if (!latest.bulkQueue.items.some(it => it.status === 'pending')) {
      latest.bulkQueue.running = false;
    }
    saveState(latest, userId);
    return { processed: true, item: curItem, error: err.message };
  }
}
