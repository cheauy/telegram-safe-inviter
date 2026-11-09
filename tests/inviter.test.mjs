import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBotSafeInviteLink,
  handleBotJoinRequestWebhook,
  handleTelegramUpdate,
  inspectBotIntegration,
  removeExpiredGroupMember,
} from '../src/option1BotInvite.js';
import {
  getMtprotoClientPoolSize,
  inspectMtprotoPool,
  resetMtprotoClient,
  safeMtprotoContactAndInvite,
} from '../src/option2MtprotoInvite.js';
import {
  evaluateInviteSafety,
  evaluatePoolSafety,
  getDashboardSummary,
  loadState,
  pickAvailablePoolAccount,
  recordAction,
  saveState,
} from '../src/safetyState.js';
import { getMaskedConfig } from '../src/envStore.js';
import { controlBulkQueue, enqueueBulkCustomers, parseBulkCustomers, processBulkQueueStep } from '../src/bulkQueue.js';
import { buildCsvExport, buildExcelExport, filterActivityRows } from '../src/exportUtils.js';
import {
  activateMembershipFromEvent,
  processExpiredMemberships,
  recordPendingLinkPolicy,
  removeSavedGroup,
  renewMembership,
  upsertSavedGroup,
  upsertVipMembership,
} from '../src/membershipManager.js';
import {
  loadUserMtprotoAccounts,
  removeUserMtprotoAccount,
  upsertUserMtprotoAccount,
} from '../src/authStore.js';
import { createServer } from '../src/server.js';

const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tenhgram-test-'));
const testStateFile = path.join(testDataDir, 'safety-state.json');
process.env.TELEGRAM_DATA_DIR = testDataDir;
process.env.TELEGRAM_STATE_FILE = testStateFile;
test.after(() => {
  fs.rmSync(testDataDir, { recursive: true, force: true });
});

test('Option 1: creates join-request invite link and auto-approves webhook', async () => {
  const calls = [];
  const fakeFetch = async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push({ url, body });
    if (url.endsWith('/createChatInviteLink')) {
      return {
        json: async () => ({
          ok: true,
          result: {
            invite_link: 'https://t.me/+SafeInviteHash123',
            name: body.name,
            creates_join_request: true,
          },
        }),
      };
    }
    return { json: async () => ({ ok: true, result: true }) };
  };

  const link = await createBotSafeInviteLink({
    botToken: '123:ABC',
    chatId: '-100999',
    label: 'Order #55',
    mode: 'join_request',
    fetchImpl: fakeFetch,
  });

  assert.equal(link.inviteLink, 'https://t.me/+SafeInviteHash123');
  assert.equal(link.createsJoinRequest, true);

  const webhookResult = await handleBotJoinRequestWebhook(
    {
      chat_join_request: {
        chat: { id: -100999, title: 'Tenh Gram VIP' },
        from: { id: 777888, first_name: 'Dara', username: 'dara_kh' },
        invite_link: { name: 'Order #55' },
      },
    },
    { botToken: '123:ABC', fetchImpl: fakeFetch }
  );

  assert.equal(webhookResult.handled, true);
  assert.equal(webhookResult.outcome, 'success');
  assert.equal(webhookResult.approvedUserId, 777888);
  assert.equal(webhookResult.welcomed, true);
  assert.equal(calls.length, 3);
});

test('Member tracking: classifies chat_member join as success and leave as customer leaved', async () => {
  const joined = await handleTelegramUpdate({
    chat_member: {
      chat: { id: -100999, title: 'Tenh Gram VIP' },
      old_chat_member: { status: 'left', user: { id: 555, first_name: 'Bora', username: 'bora_kh' } },
      new_chat_member: { status: 'member', user: { id: 555, first_name: 'Bora', username: 'bora_kh' } },
      invite_link: { name: 'Receipt #12', invite_link: 'https://t.me/+Receipt12' },
    },
  });

  assert.equal(joined.handled, true);
  assert.equal(joined.outcome, 'success');
  assert.equal(joined.status, 'JOINED');
  assert.equal(joined.inviteName, 'Receipt #12');

  const left = await handleTelegramUpdate({
    chat_member: {
      chat: { id: -100999, title: 'Tenh Gram VIP' },
      old_chat_member: { status: 'member', user: { id: 555, first_name: 'Bora', username: 'bora_kh' } },
      new_chat_member: { status: 'left', user: { id: 555, first_name: 'Bora', username: 'bora_kh' } },
    },
  });

  assert.equal(left.handled, true);
  assert.equal(left.outcome, 'left');
  assert.equal(left.status, 'CUSTOMER_LEFT');
  assert.equal(left.firstName, 'Bora');
});

