/**
 * OPTION 1: Official Telegram Bot API Safe Inviter (100% Ban-Proof)
 * - Generates tracked invite links (`createChatInviteLink`)
 * - Auto-approves `chat_join_request` updates and sends welcome DMs
 * - Tracks `chat_member` updates for Invited Success (joined) & Customer Left
 * - Inspects Bot/Group/Channel permissions and supports Webhook or Local Polling
 */

async function callBotApi(botToken, method, payload, fetchImpl = fetch) {
  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN is required for Option 1 (Bot API).');
  const response = await fetchImpl(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload ?? {}),
  });
  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.description || `Telegram Bot API ${method} failed.`);
  }
  return data.result;
}

export async function createBotSafeInviteLink({
  botToken = process.env.TELEGRAM_BOT_TOKEN,
  chatId = process.env.TELEGRAM_CHAT_ID,
  label = 'Customer Invite',
  mode = 'join_request', // 'join_request' (recommended) | 'single_use'
  expireHours = 168,
  memberLimit = 1,
  fetchImpl = fetch,
} = {}) {
  if (!chatId) throw new Error('TELEGRAM_CHAT_ID (group or channel ID) is required.');

  const expireDate = Math.floor(Date.now() / 1000) + Math.max(1, Number(expireHours)) * 3600;
  const payload = {
    chat_id: chatId,
    name: String(label).slice(0, 32),
    expire_date: expireDate,
  };

  if (mode === 'join_request') {
    payload.creates_join_request = true;
  } else {
    payload.member_limit = Math.max(1, Math.min(99999, Number(memberLimit) || 1));
  }

  const result = await callBotApi(botToken, 'createChatInviteLink', payload, fetchImpl);
  return {
    option: 'OPTION_1_BOT_LINK',
    inviteLink: result.invite_link,
    name: result.name || label,
    createsJoinRequest: Boolean(result.creates_join_request),
    memberLimit: result.member_limit ?? null,
    expireDate: result.expire_date ? new Date(result.expire_date * 1000).toISOString() : null,
  };
}

export async function handleBotJoinRequestWebhook(update, {
  botToken = process.env.TELEGRAM_BOT_TOKEN,
  welcomeTemplate = process.env.TELEGRAM_WELCOME_TEXT || 'Welcome {name}! Your request to join has been approved.',
  fetchImpl = fetch,
} = {}) {
  const req = update?.chat_join_request;
  if (!req) return { handled: false };

  const chatId = req.chat.id;
  const userId = req.from.id;
  const firstName = req.from.first_name || 'Customer';
  const lastName = req.from.last_name || '';
  const inviteName = req.invite_link?.name || 'direct';

  await callBotApi(botToken, 'approveChatJoinRequest', {
    chat_id: chatId,
    user_id: userId,
  }, fetchImpl);

  let welcomed = false;
  if (welcomeTemplate) {
    try {
      await callBotApi(botToken, 'sendMessage', {
        chat_id: userId,
        text: welcomeTemplate.replace('{name}', firstName),
      }, fetchImpl);
      welcomed = true;
    } catch {
      welcomed = false;
    }
  }

  return {
    handled: true,
    type: 'join_request',
    outcome: 'success',
    status: 'AUTO_APPROVED',
    approvedUserId: userId,
    firstName,
    lastName,
    username: req.from.username || null,
    chatId: String(chatId),
    chatTitle: req.chat.title || String(chatId),
    inviteName,
    inviteLink: req.invite_link?.invite_link || null,
    welcomed,
  };
}

function isMemberActive(member) {
  if (!member) return false;
  if (['member', 'administrator', 'creator'].includes(member.status)) return true;
  if (member.status === 'restricted' && member.is_member) return true;
  return false;
}

export async function handleTelegramUpdate(update, opts = {}) {
  if (update?.chat_join_request) {
    return handleBotJoinRequestWebhook(update, opts);
  }

  const cm = update?.chat_member;
  if (cm) {
    const wasMember = isMemberActive(cm.old_chat_member);
    const nowMember = isMemberActive(cm.new_chat_member);
    const user = cm.new_chat_member?.user || cm.old_chat_member?.user || cm.from;
    const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Customer';

    if (!wasMember && nowMember) {
      return {
        handled: true,
        type: 'member_joined',
        outcome: 'success',
        status: 'JOINED',
        userId: user?.id,
        firstName: displayName,
        username: user?.username || null,
        chatId: String(cm.chat.id),
        chatTitle: cm.chat.title || String(cm.chat.id),
        inviteName: cm.invite_link?.name || null,
        inviteLink: cm.invite_link?.invite_link || null,
      };
    }

    if (wasMember && !nowMember) {
      const removed = cm.new_chat_member?.status === 'kicked';
      return {
        handled: true,
        type: 'member_left',
        outcome: 'left',
        status: removed ? 'REMOVED' : 'CUSTOMER_LEFT',
        userId: user?.id,
        firstName: displayName,
        username: user?.username || null,
        chatId: String(cm.chat.id),
        chatTitle: cm.chat.title || String(cm.chat.id),
        reason: removed
          ? `Removed/banned by admin (${cm.from?.first_name || 'admin'})`
          : 'Customer left group/channel',
      };
    }
  }

  return { handled: false };
}

