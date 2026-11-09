/**
 * OPTION 2: MTProto Client API Safe Contact + Group/Channel Inviter
 * - Uses official Telegram Client protocol (GramJS `telegram` package)
 * - Supports adding by phone number (`contacts.ImportContacts`) or `@username`
 * - Enforces hourly/daily caps, random human jitter, FLOOD_WAIT backoff, and 24h PEER_FLOOD circuit breaker
 * - Automatically falls back to sending an Option 1 Invite Link DM if the target user has `USER_PRIVACY_RESTRICTED`
 * - Supports interactive browser login (OTP + optional 2FA) from the Integrate Telegram menu
 */

import {
  evaluateInviteSafety,
  getSafetyLimits,
  loadState,
  pickAvailablePoolAccount,
  recordAction,
} from './safetyState.js';

const clientPool = new Map();
const pendingLogins = new Map();

export function getMtprotoClientPoolSize() {
  return clientPool.size;
}

export async function resetMtprotoClient(userId = null, accountId = null) {
  if (userId && accountId) {
    const key = `${userId}:${accountId}`;
    const entry = clientPool.get(key);
    if (entry?.client) {
      try { await entry.client.disconnect(); } catch {}
    }
    clientPool.delete(key);
    return;
  }

  if (userId) {
    const prefix = `${userId}:`;
    for (const [k, entry] of clientPool.entries()) {
      if (k.startsWith(prefix)) {
        try { await entry?.client?.disconnect(); } catch {}
        clientPool.delete(k);
      }
    }
    return;
  }

  for (const [, entry] of clientPool.entries()) {
    try { await entry?.client?.disconnect(); } catch {}
  }
  clientPool.clear();
}

export async function getMtprotoClient(env = process.env, { userId = null, account = null } = {}) {
  const accountId = account?.id || 'primary';
  const apiId = Number(account?.apiId || env.TELEGRAM_API_ID);
  const apiHash = account?.apiHash || env.TELEGRAM_API_HASH;
  const sessionStr = account?.sessionString || env.TELEGRAM_STRING_SESSION || '';

  if (!apiId || !apiHash || !sessionStr) {
    throw new Error(
      'Option 2 requires TELEGRAM_API_ID, TELEGRAM_API_HASH, and a signed-in Telegram phone session in Integrate Telegram.'
    );
  }

  const cacheKey = `${userId || 'default'}:${accountId}`;
  const existing = clientPool.get(cacheKey);
  if (existing && existing.sessionString === sessionStr) {
    if (!existing.client.connected) await existing.client.connect();
    return existing.client;
  }

  if (existing?.client) {
    try { await existing.client.disconnect(); } catch {}
    clientPool.delete(cacheKey);
  }

  const { TelegramClient } = await import('telegram');
  const { StringSession } = await import('telegram/sessions/index.js');

  const client = new TelegramClient(new StringSession(sessionStr), apiId, apiHash, {
    connectionRetries: 3,
  });
  await client.connect();
  clientPool.set(cacheKey, { client, sessionString: sessionStr });
  return client;
}

export async function inspectMtprotoAccount(env = process.env, { userId = null, account = null } = {}) {
  const apiId = Number(account?.apiId || env.TELEGRAM_API_ID);
  const apiHash = account?.apiHash || env.TELEGRAM_API_HASH;
  const sessionStr = account?.sessionString || env.TELEGRAM_STRING_SESSION || '';
  if (!apiId || !apiHash || !sessionStr) {
    return { connected: false, error: 'Account: Not signed in' };
  }
  const client = await getMtprotoClient(env, { userId, account });
  const me = await client.getMe();
  return {
    connected: true,
    accountId: account?.id || 'primary',
    label: account?.label || me.firstName || 'Primary Account',
    user: {
      id: String(me.id),
      firstName: me.firstName || '',
      lastName: me.lastName || '',
      username: me.username || null,
      phone: me.phone ? `+${me.phone}` : (account?.phone || null),
    },
  };
}