test('Option 2: sends DM fallback when link provided, logs failure when no fallback link', async () => {
  saveState({
    circuitBrokenUntil: 0,
    floodWaitUntil: 0,
    nextAllowedActionAt: 0,
    inviteTimestamps: [],
    contactImportTimestamps: [],
    lastUpdateId: 0,
    pollingEnabled: false,
    history: [],
  });

  const dmMessages = [];
  const fakeClient = {
    async getEntity(id) { return { id }; },
    async invoke(req) {
      if (req.className === 'contacts.ImportContacts') {
        return { users: [{ id: 999111, firstName: 'Sokha' }] };
      }
      if (req.className === 'channels.InviteToChannel') {
        const err = new Error('USER_PRIVACY_RESTRICTED');
        err.errorMessage = 'USER_PRIVACY_RESTRICTED';
        throw err;
      }
      return {};
    },
    async sendMessage(entity, payload) {
      dmMessages.push({ entity, payload });
    },
  };

  const FakeApi = {
    InputPhoneContact: class { constructor(args) { Object.assign(this, args); } },
    contacts: {
      ImportContacts: class { constructor(args) { this.className = 'contacts.ImportContacts'; Object.assign(this, args); } },
      AddContact: class { constructor(args) { this.className = 'contacts.AddContact'; Object.assign(this, args); } },
    },
    channels: {
      InviteToChannel: class { constructor(args) { this.className = 'channels.InviteToChannel'; Object.assign(this, args); } },
    },
  };

  const res = await safeMtprotoContactAndInvite({
    phone: '+85512345678',
    firstName: 'Sokha',
    chatId: '-100999',
    fallbackInviteLink: 'https://t.me/+SafeInviteHash123',
    clientOverride: fakeClient,
    apiClassOverride: FakeApi,
  });

  assert.equal(res.status, 'SENT_LINK_FALLBACK');
  assert.equal(res.outcome, 'success');
  assert.equal(dmMessages.length, 1);

  const s = loadState();
  s.nextAllowedActionAt = 0;
  saveState(s);

  const failRes = await safeMtprotoContactAndInvite({
    phone: '+85512345999',
    firstName: 'Vichea',
    chatId: '-100999',
    fallbackInviteLink: '',
    clientOverride: fakeClient,
    apiClassOverride: FakeApi,
  });

  assert.equal(failRes.status, 'PRIVACY_RESTRICTED');
  assert.equal(failRes.outcome, 'failed');

  const summary = getDashboardSummary(loadState());
  assert.equal(summary.success, 1);
  assert.equal(summary.failed, 1);
});

test('Safety state: blocks when hourly cap or PEER_FLOOD circuit breaker is active', () => {
  const now = Date.now();
  const stateWithFourInHour = {
    circuitBrokenUntil: 0,
    floodWaitUntil: 0,
    nextAllowedActionAt: 0,
    inviteTimestamps: [now - 1000, now - 2000, now - 3000, now - 4000],
    contactImportTimestamps: [],
    history: [],
  };

  const capCheck = evaluateInviteSafety(stateWithFourInHour, {
    now,
    limits: { maxInvitesPerHour: 4, maxInvitesPerDay: 15, maxContactsPerDay: 12, minDelayMs: 1000, maxDelayMs: 2000 },
  });
  assert.equal(capCheck.allowed, false);
  assert.equal(capCheck.code, 'HOURLY_CAP_REACHED');

  const circuitState = {
    ...stateWithFourInHour,
    circuitBrokenUntil: now + 3600_000,
    circuitReason: 'PEER_FLOOD',
  };
  const cbCheck = evaluateInviteSafety(circuitState, { now });
  assert.equal(cbCheck.allowed, false);
  assert.equal(cbCheck.code, 'CIRCUIT_BREAKER_ACTIVE');
});

