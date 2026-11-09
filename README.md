# Tenh Gram · Telegram Safe Inviter & Member Activity

Standalone web app & API in a clean white + `#16537e` UI with **User Authentication (Sign In / Create Account)** so every account keeps its own saved invite history and Telegram settings across sessions, plus a **Collapsible Left Menu** (toggle between full labels and compact **icon-only mode**):

1. **Option 1 · Safe Link** — Dedicated view for **Bot Invite Link + Auto-Approve** (zero ban risk, visual safety mode cards, step pipeline, and explainer panel).
2. **Option 2 · Direct Invite** — Dedicated view for **MTProto Add Contact + Direct Invite** with 1h/24h/contact quota gauges, 1-click Auto fallback link generator, and automatic DM fallback.
3. **Activity & Status** — **1 unified menu** displaying all 4 statuses with tabs, search, method filter, and 1-click recovery actions:
   - **Invites / Links** (`LINK_CREATED`)
   - **Invited Success** (`AUTO_APPROVED`, `JOINED`, `DIRECT_INVITED`, `SENT_LINK_FALLBACK`)
   - **Failed** (`PRIVACY_RESTRICTED`, `PHONE_NOT_FOUND`, `FLOOD_WAIT`, `PEER_FLOOD`, `BOT_LINK_FAILED`)
   - **Customer Leaved** (`CUSTOMER_LEFT`, `REMOVED`)
4. **Integrate Telegram** — Save Bot Token, Group/Channel Chat ID, and MTProto credentials per account, verify Bot Admin permissions (`getMe` / `getChat` / `getChatMember`), toggle **Local Real-Time Listener (`getUpdates`)** for `localhost`, configure an HTTPS Webhook, or sign in to Option 2 via Phone + OTP.

## Quick Start

```powershell
cd C:\Users\TUF\telegram-safe-inviter
npm install
npm start
```

Open **http://localhost:3040**, create your account (or sign in) to unlock your saved workspace, and use the top-left collapse button on the menu anytime to switch between **icon-only** and **expanded** mode.