export async function inspectMtprotoPool(env = process.env, { userId = null, accounts = [] } = {}) {
  if (!Array.isArray(accounts) || accounts.length === 0) {
    const single = await inspectMtprotoAccount(env, { userId }).catch(err => ({
      connected: false,
      error: err.message,
    }));
    return {
      ...single,
      accounts: single.connected ? [single] : [],
    };
  }

  const inspected = [];
  for (const acc of accounts) {
    try {
      const info = await inspectMtprotoAccount(env, { userId, account: acc });
      inspected.push(info);
    } catch (err) {
      inspected.push({
        connected: false,
        accountId: acc.id,
        label: acc.label || acc.phone || acc.id,
        error: err.message,
      });
    }
  }
  const firstConnected = inspected.find(x => x.connected) || inspected[0];
  return {
    connected: Boolean(inspected.some(x => x.connected)),
    user: firstConnected?.user || null,
    error: firstConnected?.connected ? null : (firstConnected?.error || 'Account: Not signed in'),
    accounts: inspected,
  };
}

export async function startMtprotoLogin({ apiId, apiHash, phoneNumber }) {
  const id = Number(apiId || process.env.TELEGRAM_API_ID);
  const hash = String(apiHash || process.env.TELEGRAM_API_HASH || '').trim();
  const phone = String(phoneNumber || '').trim();
  if (!id || !hash || !phone) {
    throw new Error('Provide API ID, API Hash, and phone number (with +country code).');
  }

  const { TelegramClient } = await import('telegram');
  const { StringSession } = await import('telegram/sessions/index.js');

  const client = new TelegramClient(new StringSession(''), id, hash, { connectionRetries: 3 });
  await client.connect();

  const sent = await client.sendCode({ apiId: id, apiHash: hash }, phone);
  const loginId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  pendingLogins.set(loginId, {
    client,
    apiId: id,
    apiHash: hash,
    phoneNumber: phone,
    phoneCodeHash: sent.phoneCodeHash,
    needsPassword: false,
    createdAt: Date.now(),
  });

  // Auto-clean stale pending logins after 10 minutes
  for (const [k, v] of pendingLogins.entries()) {
    if (Date.now() - v.createdAt > 600_000) {
      try { await v.client.disconnect(); } catch {}
      pendingLogins.delete(k);
    }
  }

  return {
    loginId,
    isCodeViaApp: Boolean(sent.isCodeViaApp),
    message: sent.isCodeViaApp
      ? 'Verification code sent to your Telegram app.'
      : 'Verification code sent via SMS.',
  };
}

export async function completeMtprotoLogin({ loginId, phoneCode = '', password = '' }) {
  const entry = pendingLogins.get(loginId);
  if (!entry) throw new Error('Login session expired. Request a new code.');

  const { Api } = await import('telegram');
  const { computeCheck } = await import('telegram/Password.js');

  let user = null;
  if (!entry.needsPassword) {
    const cleanCode = String(phoneCode || '').trim();
    if (!cleanCode) throw new Error('Enter the verification code Telegram sent you.');
    try {
      const res = await entry.client.invoke(
        new Api.auth.SignIn({
          phoneNumber: entry.phoneNumber,
          phoneCodeHash: entry.phoneCodeHash,
          phoneCode: cleanCode,
        })
      );
      user = res.user;
    } catch (err) {
      if (String(err.errorMessage || err.message).includes('SESSION_PASSWORD_NEEDED')) {
        entry.needsPassword = true;
        if (!password) {
          return { status: 'NEEDS_2FA_PASSWORD', message: 'Two-factor authentication is enabled. Enter your 2FA password.' };
        }
      } else {
        throw err;
      }
    }
  }

  if (entry.needsPassword) {
    const cleanPass = String(password || '');
    if (!cleanPass) {
      return { status: 'NEEDS_2FA_PASSWORD', message: 'Two-factor authentication is enabled. Enter your 2FA password.' };
    }
    const pwdInfo = await entry.client.invoke(new Api.account.GetPassword());
    const srp = await computeCheck(pwdInfo, cleanPass);
    const res = await entry.client.invoke(new Api.auth.CheckPassword({ password: srp }));
    user = res.user;
  }

  const sessionString = entry.client.session.save();
  try { await entry.client.disconnect(); } catch {}
  pendingLogins.delete(loginId);

  return {
    status: 'SIGNED_IN',
    apiId: String(entry.apiId),
    apiHash: entry.apiHash,
    sessionString,
    user: user ? { firstName: user.firstName || '', username: user.username || null, phone: user.phone || entry.phoneNumber } : null,
  };
}