test('Auth signup/login isolates & persists user history and serves clean Tenh Gram UI', async () => {
  const masked = getMaskedConfig({
    TELEGRAM_BOT_TOKEN: '123456:SECRETTOKEN9999',
    TELEGRAM_CHAT_ID: '-10012345',
    TELEGRAM_API_HASH: 'abcdef1234567890',
    TELEGRAM_STRING_SESSION: '1BVtsOH0Bu789xyz',
  });
  assert.equal(masked.botConfigured, true);
  assert.equal(masked.botTokenPreview.includes('SECRETTOKEN'), false);
  assert.equal(masked.apiHashPreview.includes('abcdef123456'), false);

  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;

    // Verify UI HTML structure (no Demo, no menu subtitles, no TENH/MetaBulk)
    const htmlRes = await fetch(`${base}/`);
    const html = await htmlRes.text();
    assert.equal(htmlRes.status, 200);
    assert.match(html, /Tenh Gram/);
    assert.doesNotMatch(html, /TeleGuard/i);
    assert.match(html, /id="authGate"/);
    assert.match(html, /id="sidebarToggle"/);
    assert.match(html, /side-collapsed/);
    assert.match(html, /Option 1 · Safe Link/);
    assert.match(html, /Option 2 · Direct Invite/);
    assert.match(html, /Bulk CSV Queue/);
    assert.match(html, /id="menu-bulk"/);
    assert.match(html, /Export CSV/);
    assert.match(html, /Export Excel/);
    assert.match(html, /Activity &amp; Status/);
    assert.match(html, /Invites \/ Links/);
    assert.match(html, /Invited Success/);
    assert.match(html, /Failed/);
    assert.match(html, /Customer Leaved/);
    assert.match(html, /Integrate Telegram/);
    assert.match(html, /data-menu="group"/);
    assert.match(html, /id="menu-group"/);
    assert.match(html, /id="groupListWrap"/);
    assert.doesNotMatch(html, /Sync Events/);
    assert.doesNotMatch(html, /Telegram Setup/);
    assert.match(html, /id="intTabBot"[\s\S]*Option 1 · Bot Setup[\s\S]*Recommended/);
    assert.match(html, /id="intTabMt"[\s\S]*Option 2 · Phone Account[\s\S]*Optional/);
    assert.match(html, /id="intPanelBot"/);
    assert.match(html, /id="intPanelMt"/);
    assert.match(html, /id="siteFooter"[\s\S]*Copyright &copy; 2026 Tenh/);
    assert.match(html, /id="groupProfileBar"/);
    assert.match(html, /id="savedGroupSelect"/);
    assert.match(html, /id="o1VipDays"/);
    assert.match(html, /id="o2PoolBanner"/);
    assert.match(html, /id="bulkVipDays"/);
    assert.match(html, /data-filter="vip"/);
    assert.match(html, /openLegalModal\('privacy'\).*Privacy/);
    assert.match(html, /openLegalModal\('policy'\).*Policy/);
    assert.match(html, /openLegalModal\('terms'\).*Terms of Service/);
    assert.match(html, /id="legalModal"/);
    assert.doesNotMatch(html, /Preview Demo|DEMO_HISTORY/i);
    assert.doesNotMatch(html, /class="nav-desc"|class="card-sub"|class="top-sub"/);
    assert.doesNotMatch(html, /diagBotSub|diagChatSub|diagMtSub|topMenuSub/);
    assert.doesNotMatch(html, /TENH Publisher|MetaBulk/i);
    assert.ok(html.indexOf('id="menu-status"') < html.indexOf('class="kpi-strip"'));
    assert.ok(html.indexOf('class="kpi-strip"') < html.indexOf('id="menu-integrate"'));
    assert.match(html, /rel="icon"[^>]*href="\/favicon\.ico"/);
    assert.match(html, /rel="apple-touch-icon"[^>]*href="\/apple-touch-icon\.png"/);
    assert.match(html, /rel="manifest"[^>]*href="\/manifest\.webmanifest"/);
    assert.match(html, /<img src="\/logo\.png"/);

    // Verify logo assets for website, tab, and installable app
    for (const [assetPath, expectedType] of [
      ['/logo.png', 'image/png'],
      ['/favicon-32.png', 'image/png'],
      ['/favicon.ico', 'image/x-icon'],
      ['/apple-touch-icon.png', 'image/png'],
      ['/icon-192.png', 'image/png'],
      ['/icon-512.png', 'image/png'],
    ]) {
      const r = await fetch(`${base}${assetPath}`);
      assert.equal(r.status, 200);
      assert.equal(r.headers.get('content-type'), expectedType);
      assert.ok((await r.arrayBuffer()).byteLength > 100);
    }
    const manifestRes = await fetch(`${base}/manifest.webmanifest`);
    assert.equal(manifestRes.status, 200);
    const manifestJson = await manifestRes.json();
    assert.equal(manifestJson.name, 'Tenh Gram');
    assert.equal(manifestJson.icons.length, 3);

    // Unauthenticated status call returns 401
    const unauthStatus = await fetch(`${base}/api/status`);
    assert.equal(unauthStatus.status, 401);

    // Sign up User A
    const signupA = await fetch(`${base}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice', email: 'alice@example.com', password: 'password123' }),
    });
    assert.equal(signupA.status, 201);
    const cookieA = signupA.headers.get('set-cookie').split(';')[0];
    const userA = (await signupA.json()).user;

    // Record leave event under User A's persistent state
    recordAction(loadState(userA.id), {
      option: 'OPTION_1_WEBHOOK',
      outcome: 'left',
      status: 'CUSTOMER_LEFT',
      target: 'Customer A Left',
    }, { userId: userA.id });

    const statusA = await fetch(`${base}/api/status`, { headers: { Cookie: cookieA } });
    assert.equal(statusA.status, 200);
    assert.equal((await statusA.json()).summary.left, 1);

    // Sign up User B -> isolated workspace has 0 items
    const signupB = await fetch(`${base}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bob', email: 'bob@example.com', password: 'password123' }),
    });
    assert.equal(signupB.status, 201);
    const cookieB = signupB.headers.get('set-cookie').split(';')[0];
    const statusB = await fetch(`${base}/api/status`, { headers: { Cookie: cookieB } });
    assert.equal((await statusB.json()).summary.total, 0);

    // Log back in as User A -> User A's saved history is still preserved
    const loginA = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', password: 'password123' }),
    });
    assert.equal(loginA.status, 200);
    const freshCookieA = loginA.headers.get('set-cookie').split(';')[0];
    const restoredA = await fetch(`${base}/api/status`, { headers: { Cookie: freshCookieA } });
    const restoredJson = await restoredA.json();
    assert.equal(restoredJson.summary.left, 1);
    assert.equal(restoredJson.history[0].target, 'Customer A Left');

    // Record Invited Success and Failed entries for User A, then test CSV & Excel export filtering
    recordAction(loadState(userA.id), {
      option: 'OPTION_2_MTPROTO',
      outcome: 'success',
      status: 'DIRECT_INVITED',
      name: 'Sokha',
      phone: '+85512345678',
      target: '+85512345678',
    }, { userId: userA.id });
    recordAction(loadState(userA.id), {
      option: 'OPTION_2_MTPROTO',
      outcome: 'failed',
      status: 'PRIVACY_RESTRICTED',
      name: 'Dara',
      username: 'dara_kh',
      target: '@dara_kh',
      reason: 'USER_PRIVACY_RESTRICTED',
    }, { userId: userA.id });

    const csvLeft = await fetch(`${base}/api/status/export?format=csv&outcome=left`, { headers: { Cookie: freshCookieA } });
    assert.equal(csvLeft.status, 200);
    assert.match(csvLeft.headers.get('content-type'), /text\/csv/);
    const csvLeftText = await csvLeft.text();
    assert.match(csvLeftText, /Customer A Left/);
    assert.doesNotMatch(csvLeftText, /\+85512345678/);

    const xlsFailed = await fetch(`${base}/api/status/export?format=excel&outcome=failed`, { headers: { Cookie: freshCookieA } });
    assert.equal(xlsFailed.status, 200);
    assert.match(xlsFailed.headers.get('content-type'), /vnd\.ms-excel/);
    const xlsText = await xlsFailed.text();
    assert.match(xlsText, /<Workbook/);
    assert.match(xlsText, /USER_PRIVACY_RESTRICTED/);
    assert.doesNotMatch(xlsText, /Customer A Left/);

    // Test HTTP Bulk Enqueue deduplication (Sokha already invited -> skipped; duplicate in batch -> skipped)
    const enqueueRes = await fetch(`${base}/api/bulk/enqueue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: freshCookieA },
      body: JSON.stringify({
        text: 'name,phone,username\nSokha,+85512345678,\nVichea,+85598765432,\nVichea Dup,+85598765432,\nLina,,@lina_store',
        autoStart: false,
      }),
    });
    assert.equal(enqueueRes.status, 200);
    const enqJson = await enqueueRes.json();
    assert.equal(enqJson.added, 2); // Vichea + Lina
    assert.equal(enqJson.skippedAlreadyInGroup, 1); // Sokha
    assert.equal(enqJson.skippedDuplicates, 1); // Vichea Dup
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('Bulk queue: skips duplicates & existing group members, drips safely, pauses on PEER_FLOOD', async () => {
  const parsed = parseBulkCustomers('name,phone,username\nBora,+85511223344,\n@chea_shop\nBadLineWithoutTarget');
  assert.equal(parsed.rows.length, 2);
  assert.equal(parsed.invalidRows.length, 1);
  assert.equal(parsed.rows[0].phone, '+85511223344');
  assert.equal(parsed.rows[1].username, 'chea_shop');

  const qUser = 'u_bulk_test';
  saveState({
    circuitBrokenUntil: 0,
    floodWaitUntil: 0,
    nextAllowedActionAt: 0,
    inviteTimestamps: [],
    contactImportTimestamps: [],
    lastUpdateId: 0,
    pollingEnabled: false,
    bulkQueue: { running: false, chatId: '-100999', fallbackInviteLink: '', pausedReason: '', lastRunAt: null, items: [] },
    history: [
      // Invited and still in group -> skip
      { id: '1', at: '2026-11-08T10:00:00Z', outcome: 'success', status: 'JOINED', target: '@stay_member', username: 'stay_member' },
      // Joined then left (newest first) -> allow re-invite!
      { id: '2', at: '2026-11-08T12:00:00Z', outcome: 'left', status: 'CUSTOMER_LEFT', target: '@rejoin_ok', username: 'rejoin_ok' },
      { id: '3', at: '2026-11-08T11:00:00Z', outcome: 'success', status: 'JOINED', target: '@rejoin_ok', username: 'rejoin_ok' },
    ],
  }, qUser);

  const enq = enqueueBulkCustomers(loadState(qUser), {
    text: 'Stay,@stay_member\nRejoin,@rejoin_ok\nNewOne,+85511002233\nDupNew,+85511002233',
    userId: qUser,
  });
  assert.equal(enq.added, 2);
  assert.equal(enq.skippedAlreadyInGroup, 1);
  assert.equal(enq.skippedDuplicates, 1);

  controlBulkQueue(loadState(qUser), { action: 'start', userId: qUser });

  let calls = 0;
  const step1 = await processBulkQueueStep(qUser, { MTPROTO_MIN_DELAY_MS: '60000', MTPROTO_MAX_DELAY_MS: '60000' }, {
    inviterFn: async ({ username, userId }) => {
      calls++;
      recordAction(loadState(userId), {
        option: 'OPTION_2_MTPROTO',
        outcome: 'success',
        status: 'DIRECT_INVITED',
        target: `@${username}`,
        username,
        countedInvite: true,
      }, { userId });
      return { outcome: 'success', status: 'DIRECT_INVITED' };
    },
  });
  assert.equal(step1.processed, true);
  assert.equal(step1.item.status, 'done');
  assert.equal(calls, 1);

  // Immediate second step must respect JITTER_COOLDOWN (60s) and NOT invite yet
  const stepCooldown = await processBulkQueueStep(qUser, {}, {
    inviterFn: async () => { throw new Error('Should not be called during cooldown'); },
  });
  assert.equal(stepCooldown.processed, false);
  assert.equal(stepCooldown.code, 'JITTER_COOLDOWN');

  // Clear cooldown and simulate PEER_FLOOD circuit break on remaining item -> auto-pauses queue
  const st = loadState(qUser);
  st.nextAllowedActionAt = 0;
  saveState(st, qUser);
  const stepFlood = await processBulkQueueStep(qUser, {}, {
    inviterFn: async () => ({ outcome: 'failed', status: 'CIRCUIT_BREAK_24H', message: 'PEER_FLOOD pause' }),
  });
  assert.equal(stepFlood.processed, true);
  assert.equal(stepFlood.item.status, 'failed');
  assert.equal(loadState(qUser).bulkQueue.running, false);
});

test('Export helpers & live GetParticipant skip avoid burning quota on existing members', async () => {
  const sample = [
    { name: 'Chan', phone: '+85512345678', option: 'OPTION_2_MTPROTO', outcome: 'success', status: 'DIRECT_INVITED', at: '2026-11-08T10:00:00Z' },
    { name: 'Nary', username: 'nary', option: 'OPTION_1_WEBHOOK', outcome: 'left', status: 'CUSTOMER_LEFT', at: '2026-11-08T11:00:00Z' },
  ];
  const filtered = filterActivityRows(sample, { outcome: 'left' });
  assert.equal(filtered.length, 1);
  const csv = buildCsvExport(filtered);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.match(csv, /Customer Leaved/);
  const xls = buildExcelExport(sample, 'Report');
  assert.match(xls, /<Data ss:Type="String">\+85512345678<\/Data>/);

  // Live GetParticipant returns active member -> skips InviteToChannel and skips quota count
  const uid = 'u_skip_live';
  saveState({
    circuitBrokenUntil: 0, floodWaitUntil: 0, nextAllowedActionAt: 0,
    inviteTimestamps: [], contactImportTimestamps: [], history: [],
  }, uid);
  let invitedCalled = false;
  const fakeClient = {
    async getEntity(id) { return { id }; },
    async invoke(req) {
      if (req.className === 'channels.GetParticipant') return { participant: { className: 'ChannelParticipant' } };
      if (req.className === 'channels.InviteToChannel') invitedCalled = true;
      return {};
    },
  };
  const FakeApi = {
    contacts: { AddContact: class { constructor(a) { Object.assign(this, a); } } },
    channels: {
      GetParticipant: class { constructor(a) { this.className = 'channels.GetParticipant'; Object.assign(this, a); } },
      InviteToChannel: class { constructor(a) { this.className = 'channels.InviteToChannel'; Object.assign(this, a); } },
    },
  };
  const res = await safeMtprotoContactAndInvite({
    username: '@already_here',
    chatId: '-100999',
    userId: uid,
    clientOverride: fakeClient,
    apiClassOverride: FakeApi,
  });
  assert.equal(invitedCalled, false);
  assert.equal(res.skippedAlreadyMember, true);
  assert.equal(res.status, 'ALREADY_IN_GROUP');
  assert.equal(loadState(uid).inviteTimestamps.length, 0);
});

test('Multi-Account Pool Rotation: rotates across accounts, isolates rate caps and handles PEER_FLOOD', async () => {
  const uid = 'u_pool_tester';
  const limits = { maxInvitesPerHour: 2, maxInvitesPerDay: 5, maxContactsPerDay: 5 };
  const accounts = [
    { id: 'acc1', label: 'SIM 1 (Sales)', phone: '+85511111111' },
    { id: 'acc2', label: 'SIM 2 (Backup)', phone: '+85522222222' },
    { id: 'acc3', label: 'SIM 3 (Drip)', phone: '+85533333333' },
  ];

  const st = loadState(uid);
  st.accountSafety = {};
  saveState(st, uid);

  // 1. Initial pick: selects acc1
  const pick1 = pickAvailablePoolAccount(st, accounts, { limits });
  assert.equal(pick1?.account.id, 'acc1');

  // Record 2 invites on acc1 -> reaches hourly limit
  const now = Date.now();
  recordAction(st, { option: 'OPTION_2_MTPROTO', outcome: 'success', status: 'DIRECT_INVITED', target: '+855990001' }, { limits, userId: uid, accountId: 'acc1', poolSize: 3, now });
  recordAction(st, { option: 'OPTION_2_MTPROTO', outcome: 'success', status: 'DIRECT_INVITED', target: '+855990002' }, { limits, userId: uid, accountId: 'acc1', poolSize: 3, now });

  const stAfterAcc1 = loadState(uid);
  const poolSafety1 = evaluatePoolSafety(stAfterAcc1, accounts, { limits, now });
  assert.equal(poolSafety1.allowed, true);
  assert.equal(poolSafety1.activeAccountId, 'acc2'); // acc1 is capped, rotated to acc2!

  // Record a PEER_FLOOD circuit break on acc2
  recordAction(stAfterAcc1, { option: 'OPTION_2_MTPROTO', outcome: 'failed', status: 'CIRCUIT_BREAK_24H', target: '+855990003' }, { limits, userId: uid, accountId: 'acc2', poolSize: 3, now });

  const stAfterAcc2 = loadState(uid);
  const poolSafety2 = evaluatePoolSafety(stAfterAcc2, accounts, { limits, now });
  assert.equal(poolSafety2.allowed, true);
  assert.equal(poolSafety2.activeAccountId, 'acc3'); // acc2 circuit-broken, rotated to acc3!
  assert.equal(poolSafety2.accountSafetyStats.find(a => a.id === 'acc2')?.code, 'CIRCUIT_BREAKER_ACTIVE');

  // Verify client reset cleans target account
  resetMtprotoClient(uid, 'acc1');
  assert.equal(typeof getMtprotoClientPoolSize(), 'number');

  // Bulk Queue with pool: when acc1 hits PEER_FLOOD, pool keeps running via remaining accounts
  const bUser = 'u_bulk_pool_test';
  const bState = loadState(bUser);
  enqueueBulkCustomers(bState, {
    text: 'Customer 1,+85599111111,\nCustomer 2,+85599222222,',
    userId: bUser,
  });
  controlBulkQueue(loadState(bUser), { action: 'start', userId: bUser });

  let callCount = 0;
  const mockInviter = async ({ accountId }) => {
    callCount++;
    if (callCount === 1) {
      // First account triggers PEER_FLOOD but reports pool has healthy account
      return { outcome: 'failed', status: 'CIRCUIT_BREAK_24H', message: 'PEER_FLOOD', poolRemainingHealthy: true };
    }
    return { outcome: 'success', status: 'DIRECT_INVITED', accountLabel: 'SIM 2 (Backup)', invitedUserId: 777 };
  };

  const step1 = await processBulkQueueStep(bUser, {}, { inviterFn: mockInviter, accounts });
  assert.equal(step1.processed, true);
  assert.equal(step1.item.status, 'failed');
  // Queue MUST remain running because poolRemainingHealthy was true
  assert.equal(loadState(bUser).bulkQueue.running, true);

  const step2 = await processBulkQueueStep(bUser, {}, { inviterFn: mockInviter, accounts });
  assert.equal(step2.processed, true);
  assert.equal(step2.item.status, 'done');
});

test('Paid / VIP Expiry Lifecycle: link policy -> activation -> expiration sweep -> ban+unban -> renew', async () => {
  const uid = 'u_vip_lifecycle';
  const st = loadState(uid);

  // 1. Record pending link policy (e.g. 30 Days VIP)
  recordPendingLinkPolicy(st, {
    inviteLink: 'https://t.me/+VipLinkLifecycle',
    label: 'VIP Customer Gold',
    chatId: '-100888999',
    vipDays: 30,
    autoRemove: true,
    userId: uid,
  });

  const stWithPolicy = loadState(uid);
  assert.equal(stWithPolicy.pendingLinkPolicies['https://t.me/+VipLinkLifecycle']?.vipDays, 30);

  // 2. Customer joins -> activateMembershipFromEvent
  const activated = activateMembershipFromEvent(stWithPolicy, {
    inviteLink: 'https://t.me/+VipLinkLifecycle',
    telegramUserId: 998877,
    name: 'Gold Member',
    username: 'gold_member',
    chatId: '-100888999',
    chatTitle: 'VIP Gold Group',
  }, { userId: uid });

  assert.ok(activated);
  assert.equal(activated.status, 'active');
  assert.equal(activated.vipDays, 30);
  assert.equal(activated.autoRemove, true);
  assert.ok(Date.parse(activated.expiresAt) > Date.now());

  // 3. Simulate expired membership
  const stActive = loadState(uid);
  stActive.memberships[0].expiresAt = new Date(Date.now() - 3600_000).toISOString();
  saveState(stActive, uid);

  // 4. Run processExpiredMemberships with fake removeFn
  const removedCalls = [];
  const fakeRemoveFn = async ({ chatId, userId }) => {
    removedCalls.push({ chatId, userId });
    return { ok: true };
  };

  const sweep = await processExpiredMemberships(uid, {}, { removeFn: fakeRemoveFn });
  assert.equal(sweep.removed, 1);
  assert.equal(removedCalls.length, 1);
  assert.equal(String(removedCalls[0].userId), '998877');

  const stAfterSweep = loadState(uid);
  assert.equal(stAfterSweep.memberships[0].status, 'removed');
  const lastHistory = stAfterSweep.history[0];
  assert.equal(lastHistory.status, 'REMOVED_EXPIRED');
  assert.equal(lastHistory.outcome, 'left'); // maps to left!

  // 5. Customer renews -> renewMembership
  const renewed = renewMembership(stAfterSweep, {
    membershipId: stAfterSweep.memberships[0].id,
    addDays: 30,
    userId: uid,
  });
  assert.equal(renewed.status, 'active');
  assert.ok(Date.parse(renewed.expiresAt) > Date.now());

  // Test removeExpiredGroupMember calls ban + unban with only_if_banned: true
  const tgCalls = [];
  const fakeTgFetch = async (url, init) => {
    tgCalls.push({ url, body: JSON.parse(init.body) });
    return { json: async () => ({ ok: true, result: true }) };
  };
  await removeExpiredGroupMember({
    botToken: '123:ABC',
    chatId: '-100888999',
    userId: 998877,
    fetchImpl: fakeTgFetch,
  });
  assert.equal(tgCalls.length, 2);
  assert.match(tgCalls[0].url, /banChatMember/);
  assert.match(tgCalls[1].url, /unbanChatMember/);
  assert.equal(tgCalls[1].body.only_if_banned, true);
});

test('Saved Groups Profile Dropdown & HTTP API Routes', async () => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  try {
    // 1. Sign up user
    const signup = await fetch(`${base}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Charlie', email: 'charlie@example.com', password: 'password123' }),
    });
    const cookie = signup.headers.get('set-cookie').split(';')[0];
    const user = (await signup.json()).user;

    // 2. POST /api/groups/save (with title & memberCount mock)
    const saveRes = await fetch(`${base}/api/groups/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        chatId: '-1001239999',
        title: 'Premium Traders',
        username: 'premium_traders',
        memberCount: 2450,
        photoDataUrl: 'data:image/png;base64,mock',
        isAdmin: true,
        canInvite: true,
        select: true,
      }),
    });
    assert.equal(saveRes.status, 200);
    const savedGroupData = await saveRes.json();
    assert.equal(savedGroupData.group.title, 'Premium Traders');
    assert.equal(savedGroupData.group.memberCount, 2450);

    // 3. GET /api/status returns savedGroups, poolSummary, masked config
    const statusRes = await fetch(`${base}/api/status`, { headers: { Cookie: cookie } });
    assert.equal(statusRes.status, 200);
    const statusData = await statusRes.json();
    assert.equal(statusData.savedGroups.length, 1);
    assert.equal(statusData.savedGroups[0].title, 'Premium Traders');
    assert.ok(statusData.poolSummary);
    assert.equal(statusData.config.chatId, '-1001239999');

    // 4. Save second group and select it
    await fetch(`${base}/api/groups/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        chatId: '-1001238888',
        title: 'VIP Announcements',
        username: 'vip_announcements',
        memberCount: 520,
        select: false,
      }),
    });

    const selectRes = await fetch(`${base}/api/groups/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ chatId: '-1001238888' }),
    });
    assert.equal(selectRes.status, 200);
    const selectData = await selectRes.json();
    assert.equal(selectData.config.chatId, '-1001238888');

    // 5. POST /api/groups/remove
    const removeRes = await fetch(`${base}/api/groups/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ chatId: '-1001238888' }),
    });
    assert.equal(removeRes.status, 200);
    const removeData = await removeRes.json();
    assert.equal(removeData.savedGroups.length, 1);
    assert.equal(removeData.savedGroups[0].id, '-1001239999');

    // 6. Test MTProto account removal route
    upsertUserMtprotoAccount(user.id, {
      id: 'sim_1',
      label: 'SIM 1',
      phone: '+85512345678',
      sessionString: '1ABC...',
    });
    const remMtRes = await fetch(`${base}/api/telegram/mtproto/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ accountId: 'sim_1' }),
    });
    assert.equal(remMtRes.status, 200);
    const remMtData = await remMtRes.json();
    assert.equal(remMtData.config.mtprotoAccounts.length, 0);
  } finally {
    server.close();
  }
});