export async function inspectBotIntegration({
  botToken = process.env.TELEGRAM_BOT_TOKEN,
  chatId = process.env.TELEGRAM_CHAT_ID,
  fetchImpl = fetch,
} = {}) {
  if (!botToken) {
    return { connected: false, error: 'TELEGRAM_BOT_TOKEN is not set.' };
  }

  const bot = await callBotApi(botToken, 'getMe', {}, fetchImpl);
  const webhook = await callBotApi(botToken, 'getWebhookInfo', {}, fetchImpl);

  let chat = null;
  let memberCount = null;
  let botMember = null;
  let photoDataUrl = null;
  let chatError = null;

  if (chatId) {
    try {
      chat = await callBotApi(botToken, 'getChat', { chat_id: chatId }, fetchImpl);
      try {
        memberCount = await callBotApi(botToken, 'getChatMemberCount', { chat_id: chatId }, fetchImpl);
      } catch {
        memberCount = null;
      }
      try {
        botMember = await callBotApi(botToken, 'getChatMember', { chat_id: chatId, user_id: bot.id }, fetchImpl);
      } catch {
        botMember = null;
      }
      if (chat?.photo?.small_file_id) {
        try {
          const fileInfo = await callBotApi(botToken, 'getFile', { file_id: chat.photo.small_file_id }, fetchImpl);
          if (fileInfo?.file_path) {
            const imgRes = await fetchImpl(`https://api.telegram.org/file/bot${botToken}/${fileInfo.file_path}`);
            if (imgRes && typeof imgRes.arrayBuffer === 'function') {
              const buf = Buffer.from(await imgRes.arrayBuffer());
              if (buf.length > 0 && buf.length < 250_000) {
                const mime = String(fileInfo.file_path).toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
                photoDataUrl = `data:${mime};base64,${buf.toString('base64')}`;
              }
            }
          }
        } catch {
          photoDataUrl = null;
        }
      }
    } catch (err) {
      chatError = err.message;
    }
  }

  const isAdmin = ['administrator', 'creator'].includes(botMember?.status);
  const canInvite = botMember?.status === 'creator' || Boolean(botMember?.can_invite_users);

  return {
    connected: true,
    bot: { id: bot.id, username: bot.username, firstName: bot.first_name },
    chat: chat
      ? {
          id: String(chat.id),
          title: chat.title || chat.username || String(chat.id),
          type: chat.type,
          username: chat.username || null,
          description: chat.description || '',
          memberCount,
          photoDataUrl,
          isAdmin,
          canInvite,
          botStatus: botMember?.status || 'unknown',
        }
      : null,
    chatError,
    webhook: {
      url: webhook.url || '',
      pendingUpdateCount: webhook.pending_update_count || 0,
      allowedUpdates: webhook.allowed_updates || [],
    },
  };
}

export async function removeExpiredGroupMember({
  botToken = process.env.TELEGRAM_BOT_TOKEN,
  chatId,
  userId,
  fetchImpl = fetch,
} = {}) {
  if (!chatId) throw new Error('Target group/channel ID is required.');
  if (!userId) throw new Error('Telegram user ID is required to remove an expired member.');
  const numericUserId = /^\d+$/.test(String(userId)) ? Number(userId) : userId;

  await callBotApi(botToken, 'banChatMember', {
    chat_id: chatId,
    user_id: numericUserId,
  }, fetchImpl);

  // Immediately unban so the customer is removed cleanly without blocking future VIP renewals
  await callBotApi(botToken, 'unbanChatMember', {
    chat_id: chatId,
    user_id: numericUserId,
    only_if_banned: true,
  }, fetchImpl);

  return { ok: true, chatId: String(chatId), userId: String(numericUserId) };
}

export async function setupBotWebhook({
  botToken = process.env.TELEGRAM_BOT_TOKEN,
  url,
  fetchImpl = fetch,
} = {}) {
  if (!url) throw new Error('HTTPS webhook URL is required.');
  return callBotApi(
    botToken,
    'setWebhook',
    {
      url,
      allowed_updates: ['message', 'chat_join_request', 'chat_member', 'my_chat_member'],
    },
    fetchImpl
  );
}

export async function clearBotWebhook({
  botToken = process.env.TELEGRAM_BOT_TOKEN,
  fetchImpl = fetch,
} = {}) {
  return callBotApi(botToken, 'deleteWebhook', { drop_pending_updates: false }, fetchImpl);
}

export async function fetchBotUpdates({
  botToken = process.env.TELEGRAM_BOT_TOKEN,
  offset = 0,
  timeout = 0,
  fetchImpl = fetch,
} = {}) {
  return callBotApi(
    botToken,
    'getUpdates',
    {
      offset,
      timeout,
      limit: 50,
      allowed_updates: ['chat_join_request', 'chat_member', 'my_chat_member'],
    },
    fetchImpl
  );
}