export async function safeMtprotoContactAndInvite({
  phone = '',
  username = '',
  firstName = 'Customer',
  lastName = '',
  chatId = process.env.TELEGRAM_CHAT_ID,
  fallbackInviteLink = '',
  userId = null,
  env = process.env,
  accounts = [],
  accountId = null,
  now = Date.now(),
  clientOverride = null,
  clientMapOverride = null,
  apiClassOverride = null,
} = {}) {
  const cleanPhone = String(phone).trim();
  const cleanUsername = String(username).trim().replace(/^@/, '');
  const targetLabel = cleanPhone || `@${cleanUsername}`;

  if (!cleanPhone && !cleanUsername) {
    throw new Error('Provide either a phone number (e.g. +85512345678) or a @username.');
  }
  if (!chatId) {
    throw new Error('TELEGRAM_CHAT_ID (target group or supergroup) is required.');
  }

  const limits = getSafetyLimits(env);
  const state = loadState(userId);
  const pool = Array.isArray(accounts) ? accounts.filter(Boolean) : [];
  let chosenAccount = null;
  let poolSize = 1;

  if (pool.length > 0) {
    const targetList = accountId ? pool.filter(a => a.id === accountId) : pool;
    const picked = pickAvailablePoolAccount(state, targetList, { addContact: Boolean(cleanPhone), limits, now });
    if (!picked.account) {
      const err = new Error(picked.safety.message);
      err.code = picked.safety.code;
      err.stats = picked.safety.stats;
      throw err;
    }
    chosenAccount = picked.account;
    poolSize = pool.length;
  } else {
    const safety = evaluateInviteSafety(state, { addContact: Boolean(cleanPhone), limits, now });
    if (!safety.allowed) {
      const err = new Error(safety.message);
      err.code = safety.code;
      err.stats = safety.stats;
      throw err;
    }
  }

  const activeAccountId = chosenAccount?.id || null;
  const activeAccountLabel = chosenAccount ? (chosenAccount.label || chosenAccount.phone || chosenAccount.id) : null;

  let client = clientOverride;
  if (!client && activeAccountId && clientMapOverride && clientMapOverride[activeAccountId]) {
    client = clientMapOverride[activeAccountId];
  }
  if (!client) {
    client = await getMtprotoClient(env, { userId, account: chosenAccount });
  }
  const Api = apiClassOverride || (await import('telegram')).Api;

  let userEntity = null;
  let contactAdded = false;

  try {
    if (cleanPhone) {
      const importResult = await client.invoke(
        new Api.contacts.ImportContacts({
          contacts: [
            new Api.InputPhoneContact({
              clientId: BigInt(now),
              phone: cleanPhone,
              firstName: firstName || 'Customer',
              lastName: lastName || '',
            }),
          ],
        })
      );

      if (!importResult?.users?.length) {
        recordAction(state, {
          option: 'OPTION_2_MTPROTO',
          outcome: 'failed',
          target: cleanPhone,
          name: firstName || cleanPhone,
          phone: cleanPhone,
          status: 'PHONE_NOT_FOUND',
          reason: 'Phone number not registered on Telegram or hidden by privacy settings.',
          accountLabel: activeAccountLabel,
          countedContact: true,
        }, { limits, userId, now, accountId: activeAccountId, poolSize });
        return {
          option: 'OPTION_2_MTPROTO',
          outcome: 'failed',
          status: 'PHONE_NOT_FOUND',
          accountId: activeAccountId,
          accountLabel: activeAccountLabel,
          message: 'Phone number was not found on Telegram or hides phone discovery. Send them an Option 1 Invite Link instead.',
          fallbackInviteLink: fallbackInviteLink || null,
        };
      }
      userEntity = importResult.users[0];
      contactAdded = true;
    } else {
      userEntity = await client.getEntity(cleanUsername);
      await client.invoke(
        new Api.contacts.AddContact({
          id: userEntity,
          firstName: firstName || cleanUsername,
          lastName: lastName || '',
          phone: '',
          addPhonePrivacyException: false,
        })
      );
      contactAdded = true;
    }

    const invitedUserId = userEntity?.id !== undefined && userEntity?.id !== null ? String(userEntity.id) : null;
    const channelEntity = await client.getEntity(chatId);

    // Check if the user is already inside the group so we don't waste invite quota
    let alreadyInGroup = false;
    if (Api.channels?.GetParticipant) {
      try {
        const existing = await client.invoke(
          new Api.channels.GetParticipant({
            channel: channelEntity,
            participant: userEntity,
          })
        );
        const clsName = String(existing?.participant?.className || '');
        if (existing?.participant && !clsName.includes('Left') && !clsName.includes('Banned')) {
          alreadyInGroup = true;
        }
      } catch {
        // Throws USER_NOT_PARTICIPANT when not yet in group -> safe to proceed
      }
    }

    if (alreadyInGroup) {
      return {
        option: 'OPTION_2_MTPROTO',
        outcome: 'success',
        skippedAlreadyMember: true,
        status: 'ALREADY_IN_GROUP',
        contactAdded,
        target: targetLabel,
        invitedUserId,
        accountId: activeAccountId,
        accountLabel: activeAccountLabel,
        message: 'User is already a member of this group — skipped to save invite quota.',
      };
    }

    await client.invoke(
      new Api.channels.InviteToChannel({
        channel: channelEntity,
        users: [userEntity],
      })
    );

    const updated = recordAction(state, {
      option: 'OPTION_2_MTPROTO',
      outcome: 'success',
      target: targetLabel,
      name: firstName || targetLabel,
      phone: cleanPhone || null,
      username: cleanUsername || userEntity?.username || null,
      userId: invitedUserId,
      status: 'DIRECT_INVITED',
      accountLabel: activeAccountLabel,
      contactAdded,
      countedInvite: true,
      countedContact: Boolean(cleanPhone),
    }, { limits, userId, now, accountId: activeAccountId, poolSize });

    const nextAt = (activeAccountId && updated.accountSafety?.[activeAccountId]?.nextAllowedActionAt)
      || updated.nextAllowedActionAt
      || now;

    return {
      option: 'OPTION_2_MTPROTO',
      outcome: 'success',
      status: 'DIRECT_INVITED',
      contactAdded,
      target: targetLabel,
      invitedUserId,
      username: cleanUsername || userEntity?.username || null,
      accountId: activeAccountId,
      accountLabel: activeAccountLabel,
      nextAllowedActionAt: new Date(nextAt).toISOString(),
    };
  } catch (err) {
    const rawCode = String(err?.errorMessage || err?.message || 'UNKNOWN_ERROR');
    const invitedUserId = userEntity?.id !== undefined && userEntity?.id !== null ? String(userEntity.id) : null;

    if (rawCode.includes('USER_ALREADY_PARTICIPANT')) {
      return {
        option: 'OPTION_2_MTPROTO',
        outcome: 'success',
        skippedAlreadyMember: true,
        status: 'ALREADY_IN_GROUP',
        contactAdded,
        target: targetLabel,
        invitedUserId,
        accountId: activeAccountId,
        accountLabel: activeAccountLabel,
        message: 'User is already in this group — skipped without using invite quota.',
      };
    }

    if (
      rawCode.includes('USER_PRIVACY_RESTRICTED') ||
      rawCode.includes('USER_NOT_MUTUAL_CONTACT') ||
      rawCode.includes('USERS_TOO_MUCH') ||
      rawCode.includes('CHAT_ADMIN_REQUIRED')
    ) {
      let dmSent = false;
      if (fallbackInviteLink && userEntity) {
        try {
          await client.sendMessage(userEntity, {
            message: `Hi ${firstName || 'there'}! Tap this invite link to join our group: ${fallbackInviteLink}`,
          });
          dmSent = true;
        } catch {
          dmSent = false;
        }
      }

      recordAction(state, {
        option: 'OPTION_2_MTPROTO',
        outcome: dmSent ? 'success' : 'failed',
        target: targetLabel,
        name: firstName || targetLabel,
        phone: cleanPhone || null,
        username: cleanUsername || userEntity?.username || null,
        userId: invitedUserId,
        status: dmSent ? 'SENT_LINK_FALLBACK' : 'PRIVACY_RESTRICTED',
        reason: dmSent
          ? `Privacy blocked direct add (${rawCode}); sent safe invite link DM instead.`
          : `User privacy blocks direct adds (${rawCode}). Send an Option 1 link manually.`,
        inviteLink: dmSent ? fallbackInviteLink : null,
        accountLabel: activeAccountLabel,
        contactAdded,
        countedInvite: true,
        countedContact: Boolean(cleanPhone),
      }, { limits, userId, now, accountId: activeAccountId, poolSize });

      return {
        option: 'OPTION_2_MTPROTO',
        outcome: dmSent ? 'success' : 'failed',
        status: dmSent ? 'SENT_LINK_FALLBACK' : 'PRIVACY_RESTRICTED',
        contactAdded,
        reason: rawCode,
        dmSent,
        invitedUserId,
        accountId: activeAccountId,
        accountLabel: activeAccountLabel,
        fallbackInviteLink: fallbackInviteLink || null,
        message: dmSent
          ? `User's privacy blocks direct group adds (${rawCode}), so we added them to contacts and DM'd the safe invite link.`
          : `User's privacy blocks direct group adds (${rawCode}). Share an Option 1 Invite Link with them.`,
      };
    }

    const floodMatch = rawCode.match(/FLOOD_WAIT_(\d+)/);
    if (floodMatch) {
      const waitSeconds = Number(floodMatch[1]) || 300;
      const afterState = recordAction(state, {
        option: 'OPTION_2_MTPROTO',
        outcome: 'failed',
        target: targetLabel,
        name: firstName || targetLabel,
        phone: cleanPhone || null,
        username: cleanUsername || null,
        status: `FLOOD_WAIT_${waitSeconds}S`,
        reason: `Telegram asked to wait ${waitSeconds}s before retrying.`,
        accountLabel: activeAccountLabel,
        floodWaitSeconds: waitSeconds,
      }, { limits, userId, now, accountId: activeAccountId, poolSize });
      const poolRemainingHealthy = poolSize > 1
        ? Boolean(pickAvailablePoolAccount(afterState, pool, { addContact: Boolean(cleanPhone), limits, now }).account)
        : false;
      return {
        option: 'OPTION_2_MTPROTO',
        outcome: 'failed',
        status: 'FLOOD_WAIT',
        accountId: activeAccountId,
        accountLabel: activeAccountLabel,
        poolRemainingHealthy,
        retryAfterSeconds: Math.ceil(waitSeconds * 1.2),
        message: `Telegram requested a ${waitSeconds}s pause on ${activeAccountLabel || 'account'}. Safety timer engaged.`,
      };
    }

    if (rawCode.includes('PEER_FLOOD')) {
      const afterState = recordAction(state, {
        option: 'OPTION_2_MTPROTO',
        outcome: 'failed',
        target: targetLabel,
        name: firstName || targetLabel,
        phone: cleanPhone || null,
        username: cleanUsername || null,
        status: 'PEER_FLOOD',
        reason: `Telegram PEER_FLOOD triggered — ${activeAccountLabel || 'Option 2 account'} paused for 24h.`,
        accountLabel: activeAccountLabel,
        circuitBreakHours: 24,
        circuitReason: 'PEER_FLOOD',
      }, { limits, userId, now, accountId: activeAccountId, poolSize });
      const poolRemainingHealthy = poolSize > 1
        ? Boolean(pickAvailablePoolAccount(afterState, pool, { addContact: Boolean(cleanPhone), limits, now }).account)
        : false;
      return {
        option: 'OPTION_2_MTPROTO',
        outcome: 'failed',
        status: 'CIRCUIT_BREAK_24H',
        accountId: activeAccountId,
        accountLabel: activeAccountLabel,
        poolRemainingHealthy,
        message: poolRemainingHealthy
          ? `Telegram returned PEER_FLOOD on ${activeAccountLabel || 'helper account'} (paused 24h). Rotating to next healthy pool account.`
          : 'Telegram returned PEER_FLOOD. Option 2 is automatically paused for 24 hours to protect your account. Use Option 1 (Bot Invite Link) in the meantime.',
      };
    }

    recordAction(state, {
      option: 'OPTION_2_MTPROTO',
      outcome: 'failed',
      target: targetLabel,
      name: firstName || targetLabel,
      phone: cleanPhone || null,
      username: cleanUsername || null,
      status: 'FAILED',
      reason: rawCode,
      accountLabel: activeAccountLabel,
      contactAdded,
    }, { limits, userId, now, accountId: activeAccountId, poolSize });

    throw err;
  }
}
