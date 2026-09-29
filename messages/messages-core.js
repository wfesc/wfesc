(() => {
"use strict";

/*
WFESC MESSAGES CORE
FINAL FAST / STABLE VERSION

Cursor Pagination
Infinite Message Loading
Internal Diagnostic Panel
Supabase
Current User
Conversations
Open Conversation From Latest Message
No Visible Jump
Smooth Slide Up
Realtime
Typing
Duplicate Protection
Optimistic + Realtime Reconciliation
Message Settings
Black Screen Protection
Supabase State Reload
Soft Delete Support
Conversation Refresh
Activity Contact Normalization
Chat Header Interface
Block Protection
Typing Block Protection
Realtime Block Protection
*/

/* =========================================================
SUPABASE
========================================================= */

const SUPABASE_URL =
"https://mcgbzfgbaxwmutniorlw.supabase.co";

const SUPABASE_KEY =
"sb_publishable_V9Ha2JDWmhox-XMzj1SK_w_6p5pAK5L";

const client =
window.WFESCSupabase ||
window.supabase?.createClient(
SUPABASE_URL,
SUPABASE_KEY
);

if (!client) {

console.error(
"WFESC: Supabase client لم يتم تحميله."
);

return;

}

/* =========================================================
CONSTANTS
========================================================= */

const SUPPORT_AVATAR =
"./sborts-wfesc-help.jpg";

const SUPPORT_NAME =
"تواصل مع فريق الدعم الشامل";

const DEFAULT_AVATAR =
"data:image/svg+xml;charset=UTF-8," +
encodeURIComponent(`
<svg
xmlns="http://www.w3.org/2000/svg"
width="200"
height="200"
viewBox="0 0 200 200"
>
<rect
width="200"
height="200"
rx="100"
fill="#111"
/>
<circle
cx="100"
cy="75"
r="34"
fill="#777"
/>
<path
d="M42 174c8-35 30-53 58-53s50 18 58 53"
fill="#777"
/>
</svg>
`);

const TYPING_REMOTE_TIMEOUT =
2600;

const MESSAGE_PAGE_SIZE =
50;

const MESSAGE_TOP_THRESHOLD =
80;

const MESSAGE_CACHE_TIME =
5 * 60 * 1000;

const CONVERSATION_REFRESH_DEBOUNCE =
120;

/* =========================================================
STATE
========================================================= */

let currentUser = null;
let currentConversationId = null;
let currentConversationContact = null;
let conversations = [];
let currentMessages = [];

let messageChannel = null;
let typingChannel = null;
let presenceChannel = null;

let initialized = false;
let initializationPromise = null;

let conversationLoadToken = 0;

let typingTimer = null;
let isTyping = false;

let typingUsers = new Set();
let typingUserTimers = new Map();

let realtimeStarted = false;
let realtimeStarting = false;
let realtimeConversationId = null;

let lastRenderedMessageId = null;
let openingConversation = false;

/* =========================================================
PERFORMANCE STATE
========================================================= */

const conversationMessagesCache =
new Map();

const conversationContactCache =
new Map();

let conversationRefreshTimer =
null;

let conversationRefreshScheduled =
false;

let backgroundMessageRefreshes =
new Map();

/* =========================================================
INFINITE MESSAGE LOADING STATE
========================================================= */

let loadingOlderMessages = false;
let hasOlderMessages = true;
let messagesScrollListenerAttached = false;
let olderMessagesLoadToken = 0;

/* =========================================================
DOM
========================================================= */

const page =
document.getElementById(
"messagesPage"
);

const conversationList =
document.getElementById(
"conversationList"
);

const searchSection =
document.getElementById(
"searchSection"
);

const chatView =
document.getElementById(
"chatView"
);

const chatMessages =
document.getElementById(
"chatMessages"
);

const backChatButton =
document.getElementById(
"backChatButton"
);

const messageInput =
document.getElementById(
"messageInput"
);

/* =========================================================
BLOCK MODULE
========================================================= */

function getBlockModule() {

return window.WFESC_MESSAGES_BLOCK || null;

}

async function isCurrentUserBlockedBy(
userId
) {

if (!userId) {
return false;
}

const block =
getBlockModule();

if (
!block ||
typeof block.isBlockedBy !==
"function"
) {
return false;
}

try {

return Boolean(
await block.isBlockedBy(
userId
)
);

} catch (error) {

console.warn(
"WFESC CORE block check:",
error
);

return false;

}

}

async function isCurrentUserBlocking(
userId
) {

if (!userId) {
return false;
}

const block =
getBlockModule();

if (
!block ||
typeof block.isBlocked !==
"function"
) {
return false;
}

try {

return Boolean(
await block.isBlocked(
userId
)
);

} catch (error) {

console.warn(
"WFESC CORE blocking check:",
error
);

return false;

}

}

/* =========================================================
BLOCK USER ID HELPER
========================================================= */

function getContactUserId(
contact
) {

if (!contact) {
return null;
}

return (
contact.user_id ??
contact.userId ??
contact.profile_id ??
contact.profileId ??
contact.contact_id ??
contact.contactId ??
contact.id ??
contact.user?.id ??
contact.profile?.id ??
null
);

}

/* =========================================================
CURRENT CONVERSATION BLOCK STATE
========================================================= */

async function getCurrentConversationBlockState() {

const contact =
currentConversationContact;

if (
!contact ||
contact.is_support
) {

return {

blocked: false,
blockedBy: false,
blockedByMe: false,
userId: null

};

}

const userId =
getContactUserId(
contact
);

if (!userId) {

return {

blocked: false,
blockedBy: false,
blockedByMe: false,
userId: null

};

}

const [
blockedBy,
blockedByMe
] = await Promise.all([

isCurrentUserBlockedBy(
userId
),

isCurrentUserBlocking(
userId
)

]);

return {

blocked:
Boolean(
blockedBy ||
blockedByMe
),

blockedBy:
Boolean(
blockedBy
),

blockedByMe:
Boolean(
blockedByMe
),

userId

};

}

/*
إذا الطرف الآخر قام بحظر المستخدم الحالي:

لا نسمح للـCore بفتح المحادثة.

أما إذا المستخدم الحالي هو الذي قام بالحظر:

نسمح بفتح المحادثة القديمة.
*/

async function canOpenConversationByBlock(
contact
) {

if (!contact) {

return {
allowed: true,
blockedBy: false,
blockedByMe: false
};

}

if (contact.is_support) {

return {
allowed: true,
blockedBy: false,
blockedByMe: false
};

}

const normalized =
normalizeContact(
contact
);

const userId =
normalized.user_id;

if (!userId) {

return {
allowed: true,
blockedBy: false,
blockedByMe: false
};

}

const blockedBy =
await isCurrentUserBlockedBy(
userId
);

if (blockedBy) {

return {
allowed: false,
blockedBy: true,
blockedByMe: false
};

}

const blockedByMe =
await isCurrentUserBlocking(
userId
);

return {
allowed: true,
blockedBy: false,
blockedByMe
};

}

/*
يمنع الرسائل الجديدة القادمة من شخص قام
بحظر المستخدم الحالي أو من شخص قام المستخدم
الحالي بحظره.

هذا لا يحذف التاريخ القديم.
*/

async function shouldIgnoreRealtimeMessage(
message
) {

if (!message) {
return false;
}

const senderId =
getMessageSenderId(
message
);

if (!senderId) {
return false;
}

if (
currentUser?.id &&
String(senderId) ===
String(currentUser.id)
) {

return false;

}

const block =
getBlockModule();

if (!block) {
return false;
}

try {

if (
typeof block.isBlockedBy ===
"function"
) {

const blockedBy =
await block.isBlockedBy(
senderId
);

if (blockedBy) {
return true;
}

}

if (
typeof block.isBlocked ===
"function"
) {

const blockedByMe =
await block.isBlocked(
senderId
);

if (blockedByMe) {
return true;
}

}

} catch (error) {

console.warn(
"WFESC CORE realtime block check:",
error
);

}

return false;

}

/* =========================================================
DIAGNOSTIC PANEL
========================================================= */

function wfescDebugShow(
title,
details = ""
) {

try {

let panel =
document.getElementById(
"wfescDebugPanel"
);

if (!panel) {

panel =
document.createElement(
"div"
);

panel.id =
"wfescDebugPanel";

panel.dir =
"rtl";

panel.style.cssText = `
position:fixed;
left:10px;
right:10px;
bottom:10px;
z-index:999999;
background:#080808;
color:#fff;
border:1px solid #ff4444;
border-radius:14px;
padding:14px;
box-shadow:0 10px 40px rgba(0,0,0,.8);
font-family:Arial,Tahoma,sans-serif;
max-height:70vh;
overflow:auto;
direction:rtl;
`;

document.body.appendChild(
panel
);

}

const safeTitle =
escapeHtml(
title
);

const safeDetails =
escapeHtml(
details
);

panel.innerHTML = `
<div style="
display:flex;
align-items:center;
justify-content:space-between;
gap:10px;
margin-bottom:10px;
">
<strong style="
color:#ff5555;
font-size:15px;
">
⚠️ WFESC تشخيص الخطأ
</strong>

<button
id="wfescDebugClose"
type="button"
style="
border:0;
background:#222;
color:#fff;
border-radius:8px;
padding:7px 12px;
cursor:pointer;
">
إغلاق
</button>
</div>

<div style="
font-weight:bold;
margin-bottom:8px;
color:#fff;
">
${safeTitle}
</div>

<pre
id="wfescDebugText"
style="
white-space:pre-wrap;
word-break:break-word;
direction:ltr;
text-align:left;
background:#111;
color:#ddd;
border:1px solid #292929;
border-radius:10px;
padding:10px;
font-size:12px;
line-height:1.6;
max-height:40vh;
overflow:auto;
margin:0;
"
>${safeDetails}</pre>

<button
id="wfescDebugCopy"
type="button"
style="
width:100%;
margin-top:10px;
border:0;
border-radius:10px;
padding:10px;
background:#fff;
color:#000;
font-weight:bold;
cursor:pointer;
">
نسخ الخطأ
</button>
`;

const closeButton =
document.getElementById(
"wfescDebugClose"
);

if (closeButton) {

closeButton.onclick =
() => {
panel.remove();
};

}

const copyButton =
document.getElementById(
"wfescDebugCopy"
);

if (copyButton) {

copyButton.onclick =
async () => {

try {

await navigator.clipboard.writeText(
`${title}\n\n${details}`
);

copyButton.textContent =
"تم النسخ ✓";

setTimeout(
() => {

if (copyButton) {

copyButton.textContent =
"نسخ الخطأ";

}

},
1500
);

} catch (error) {

copyButton.textContent =
"تعذر النسخ";

}

};

}

console.error(
"WFESC DEBUG:",
title,
details
);

} catch (panelError) {

console.error(
"WFESC diagnostic panel error:",
panelError
);

}

}

function wfescDebugError(
title,
error,
extra = {}
) {

let errorText = "";

try {

if (
error instanceof Error
) {

errorText =
error.stack ||
error.message ||
String(error);

} else if (
typeof error === "object" &&
error !== null
) {

errorText =
JSON.stringify(
error,
null,
2
);

} else {

errorText =
String(
error ?? ""
);

}

} catch (_) {

errorText =
String(
error ?? ""
);

}

let extraText = "";

try {

extraText =
JSON.stringify(
extra,
null,
2
);

} catch (_) {

extraText =
String(
extra
);

}

wfescDebugShow(
title,
`${errorText}

---

${extraText}`
);

}

/* =========================================================
GLOBAL ERROR DIAGNOSTICS
========================================================= */

window.addEventListener(
"error",
event => {

if (!event) {
return;
}

const message =
event.message ||
"Unknown JavaScript error";

const file =
event.filename ||
"";

const line =
event.lineno ||
"";

const column =
event.colno ||
"";

wfescDebugShow(
"JavaScript Error",
JSON.stringify(
{
message,
file,
line,
column
},
null,
2
)
);

}
);

window.addEventListener(
"unhandledrejection",
event => {

const reason =
event?.reason;

wfescDebugError(
"Unhandled Promise Rejection",
reason,
{
current_user:
currentUser?.id ||
null,

current_conversation:
currentConversationId ||
null
}
);

}
);

/* =========================================================
OPEN ANIMATION
========================================================= */

function ensureChatOpenAnimation() {

const styleId =
"wfesc-chat-open-animation-style";

if (
document.getElementById(
styleId
)
) {
return;
}

const style =
document.createElement(
"style"
);

style.id =
styleId;

style.textContent = `
@keyframes wfescChatSlideUp {

0% {
opacity:0;
transform:
translate3d(
0,
22px,
0
);
}

45% {
opacity:.72;
}

100% {
opacity:1;
transform:
translate3d(
0,
0,
0
);
}
}

#chatView.wfesc-chat-opening {

animation:
wfescChatSlideUp
.28s
cubic-bezier(
.16,
1,
.3,
1
)
both;

will-change:
transform,
opacity;
}

@media (
prefers-reduced-motion: reduce
) {

#chatView.wfesc-chat-opening {

animation:
none !important;

opacity:
1 !important;

transform:
none !important;
}
}
`;

document.head.appendChild(
style
);

}

ensureChatOpenAnimation();

/* =========================================================
HELPERS
========================================================= */

function escapeHtml(value) {

return String(
value ?? ""
)
.replace(
/&/g,
"&amp;"
)
.replace(
/</g,
"&lt;"
)
.replace(
/>/g,
"&gt;"
)
.replace(
/"/g,
"&quot;"
)
.replace(
/'/g,
"&#039;"
);

}

function formatTime(value) {

if (!value) {
return "";
}

const date =
new Date(value);

if (
Number.isNaN(
date.getTime()
)
) {
return "";
}

return date.toLocaleTimeString(
"ar-IQ",
{
hour:
"2-digit",
minute:
"2-digit"
}
);

}

/* =========================================================
CONTACT PLACEHOLDER HELPERS
========================================================= */

function normalizeTextValue(
value
) {

return String(
value ?? ""
)
.trim()
.toLowerCase();

}

function isPlaceholderName(
value
) {

const normalized =
normalizeTextValue(
value
);

if (!normalized) {
return true;
}

return (
normalized === "مستخدم" ||
normalized === "المستخدم" ||
normalized === "user" ||
normalized === "unknown" ||
normalized === "unknown user"
);

}

function isDefaultAvatar(
value
) {

if (!value) {
return true;
}

const avatar =
String(
value
).trim();

if (!avatar) {
return true;
}

if (
avatar ===
DEFAULT_AVATAR
) {
return true;
}

if (
avatar.startsWith(
"data:image/svg+xml"
) &&
avatar.includes(
'fill="#111"'
) &&
avatar.includes(
'fill="#777"'
) &&
avatar.includes(
'cx="100"'
)
) {

return true;

}

return false;

}

function getDisplayName(
contact
) {

if (!contact) {
return "مستخدم";
}

const candidates = [
contact.display_name,
contact.full_name,
contact.name,
contact.username
];

for (
const value
of candidates
) {

if (
value &&
!isPlaceholderName(
value
)
) {

return String(
value
).trim();

}

}

return "مستخدم";

}

function avatarUrl(
contact
) {

if (!contact) {
return DEFAULT_AVATAR;
}

const candidates = [
contact.avatar_url,
contact.avatar,
contact.photo_url
];

for (
const value
of candidates
) {

if (
value &&
!isDefaultAvatar(
value
)
) {

return String(
value
).trim();

}

}

return DEFAULT_AVATAR;

}

function hasRealContactData(
contact
) {

if (
!contact ||
typeof contact !==
"object"
) {
return false;
}

const displayName =
getDisplayName(
contact
);

const username =
String(
contact.username ??
""
).trim();

const avatar =
avatarUrl(
contact
);

const hasName =
Boolean(
displayName &&
!isPlaceholderName(
displayName
)
);

const hasUsername =
Boolean(
username &&
!isPlaceholderName(
username
)
);

const hasAvatar =
Boolean(
avatar &&
!isDefaultAvatar(
avatar
)
);

return (
hasName ||
hasUsername ||
hasAvatar
);

}

function getMessageId(
message
) {

if (!message) {
return null;
}

return (
message.id ??
message.message_id ??
null
);

}

function getMessageTime(
message
) {

return (
message?.created_at ||
message?.sent_at ||
message?.inserted_at ||
null
);

}

function getMessageSenderId(
message
) {

return (
message?.sender_id ??
message?.user_id ??
message?.from_user_id ??
null
);

}

function getMessageContent(
message
) {

return (
message?.content ??
message?.message ??
message?.message_content ??
""
);

}

/* =========================================================
CACHE HELPERS
========================================================= */

function getCacheKey(
conversationId
) {

return conversationId != null
? String(conversationId)
: null;

}

function cloneMessages(
messages
) {

if (
!Array.isArray(
messages
)
) {
return [];
}

return messages.map(
message => {

if (
!message ||
typeof message !==
"object"
) {
return message;
}

return {
...message
};

}
);

}

function cacheCurrentMessages() {

if (
!currentConversationId
) {
return;
}

const key =
getCacheKey(
currentConversationId
);

if (!key) {
return;
}

conversationMessagesCache.set(
key,
{
messages:
cloneMessages(
currentMessages
),

hasOlderMessages:
hasOlderMessages,

timestamp:
Date.now()
}
);

}

function getCachedMessages(
conversationId
) {

const key =
getCacheKey(
conversationId
);

if (!key) {
return null;
}

const cached =
conversationMessagesCache.get(
key
);

if (!cached) {
return null;
}

if (
Date.now() -
cached.timestamp >
MESSAGE_CACHE_TIME
) {

conversationMessagesCache.delete(
key
);

return null;

}

return {
messages:
cloneMessages(
cached.messages
),

hasOlderMessages:
cached.hasOlderMessages !==
false
};

}

/* =========================================================
CONTACT CACHE
========================================================= */

function cacheConversationContact(
conversationId,
contact
) {

const key =
getCacheKey(
conversationId
);

if (
!key ||
!contact
) {
return;
}

const normalized =
normalizeContact(
contact
);

if (
!hasRealContactData(
normalized
)
) {

conversationContactCache.delete(
key
);

return;

}

conversationContactCache.set(
key,
{
contact:
normalized,

timestamp:
Date.now()
}
);

}

function getCachedConversationContact(
conversationId
) {

const key =
getCacheKey(
conversationId
);

if (!key) {
return null;
}

const cached =
conversationContactCache.get(
key
);

if (!cached) {
return null;
}

if (
Date.now() -
cached.timestamp >
MESSAGE_CACHE_TIME
) {

conversationContactCache.delete(
key
);

return null;

}

const normalized =
normalizeContact(
cached.contact
);

if (
!hasRealContactData(
normalized
)
) {

conversationContactCache.delete(
key
);

return null;

}

return normalized;

}

/* =========================================================
DEBOUNCED CONVERSATION REFRESH
========================================================= */

function scheduleConversationListRefresh(
delay =
CONVERSATION_REFRESH_DEBOUNCE
) {

if (
conversationRefreshScheduled
) {
return;
}

conversationRefreshScheduled =
true;

const run =
() => {

conversationRefreshScheduled =
false;

loadConversations()
.catch(
error => {

console.warn(
"WFESC scheduled conversation refresh:",
error
);

}
);

};

if (
conversationRefreshTimer
) {

clearTimeout(
conversationRefreshTimer
);

}

conversationRefreshTimer =
setTimeout(
() => {

conversationRefreshTimer =
null;

if (
typeof requestAnimationFrame ===
"function"
) {

requestAnimationFrame(
run
);

} else {

run();

}

},
Math.max(
0,
delay
)
);

}

/* =========================================================
SOFT DELETE
========================================================= */

function isMessageDeleted(
message
) {

if (!message) {
return false;
}

return Boolean(
message.deleted_at
);

}

function getMessageDisplayContent(
message
) {

if (
isMessageDeleted(
message
)
) {

return "تم حذف هذه الرسالة";

}

return getMessageContent(
message
);

}

function isMessageMine(
message
) {

const senderId =
getMessageSenderId(
message
);

return (
senderId != null &&
currentUser?.id != null &&
String(senderId) ===
String(currentUser.id)
);

}

/* =========================================================
CONTACT NORMALIZATION
========================================================= */

function normalizeContact(
contact,
fallback = null
) {

const source =
contact ||
{};

const fallbackSource =
fallback ||
{};

const userId =
source.user_id ??
source.userId ??
source.profile_id ??
source.id ??
fallbackSource.user_id ??
fallbackSource.userId ??
fallbackSource.profile_id ??
fallbackSource.id ??
null;

const nameCandidates = [
source.display_name,
source.full_name,
source.name,
fallbackSource.display_name,
fallbackSource.full_name,
fallbackSource.name,
source.username,
fallbackSource.username
];

let displayName =
null;

for (
const value
of nameCandidates
) {

if (
value &&
!isPlaceholderName(
value
)
) {

displayName =
String(
value
).trim();

break;

}

}

const username =
source.username ??
fallbackSource.username ??
null;

const avatarCandidates = [
source.avatar_url,
source.avatar,
source.photo_url,
fallbackSource.avatar_url,
fallbackSource.avatar,
fallbackSource.photo_url
];

let avatar =
null;

for (
const value
of avatarCandidates
) {

if (
value &&
!isDefaultAvatar(
value
)
) {

avatar =
String(
value
).trim();

break;

}

}

const showActivity =
source.show_activity ??
fallbackSource.show_activity;

const isOnline =
source.is_online ??
source.online ??
fallbackSource.is_online ??
fallbackSource.online ??
false;

return {

...fallbackSource,
...source,

user_id:
userId,

display_name:
displayName,

username:
username,

avatar_url:
avatar ||
DEFAULT_AVATAR,

show_activity:
showActivity !== false,

is_online:
Boolean(
isOnline
)

};

}

/* =========================================================
ACTIVITY
========================================================= */

function applyActivityStateToContact(
contact
) {

if (!contact) {
return contact;
}

const normalized =
normalizeContact(
contact
);

const userId =
normalized.user_id;

if (!userId) {
return normalized;
}

try {

const activity =
window.WFESC_MESSAGES_ACTIVITY;

if (
activity &&
typeof activity.getUserActivity ===
"function"
) {

const state =
activity.getUserActivity(
userId
);

if (
state &&
typeof state ===
"object"
) {

normalized.is_online =
Boolean(
state.online
);

if (
state.show_activity !==
undefined
) {

normalized.show_activity =
state.show_activity !==
false;

}

}

}

} catch (error) {

console.warn(
"WFESC apply activity state:",
error
);

}

return normalized;

}

function refreshCurrentContactActivity() {

if (
!currentConversationContact
) {
return;
}

const updated =
applyActivityStateToContact(
currentConversationContact
);

currentConversationContact =
updated;

chatHeaderInterface.refresh();

}

/* =========================================================
ACTIVITY EVENTS
========================================================= */

window.addEventListener(
"wfesc:activity-sync",
() => {

refreshCurrentContactActivity();

conversations.forEach(
conversation => {

const contact =
conversation.contact ||
conversation.profile ||
conversation.user ||
conversation;

const normalized =
normalizeContact(
contact,
conversation
);

if (
normalized.user_id
) {

try {

const activity =
window.WFESC_MESSAGES_ACTIVITY;

if (
activity &&
typeof activity.getUserActivity ===
"function"
) {

const state =
activity.getUserActivity(
normalized.user_id
);

conversation.is_online =
Boolean(
state?.online
);

}

} catch (_) {}

}

}
);

scheduleConversationListRefresh(
0
);

}
);

window.addEventListener(
"wfesc:activity-response",
() => {

refreshCurrentContactActivity();

}
);

/* =========================================================
TYPING BLOCK CLEANUP
========================================================= */

function clearAllRemoteTypingUsers() {

try {

typingUsers.clear();

} catch (_) {}

try {

typingUserTimers.forEach(
timer => {

try {

clearTimeout(
timer
);

} catch (_) {}

}
);

typingUserTimers.clear();

} catch (_) {}

updateTypingIndicator();

}

/* =========================================================
BLOCK EVENTS
========================================================= */

async function handleCoreBlockChange(
event
) {

try {

const currentContactId =
getContactUserId(
currentConversationContact
);

const eventUserId =
event?.detail?.userId ??
event?.detail?.blocked_id ??
event?.detail?.contactId ??
event?.detail?.blockedId ??
null;

/*
امسح حالة جاري الكتابة فورًا من الواجهة،
حتى لو كان الحدث متعلقًا بالمحادثة الحالية.
*/

if (
eventUserId == null ||
currentContactId == null ||
String(eventUserId) ===
String(currentContactId)
) {

clearAllRemoteTypingUsers();

}

/*
أعد التحقق مباشرة من حالة الحظر.
*/

const state =
await getCurrentConversationBlockState();

/*
إذا الطرف الآخر حاجز المستخدم الحالي:
- أوقف Typing المحلي
- أغلق قناة Typing
- امسح أي حالة Typing ظاهرة
*/

if (
state.blockedBy
) {

clearAllRemoteTypingUsers();

await stopTyping();

await removeTypingChannel(
false
);

try {

if (
messageInput
) {

messageInput.dataset.wfescBlockedBy =
"true";

}

} catch (_) {}

} else {

/*
إذا لم يعد هناك حظر من الطرف الآخر،
نزيل العلامة.
*/

try {

if (
messageInput
) {

delete messageInput.dataset.wfescBlockedBy;

}

} catch (_) {}

/*
إذا المستخدم الحالي هو الذي حظر الطرف الآخر،
تبقى قناة Typing الخاصة بالمستخدم الحالي
مسموحًا بها، لكن incoming typing سيتم رفضه
داخل setupTypingChannel.
*/

}

chatHeaderInterface.refresh();

scheduleConversationListRefresh(
0
);

try {

window.dispatchEvent(
new CustomEvent(
"wfesc:chat-block-state-updated",
{
detail: {
state
}
}
)
);

} catch (_) {}

} catch (error) {

console.warn(
"WFESC core block state refresh:",
error
);

}

}

window.addEventListener(
"wfesc:block-changed",
handleCoreBlockChange
);

window.addEventListener(
"wfesc:blocked",
handleCoreBlockChange
);

window.addEventListener(
"wfesc:unblocked",
handleCoreBlockChange
);

window.addEventListener(
"wfesc:user-blocked",
handleCoreBlockChange
);

window.addEventListener(
"wfesc:user-unblocked",
handleCoreBlockChange
);

/* =========================================================
SORT
========================================================= */

function sortMessages(
messages
) {

messages.sort(
(a, b) => {

const first =
new Date(
getMessageTime(a) || 0
).getTime();

const second =
new Date(
getMessageTime(b) || 0
).getTime();

if (
first !== second
) {

return first - second;

}

const firstId =
String(
getMessageId(a) || ""
);

const secondId =
String(
getMessageId(b) || ""
);

if (
firstId <
secondId
) {
return -1;
}

if (
firstId >
secondId
) {
return 1;
}

return 0;

}
);

return messages;

}

/* =========================================================
SCROLL
========================================================= */

function scrollChatToBottom(
behavior = "smooth"
) {

if (!chatMessages) {
return;
}

const target =
Math.max(
0,
chatMessages.scrollHeight -
chatMessages.clientHeight
);

if (
typeof chatMessages.scrollTo ===
"function"
) {

chatMessages.scrollTo({
top:
target,
behavior
});

} else {

chatMessages.scrollTop =
target;

}

}

function forceScrollToBottom() {

if (!chatMessages) {
return;
}

chatMessages.scrollTop =
Math.max(
0,
chatMessages.scrollHeight -
chatMessages.clientHeight
);

}

function isNearBottom() {

if (!chatMessages) {
return true;
}

return (
chatMessages.scrollHeight -
chatMessages.scrollTop -
chatMessages.clientHeight
) < 150;

}

/* =========================================================
PREPARE CHAT
========================================================= */

function prepareChatAtBottom() {

if (!chatMessages) {
return;
}

const oldBehavior =
chatMessages.style.scrollBehavior;

chatMessages.style.scrollBehavior =
"auto";

forceScrollToBottom();

requestAnimationFrame(
() => {

forceScrollToBottom();

chatMessages.style.scrollBehavior =
oldBehavior || "";

}
);

}

/* =========================================================
OPEN ANIMATION
========================================================= */

function playChatOpenAnimation() {

if (!chatView) {
return;
}

chatView.classList.remove(
"wfesc-chat-opening"
);

void chatView.offsetWidth;

chatView.classList.add(
"wfesc-chat-opening"
);

let finished = false;

const removeAnimation =
() => {

if (finished) {
return;
}

finished = true;

chatView.classList.remove(
"wfesc-chat-opening"
);

chatView.removeEventListener(
"animationend",
removeAnimation
);

};

chatView.addEventListener(
"animationend",
removeAnimation
);

setTimeout(
removeAnimation,
350
);

}

/* =========================================================
MESSAGE SETTINGS
========================================================= */

function applyMessageSettings() {

try {

const settings =
window.WFESC_MESSAGE_SETTINGS;

if (!settings) {
return;
}

if (
typeof settings.apply ===
"function"
) {

if (
typeof settings.get ===
"function"
) {

settings.apply(
settings.get()
);

} else {

settings.apply();

}

return;

}

if (
typeof settings.applySettings ===
"function"
) {

if (
typeof settings.getSettings ===
"function"
) {

settings.applySettings(
settings.getSettings()
);

} else {

settings.applySettings();

}

}

} catch (error) {

console.warn(
"WFESC message settings:",
error
);

}

}

function scheduleMessageSettingsApply() {

if (
typeof requestAnimationFrame ===
"function"
) {

requestAnimationFrame(
applyMessageSettings
);

} else {

setTimeout(
applyMessageSettings,
0
);

}

}

/* =========================================================
SUPPORT
========================================================= */

function getSupportContact() {

return {

user_id:
null,

display_name:
SUPPORT_NAME,

username:
"wfesc",

avatar_url:
SUPPORT_AVATAR,

is_online:
true,

show_activity:
true,

is_support:
true

};

}

/* =========================================================
CONTACT FETCH RESILIENCE
========================================================= */

function isLikelyNetworkError(
error
) {

if (!error) {
return false;
}

const message =
String(
error?.message ||
error?.name ||
error ||
""
).toLowerCase();

return (
message.includes("failed to fetch") ||
message.includes("networkerror") ||
message.includes("network error") ||
message.includes("load failed") ||
message.includes("fetch failed") ||
error?.name ===
"TypeError"
);

}

/* =========================================================
GET CONVERSATION CONTACT
========================================================= */

async function getConversationContact(
conversationId,
type,
fallbackContact = null
) {

if (
type === "support"
) {

return getSupportContact();

}

if (!conversationId) {

if (fallbackContact) {

return normalizeContact(
fallbackContact
);

}

return null;

}

const cachedContact =
getCachedConversationContact(
conversationId
);

if (
cachedContact &&
hasRealContactData(
cachedContact
)
) {

return normalizeContact(
cachedContact,
fallbackContact
);

}

const normalizedFallback =
fallbackContact
? normalizeContact(
fallbackContact
)
: null;

try {

const {
data,
error
} = await client.rpc(
"get_conversation_contacts",
{
target_conversation_id:
conversationId
}
);

if (error) {

if (
isLikelyNetworkError(
error
)
) {

console.warn(
"WFESC contact fetch network error; using local fallback.",
{
conversation_id:
conversationId
}
);

return (
normalizedFallback ||
null
);

}

console.warn(
"WFESC get_conversation_contacts:",
error
);

return (
normalizedFallback ||
null
);

}

if (!data) {

return (
normalizedFallback ||
null
);

}

const rawContact =
Array.isArray(data)
? data[0]
: data;

if (!rawContact) {

return (
normalizedFallback ||
null
);

}

const normalized =
normalizeContact(
rawContact,
normalizedFallback
);

if (
hasRealContactData(
normalized
)
) {

cacheConversationContact(
conversationId,
normalized
);

return normalized;

}

return (
normalizedFallback ||
normalized ||
null
);

} catch (error) {

if (
isLikelyNetworkError(
error
)
) {

console.warn(
"WFESC contact network exception; using fallback.",
{
conversation_id:
conversationId
}
);

return (
normalizedFallback ||
null
);

}

console.warn(
"WFESC getConversationContact exception:",
error
);

return (
normalizedFallback ||
null
);

}

}

/* =========================================================
SUPPORT CONVERSATION
========================================================= */

async function ensureSupportConversation() {

try {

const {
data,
error
} = await client.rpc(
"get_or_create_support_conversation"
);

if (error) {

console.warn(
"WFESC support conversation:",
error
);

return null;

}

if (!data) {
return null;
}

if (
typeof data ===
"string"
) {

return data;

}

return (
data.conversation_id ||
data.id ||
data[0]?.conversation_id ||
data[0]?.id ||
null
);

} catch (error) {

console.warn(
"WFESC support conversation exception:",
error
);

return null;

}

}

/* =========================================================
LOAD CONVERSATIONS
========================================================= */

async function loadConversations() {

if (!currentUser) {
return [];
}

const requestedUserId =
currentUser.id;

try {

const {
data,
error
} = await client.rpc(
"get_my_conversations"
);

if (
!currentUser ||
String(currentUser.id) !==
String(requestedUserId)
) {

return conversations;

}

if (error) {

console.warn(
"WFESC get_my_conversations:",
error
);

return conversations;

}

conversations =
Array.isArray(data)
? [...data]
: [];

conversations =
conversations.map(
conversation => {

const contact =
conversation.contact ||
conversation.profile ||
conversation.user ||
conversation;

const normalized =
normalizeContact(
contact,
conversation
);

conversation.contact =
normalized;

if (
normalized.user_id
) {

try {

const activity =
window.WFESC_MESSAGES_ACTIVITY;

if (
activity &&
typeof activity.getUserActivity ===
"function"
) {

const state =
activity.getUserActivity(
normalized.user_id
);

conversation.is_online =
Boolean(
state?.online
);

}

} catch (_) {}

}

if (
conversation.id ||
conversation.conversation_id
) {

if (
hasRealContactData(
normalized
)
) {

cacheConversationContact(
conversation.id ||
conversation.conversation_id,
normalized
);

} else {

conversationContactCache.delete(
String(
conversation.id ||
conversation.conversation_id
)
);

}

}

return conversation;

}
);

conversations.sort(
(a, b) => {

const first =
new Date(
a.last_message_at ||
a.updated_at ||
0
).getTime();

const second =
new Date(
b.last_message_at ||
b.updated_at ||
0
).getTime();

return second - first;

}
);

renderConversations();

return conversations;

} catch (error) {

console.warn(
"WFESC load conversations exception:",
error
);

return conversations;

}

}

/* =========================================================
RENDER CONVERSATIONS
========================================================= */

function renderConversations() {

const conversationsUI =
window.WFESC_MESSAGES_CONVERSATIONS;

if (conversationsUI) {

try {

if (
typeof conversationsUI.renderConversations ===
"function"
) {

conversationsUI.renderConversations(
[...conversations]
);

return;

}

if (
typeof conversationsUI.render ===
"function"
) {

conversationsUI.render(
[...conversations]
);

return;

}

} catch (error) {

console.warn(
"WFESC conversations UI render:",
error
);

}

}

try {

window.dispatchEvent(
new CustomEvent(
"wfesc:conversations-updated",
{
detail: {
conversations:
[...conversations]
}
}
)
);

} catch (_) {}

if (!conversationList) {
return;
}

conversationList.innerHTML =
"";

if (!conversations.length) {

conversationList.innerHTML = `
<div class="empty-state glass">

<div class="empty-icon">
💬
</div>

<strong>
لا توجد محادثات
</strong>

<p>
ابدأ محادثة جديدة
</p>

</div>
`;

return;

}

conversations.forEach(
conversation => {

const card =
createConversationCard(
conversation
);

conversationList.appendChild(
card
);

}
);

}

/* =========================================================
CONVERSATION CARD
========================================================= */

function createConversationCard(
conversation
) {

const card =
document.createElement(
"article"
);

card.className =
"conversation-card";

const contact =
conversation.contact ||
conversation.profile ||
conversation.user ||
null;

const normalizedContact =
normalizeContact(
contact,
conversation
);

const name =
getDisplayName(
{
...conversation,
...normalizedContact
}
);

const avatar =
avatarUrl(
{
...conversation,
...normalizedContact
}
);

const preview =
conversation.last_message ||
conversation.last_message_text ||
"لا توجد رسائل";

const time =
formatTime(
conversation.last_message_at ||
conversation.updated_at
);

const unread =
Number(
conversation.unread_count ||
0
);

card.innerHTML = `
<div class="avatar-wrap">

<img
class="avatar"
src="${escapeHtml(avatar)}"
alt=""
loading="lazy"
>

<span class="online-dot ${
conversation.is_online
? "active"
: ""
}"></span>

</div>

<div class="conversation-info">

<div class="conversation-name">

<span>
${escapeHtml(name)}
</span>

${
unread > 0
? `
<span
style="
color:var(--green);
font-size:10px;
">
${unread}
</span>
`
: ""
}

</div>

<div class="conversation-preview">
${escapeHtml(preview)}
</div>

</div>

<div class="conversation-time">
${escapeHtml(time)}
</div>
`;

card.addEventListener(
"click",
() => {

openConversation(
conversation.id ||
conversation.conversation_id,
normalizedContact,
conversation.type
);

}
);

return card;

}

/* =========================================================
CHAT HEADER INTERFACE
========================================================= */

const chatHeaderInterface = {

getContact() {

return currentConversationContact;

},

getConversationId() {

return currentConversationId;

},

getDisplayName(
contact =
currentConversationContact
) {

return getDisplayName(
contact
);

},

getAvatarUrl(
contact =
currentConversationContact
) {

return avatarUrl(
contact
);

},

getActivityState(
contact =
currentConversationContact
) {

const normalized =
normalizeContact(
contact
);

return {

isOnline:
Boolean(
normalized.is_online
),

showActivity:
normalized.show_activity !==
false,

userId:
normalized.user_id ||
null

};

},

refresh() {

try {

window.dispatchEvent(
new CustomEvent(
"wfesc:chat-header-refresh",
{
detail: {

contact:
currentConversationContact,

conversationId:
currentConversationId

}
}
)
);

} catch (_) {}

}

};

/* =========================================================
TYPING ELEMENT
========================================================= */

function ensureTypingElement() {

if (!chatView) {
return null;
}

let typing =
document.getElementById(
"wfescTypingIndicator"
);

if (typing) {
return typing;
}

typing =
document.createElement(
"div"
);

typing.id =
"wfescTypingIndicator";

typing.className =
"wfesc-typing-indicator";

typing.innerHTML = `
<div class="wfesc-typing-bubble">
<span></span>
<span></span>
<span></span>
</div>

<span class="wfesc-typing-text">
جاري الكتابة...
</span>
`;

typing.style.cssText = `
position:absolute;
right:12px;
left:12px;
bottom:calc(
var(--composer-bottom, 82px) + 62px
);
z-index:25;
display:none;
align-items:center;
justify-content:flex-start;
gap:8px;
min-height:34px;
padding:4px;
color:#999;
font-size:12px;
direction:rtl;
pointer-events:none;
opacity:0;
transition:
bottom .10s linear,
opacity .18s ease,
transform .18s ease;
`;

const styleId =
"wfescTypingStyle";

if (
!document.getElementById(
styleId
)
) {

const style =
document.createElement(
"style"
);

style.id =
styleId;

style.textContent = `
@keyframes wfescTypingDot {

0%,
60%,
100% {
transform:translateY(0);
opacity:.35;
}

30% {
transform:translateY(-4px);
opacity:1;
}
}

.wfesc-typing-indicator {
box-sizing:border-box;
}

.wfesc-typing-bubble {

display:flex;
align-items:center;
justify-content:center;
gap:3px;
min-width:34px;
height:28px;
padding:0 8px;
border-radius:14px;
background:rgba(255,255,255,.07);
border:1px solid rgba(255,255,255,.08);
backdrop-filter:blur(10px);
-webkit-backdrop-filter:blur(10px);
}

.wfesc-typing-bubble span {

width:5px;
height:5px;
border-radius:50%;
background:#aaa;
animation:
wfescTypingDot
1.1s
infinite;
}

.wfesc-typing-bubble span:nth-child(2) {
animation-delay:.15s;
}

.wfesc-typing-bubble span:nth-child(3) {
animation-delay:.30s;
}

.wfesc-typing-text {
white-space:nowrap;
line-height:28px;
}
`;

document.head.appendChild(
style
);

}

chatView.appendChild(
typing
);

updateTypingIndicatorPosition();

return typing;

}

/* =========================================================
TYPING POSITION
========================================================= */

function updateTypingIndicatorPosition() {

const element =
document.getElementById(
"wfescTypingIndicator"
);

if (!element) {
return;
}

const composer =
document.querySelector(
".message-composer"
);

if (!composer) {
return;
}

const composerRect =
composer.getBoundingClientRect();

const chatRect =
chatView?.getBoundingClientRect();

if (!chatRect) {
return;
}

const bottom =
Math.max(
0,
chatRect.bottom -
composerRect.top +
6
);

element.style.bottom =
`${bottom}px`;

}

/* =========================================================
SHOW / HIDE TYPING
========================================================= */

function showTypingIndicator() {

const element =
ensureTypingElement();

if (!element) {
return;
}

/*
لا نظهر Typing إذا كنا نعرف أن الطرف الآخر
قام بحظر المستخدم الحالي.
*/

if (
messageInput?.dataset?.wfescBlockedBy ===
"true"
) {

element.style.display =
"none";

element.style.opacity =
"0";

return;

}

updateTypingIndicatorPosition();

element.style.display =
"flex";

requestAnimationFrame(
() => {

element.style.opacity =
"1";

element.style.transform =
"translateY(0)";

}
);

}

function hideTypingIndicator() {

const element =
document.getElementById(
"wfescTypingIndicator"
);

if (!element) {
return;
}

element.style.opacity =
"0";

element.style.transform =
"translateY(5px)";

setTimeout(
() => {

if (
typingUsers.size ===
0
) {

element.style.display =
"none";

}

},
120
);

}

function updateTypingIndicator() {

if (
messageInput?.dataset?.wfescBlockedBy ===
"true"
) {

hideTypingIndicator();

return;

}

if (
typingUsers.size > 0
) {

showTypingIndicator();

} else {

hideTypingIndicator();

}

}

/* =========================================================
TYPING USERS
========================================================= */

function clearTypingUser(
userId
) {

if (userId == null) {
return;
}

const key =
String(
userId
);

typingUsers.delete(
key
);

const timer =
typingUserTimers.get(
key
);

if (timer) {

clearTimeout(
timer
);

typingUserTimers.delete(
key
);

}

updateTypingIndicator();

}

function registerTypingUser(
userId
) {

if (userId == null) {
return;
}

const key =
String(
userId
);

typingUsers.add(
key
);

const oldTimer =
typingUserTimers.get(
key
);

if (oldTimer) {

clearTimeout(
oldTimer
);

}

const timer =
setTimeout(
() => {

clearTypingUser(
key
);

},
TYPING_REMOTE_TIMEOUT
);

typingUserTimers.set(
key,
timer
);

updateTypingIndicator();

}

/* =========================================================
STOP LOCAL TYPING
========================================================= */

async function stopTyping(
sendStopSignal = true
) {

if (typingTimer) {

clearTimeout(
typingTimer
);

typingTimer =
null;

}

if (!isTyping) {
return;
}

isTyping =
false;

if (!sendStopSignal) {
return;
}

try {

if (
typingChannel
) {

await typingChannel.send({

type:
"broadcast",

event:
"typing",

payload: {

user_id:
currentUser?.id ||
null,

typing:
false

}

});

}

} catch (error) {

console.warn(
"WFESC typing stop:",
error
);

}

}

/* =========================================================
SEND LOCAL TYPING
========================================================= */

async function sendTypingState() {

if (
!typingChannel ||
!currentUser ||
!currentConversationId
) {
return;
}

/*
إذا المستخدم الحالي محظور من الطرف الآخر،
لا نرسل Typing إطلاقًا.
*/

const contactId =
getContactUserId(
currentConversationContact
);

if (
contactId &&
!currentConversationContact?.is_support
) {

const blockedBy =
await isCurrentUserBlockedBy(
contactId
);

if (blockedBy) {

messageInput?.setAttribute(
"data-wfesc-blocked-by",
"true"
);

clearAllRemoteTypingUsers();

await stopTyping(
false
);

return;

}

if (
messageInput?.dataset?.wfescBlockedBy ===
"true"
) {

delete messageInput.dataset.wfescBlockedBy;

}

}

if (typingTimer) {

clearTimeout(
typingTimer
);

}

if (!isTyping) {

isTyping =
true;

try {

await typingChannel.send({

type:
"broadcast",

event:
"typing",

payload: {

user_id:
currentUser.id,

typing:
true

}

});

} catch (error) {

console.warn(
"WFESC typing start:",
error
);

}

}

typingTimer =
setTimeout(
async () => {

if (
!isTyping ||
!messageInput ||
!messageInput.matches(
":focus"
) ||
!messageInput.value.trim()
) {

return;

}

/*
فحص الحظر مرة أخرى قبل كل heartbeat.
هذا مهم إذا تم الحظر أثناء الكتابة.
*/

const currentContactId =
getContactUserId(
currentConversationContact
);

if (
currentContactId &&
!currentConversationContact?.is_support
) {

const blockedBy =
await isCurrentUserBlockedBy(
currentContactId
);

if (blockedBy) {

clearAllRemoteTypingUsers();

await stopTyping(
false
);

return;

}

}

try {

await typingChannel.send({

type:
"broadcast",

event:
"typing",

payload: {

user_id:
currentUser.id,

typing:
true

}

});

} catch (error) {

console.warn(
"WFESC typing heartbeat:",
error
);

}

sendTypingState();

},
1200
);

}

/* =========================================================
SETUP TYPING CHANNEL
========================================================= */

async function setupTypingChannel(
conversationId
) {

await removeTypingChannel(
false
).catch(
() => {}
);

if (
!conversationId ||
!currentUser
) {
return;
}

/*
الدعم مستثنى من الحظر.
*/

if (
currentConversationContact?.is_support
) {

} else {

const contactId =
getContactUserId(
currentConversationContact
);

if (contactId) {

const blockedBy =
await isCurrentUserBlockedBy(
contactId
);

if (blockedBy) {

clearAllRemoteTypingUsers();

if (messageInput) {

messageInput.dataset.wfescBlockedBy =
"true";

}

return;

}

if (messageInput) {

delete messageInput.dataset.wfescBlockedBy;

}

}

}

const channelName =
"wfesc-typing-" +
String(
conversationId
);

typingChannel =
client.channel(
channelName,
{
config: {
broadcast: {
self:
false
}
}
}
);

typingChannel.on(
"broadcast",
{
event:
"typing"
},
async payload => {

const data =
payload?.payload ||
payload ||
{};

const userId =
data.user_id;

if (
!userId ||
String(userId) ===
String(currentUser.id)
) {

return;

}

/*
لا نعتمد على وجود event للحظر.
نفحص قاعدة الحظر مباشرة عند وصول Typing.
*/

const block =
getBlockModule();

if (
block &&
typeof block.isBlockedBy ===
"function" &&
typeof block.isBlocked ===
"function"
) {

try {

const [
blockedByThem,
blockedByUs
] = await Promise.all([

block.isBlockedBy(
userId
),

block.isBlocked(
userId
)

]);

if (
blockedByThem ||
blockedByUs
) {

/*
امسح حالة المستخدم المحظور فورًا
ولا تسمح له بالظهور في جاري الكتابة.
*/

clearTypingUser(
userId
);

return;

}

} catch (error) {

console.warn(
"WFESC typing block check:",
error
);

}

}

if (
data.typing ===
true
) {

registerTypingUser(
userId
);

} else {

clearTypingUser(
userId
);

}

}
);

const channelReference =
typingChannel;

channelReference.subscribe(
status => {

if (
status !==
"SUBSCRIBED"
) {

console.warn(
"WFESC typing channel:",
status
);

}

}
);

}

/* =========================================================
REMOVE TYPING CHANNEL
========================================================= */

async function removeTypingChannel(
waitForRemoval = true
) {

if (typingTimer) {

clearTimeout(
typingTimer
);

typingTimer =
null;

}

isTyping =
false;

typingUsers.clear();

typingUserTimers.forEach(
timer => {

clearTimeout(
timer
);

}
);

typingUserTimers.clear();

hideTypingIndicator();

if (typingChannel) {

const oldChannel =
typingChannel;

typingChannel =
null;

const removePromise =
(async () => {

try {

await client.removeChannel(
oldChannel
);

} catch (error) {

console.warn(
"WFESC remove typing channel:",
error
);

}

})();

if (
waitForRemoval
) {

await removePromise;

}

}

}

/* =========================================================
INPUT EVENTS
========================================================= */

function setupInputEvents() {

const input =
document.getElementById(
"messageInput"
);

if (!input) {
return;
}

if (
input.dataset.wfescCoreInputReady ===
"true"
) {
return;
}

input.dataset.wfescCoreInputReady =
"true";

input.addEventListener(
"input",
() => {

if (
input.value.trim()
) {

sendTypingState();

} else {

stopTyping();

}

}
);

input.addEventListener(
"blur",
() => {

stopTyping();

}
);

input.addEventListener(
"focus",
() => {

if (
input.value.trim()
) {

sendTypingState();

}

}
);

}

/* =========================================================
REALTIME NORMALIZE
========================================================= */

function normalizeRealtimeMessage(
payload
) {

if (!payload) {
return null;
}

const record =
payload.new ||
payload.record ||
payload;

return record || null;

}

/* =========================================================
MESSAGE BELONGS
========================================================= */

function messageBelongsToCurrentConversation(
message
) {

if (!message) {
return false;
}

const conversationId =
message.conversation_id ??
message.target_conversation_id;

if (!conversationId) {
return false;
}

return (
currentConversationId &&
String(conversationId) ===
String(currentConversationId)
);

}

/* =========================================================
FIND STATE MESSAGE
========================================================= */

function findMessageInStateById(
messageId
) {

if (
messageId == null
) {
return null;
}

return (
currentMessages.find(
existing => {

const existingId =
getMessageId(
existing
);

return (
existingId != null &&
String(existingId) ===
String(messageId)
);

}
) ||
null
);

}

/* =========================================================
FIND OPTIMISTIC MESSAGE
========================================================= */

function findOptimisticMessageInState(
message
) {

if (!message) {
return null;
}

const senderId =
getMessageSenderId(
message
);

const content =
String(
getMessageContent(
message
)
).trim();

if (
!senderId ||
!content
) {
return null;
}

const incomingTime =
new Date(
getMessageTime(
message
) || 0
).getTime();

for (
let i =
currentMessages.length - 1;
i >= 0;
i--
) {

const existing =
currentMessages[i];

if (
!existing?.optimistic
) {
continue;
}

const existingSenderId =
getMessageSenderId(
existing
);

if (
String(existingSenderId) !==
String(senderId)
) {
continue;
}

const existingContent =
String(
getMessageContent(
existing
)
).trim();

if (
existingContent !==
content
) {
continue;
}

const existingTime =
new Date(
getMessageTime(
existing
) || 0
).getTime();

if (
incomingTime &&
existingTime &&
Math.abs(
incomingTime -
existingTime
) > 15000
) {
continue;
}

return existing;

}

return null;

}

/* =========================================================
FIND DOM BY ID
========================================================= */

function findDomMessageById(
messageId
) {

if (
!chatMessages ||
messageId == null
) {
return null;
}

const elements =
chatMessages.querySelectorAll(
"[data-message-id]"
);

for (
const element
of elements
) {

if (
String(
element.dataset.messageId
) ===
String(
messageId
)
) {

return element;

}

}

return null;

}

/* =========================================================
FIND OPTIMISTIC DOM
========================================================= */

function findOptimisticMessageElement(
message
) {

if (
!chatMessages ||
!message
) {
return null;
}

const senderId =
getMessageSenderId(
message
);

const content =
String(
getMessageContent(
message
)
).trim();

const rows =
chatMessages.querySelectorAll(
".message-row.optimistic"
);

for (
let i =
rows.length - 1;
i >= 0;
i--
) {

const row =
rows[i];

const rowSenderId =
row.dataset.senderId ||
"";

const contentElement =
row.querySelector(
".message-content"
);

const rowContent =
String(
contentElement?.textContent ||
""
).trim();

if (
String(rowSenderId) !==
String(senderId)
) {
continue;
}

if (
rowContent !==
content
) {
continue;
}

return row;

}

return null;

}

/* =========================================================
EXISTING MESSAGE
========================================================= */

function findExistingMessageElement(
message
) {

const messageId =
getMessageId(
message
);

if (
messageId != null
) {

const byId =
findDomMessageById(
messageId
);

if (byId) {
return byId;
}

}

return findOptimisticMessageElement(
message
);

}

/* =========================================================
RECONCILE
========================================================= */

function reconcileExistingMessage(
element,
message
) {

if (
!element ||
!message
) {
return;
}

const messageId =
getMessageId(
message
);

const senderId =
getMessageSenderId(
message
);

element.dataset.confirmed =
"true";

element.classList.remove(
"optimistic"
);

element.classList.remove(
"message-new"
);

if (
messageId != null
) {

element.dataset.messageId =
String(
messageId
);

}

if (
senderId != null
) {

element.dataset.senderId =
String(
senderId
);

}

element.dataset.content =
getMessageContent(
message
);

if (
isMessageDeleted(
message
)
) {

element.dataset.deleted =
"true";

element.classList.add(
"message-deleted"
);

} else {

delete element.dataset.deleted;

element.classList.remove(
"message-deleted"
);

}

const contentElement =
element.querySelector(
".message-content"
);

if (contentElement) {

contentElement.textContent =
getMessageDisplayContent(
message
);

if (
isMessageDeleted(
message
)
) {

contentElement.classList.add(
"message-deleted-content"
);

} else {

contentElement.classList.remove(
"message-deleted-content"
);

}

}

const timeElement =
element.querySelector(
".message-time"
);

if (timeElement) {

timeElement.textContent =
formatTime(
getMessageTime(
message
)
);

}

scheduleMessageSettingsApply();

}

/* =========================================================
ADD REAL MESSAGE TO STATE
========================================================= */

function addRealMessageToState(
message
) {

if (!message) {
return false;
}

const messageId =
getMessageId(
message
);

if (
messageId != null &&
findMessageInStateById(
messageId
)
) {

return false;

}

const optimisticMessage =
findOptimisticMessageInState(
message
);

if (optimisticMessage) {

const index =
currentMessages.indexOf(
optimisticMessage
);

if (index >= 0) {

currentMessages[index] =
message;

sortMessages(
currentMessages
);

cacheCurrentMessages();

return true;

}

}

currentMessages.push(
message
);

sortMessages(
currentMessages
);

cacheCurrentMessages();

return true;

}

/* =========================================================
CONVERSATION EXISTS
========================================================= */

function conversationExists(
conversationId
) {

if (!conversationId) {
return false;
}

return conversations.some(
conversation =>
String(
conversation.id ??
conversation.conversation_id
) ===
String(
conversationId
)
);

}

/* =========================================================
REFRESH CONVERSATIONS FROM REALTIME
========================================================= */

function refreshConversationsFromRealtime(
conversationId
) {

if (!conversationId) {
return;
}

scheduleConversationListRefresh();

}

/* =========================================================
CONVERSATION PREVIEW
========================================================= */

function updateConversationPreview(
message
) {

if (!message) {
return;
}

const conversationId =
message.conversation_id ??
message.target_conversation_id;

if (!conversationId) {
return;
}

if (
isMessageDeleted(
message
)
) {

scheduleConversationListRefresh();

return;

}

const index =
conversations.findIndex(
conversation =>
String(
conversation.id ??
conversation.conversation_id
) ===
String(
conversationId
)
);

if (index < 0) {

refreshConversationsFromRealtime(
conversationId
);

return;

}

const conversation =
conversations[index];

conversation.last_message =
getMessageContent(
message
);

conversation.last_message_text =
getMessageContent(
message
);

conversation.last_message_at =
getMessageTime(
message
);

conversations.splice(
index,
1
);

conversations.unshift(
conversation
);

scheduleConversationListRefresh(
0
);

}

/* =========================================================
MERGE FRESH MESSAGE SET
========================================================= */

function mergeMessageLists(
oldMessages,
freshMessages
) {

const result = [];
const byId = new Map();

const oldList =
Array.isArray(oldMessages)
? oldMessages
: [];

const freshList =
Array.isArray(freshMessages)
? freshMessages
: [];

oldList.forEach(
message => {

const id =
getMessageId(
message
);

if (
id == null
) {

result.push(
message
);

return;

}

const key =
String(id);

if (
byId.has(key)
) {
return;
}

byId.set(
key,
result.length
);

result.push(
message
);

}
);

freshList.forEach(
message => {

const id =
getMessageId(
message
);

if (
id == null
) {

result.push(
message
);

return;

}

const key =
String(id);

if (
byId.has(key)
) {

const index =
byId.get(
key
);

result[index] =
message;

} else {

byId.set(
key,
result.length
);

result.push(
message
);

}

}
);

sortMessages(
result
);

return result;

}

/* =========================================================
HANDLE REALTIME MESSAGE
========================================================= */

async function handleRealtimeMessage(
payload
) {

const message =
normalizeRealtimeMessage(
payload
);

if (!message) {
return;
}

const conversationId =
message.conversation_id ??
message.target_conversation_id;

/*
إذا الرسالة من طرف قام بالحظر أو محظور
من المستخدم الحالي، لا نعرضها كرسالة جديدة.
*/
if (
await shouldIgnoreRealtimeMessage(
message
)
) {

return;

}

/*
أولاً عالج الرسالة للمحادثة المفتوحة.
*/
if (
messageBelongsToCurrentConversation(
message
)
) {

const messageId =
getMessageId(
message
);

const stateMessage =
messageId != null
? findMessageInStateById(
messageId
)
: null;

if (stateMessage) {

const stateIndex =
currentMessages.indexOf(
stateMessage
);

if (
stateIndex >= 0
) {

currentMessages[
stateIndex
] =
message;

}

const domById =
findDomMessageById(
messageId
);

if (domById) {

reconcileExistingMessage(
domById,
message
);

}

cacheCurrentMessages();

clearTypingUser(
getMessageSenderId(
message
)
);

} else {

const optimisticStateMessage =
findOptimisticMessageInState(
message
);

if (optimisticStateMessage) {

const stateIndex =
currentMessages.indexOf(
optimisticStateMessage
);

if (
stateIndex >= 0
) {

currentMessages[
stateIndex
] =
message;

}

let optimisticElement =
findDomMessageById(
getMessageId(
optimisticStateMessage
)
);

if (!optimisticElement) {

optimisticElement =
findOptimisticMessageElement(
message
);

}

if (optimisticElement) {

reconcileExistingMessage(
optimisticElement,
message
);

}

sortMessages(
currentMessages
);

cacheCurrentMessages();

clearTypingUser(
getMessageSenderId(
message
)
);

} else {

let existingElement =
messageId != null
? findDomMessageById(
messageId
)
: null;

if (!existingElement) {

existingElement =
findExistingMessageElement(
message
);

}

if (existingElement) {

reconcileExistingMessage(
existingElement,
message
);

addRealMessageToState(
message
);

} else {

const wasAtBottom =
isNearBottom();

addRealMessageToState(
message
);

if (chatMessages) {

const element =
createMessageElement(
message
);

chatMessages.appendChild(
element
);

scheduleMessageSettingsApply();

if (wasAtBottom) {

requestAnimationFrame(
() => {

scrollChatToBottom(
"smooth"
);

}
);

}

}

}

clearTypingUser(
getMessageSenderId(
message
)
);

}

}

}

/*
بعد ما ظهرت الرسالة بالمحادثة،
حدّث القائمة بالخلفية.
*/
if (
conversationExists(
conversationId
)
) {

updateConversationPreview(
message
);

} else {

refreshConversationsFromRealtime(
conversationId
);

}

}

/* =========================================================
MESSAGE REALTIME
========================================================= */

async function setupMessageRealtime() {

if (
realtimeStarted &&
messageChannel
) {
return;
}

if (
realtimeStarting
) {
return;
}

if (!currentUser) {
return;
}

realtimeStarting =
true;

try {

if (messageChannel) {

const oldChannel =
messageChannel;

messageChannel =
null;

try {

await client.removeChannel(
oldChannel
);

} catch (_) {}

}

messageChannel =
client
.channel(
"wfesc-messages-realtime"
)
.on(
"postgres_changes",
{
event:
"INSERT",
schema:
"public",
table:
"messages"
},
payload => {

handleRealtimeMessage(
payload
)
.catch(
error => {

wfescDebugError(
"خطأ أثناء معالجة رسالة Realtime",
error,
{
event:
"INSERT"
}
);

}
);

}
)
.on(
"postgres_changes",
{
event:
"UPDATE",
schema:
"public",
table:
"messages"
},
async payload => {

try {

const message =
normalizeRealtimeMessage(
payload
);

if (!message) {
return;
}

if (
await shouldIgnoreRealtimeMessage(
message
)
) {

return;

}

const isCurrent =
messageBelongsToCurrentConversation(
message
);

if (isCurrent) {

const messageId =
getMessageId(
message
);

if (
messageId != null
) {

const stateMessage =
findMessageInStateById(
messageId
);

if (stateMessage) {

const stateIndex =
currentMessages.indexOf(
stateMessage
);

if (
stateIndex >= 0
) {

currentMessages[
stateIndex
] =
message;

}

const domElement =
findDomMessageById(
messageId
);

if (domElement) {

reconcileExistingMessage(
domElement,
message
);

}

cacheCurrentMessages();

}

}

}

updateConversationPreview(
message
);

} catch (error) {

wfescDebugError(
"خطأ أثناء معالجة تحديث رسالة Realtime",
error,
{
event:
"UPDATE"
}
);

}

}
);

const channelReference =
messageChannel;

channelReference.subscribe(
status => {

if (
status ===
"SUBSCRIBED"
) {

if (
messageChannel !==
channelReference
) {
return;
}

realtimeStarted =
true;

realtimeStarting =
false;

realtimeConversationId =
null;

console.log(
"WFESC: Messages Realtime connected"
);

return;

}

if (
status ===
"CHANNEL_ERROR" ||
status ===
"TIMED_OUT" ||
status ===
"CLOSED"
) {

if (
messageChannel ===
channelReference
) {

realtimeStarted =
false;

realtimeStarting =
false;

}

console.warn(
"WFESC Messages Realtime:",
status
);

return;

}

console.warn(
"WFESC Messages Realtime:",
status
);

}
);

} catch (error) {

realtimeStarted =
false;

realtimeStarting =
false;

messageChannel =
null;

wfescDebugError(
"WFESC setupMessageRealtime error",
error,
{
current_user:
currentUser?.id ||
null,

current_conversation:
currentConversationId ||
null
}
);

console.error(
"WFESC setupMessageRealtime error:",
error
);

}

}

/* =========================================================
INFINITE SCROLL
========================================================= */

function getOldestLoadedMessage() {

if (
!currentMessages.length
) {
return null;
}

sortMessages(
currentMessages
);

return (
currentMessages[0] ||
null
);

}

function getOldestMessageCursor() {

const oldest =
getOldestLoadedMessage();

if (!oldest) {

return {
beforeCreatedAt:
null,

beforeMessageId:
null
};

}

return {

beforeCreatedAt:
getMessageTime(
oldest
),

beforeMessageId:
getMessageId(
oldest
)

};

}

function getOldestMessageTime() {

const cursor =
getOldestMessageCursor();

return (
cursor.beforeCreatedAt ||
null
);

}

async function loadOlderMessages() {

if (
loadingOlderMessages ||
!hasOlderMessages ||
!currentConversationId ||
!chatMessages
) {
return false;
}

const requestedConversationId =
currentConversationId;

const cursor =
getOldestMessageCursor();

const beforeCreatedAt =
cursor.beforeCreatedAt;

const beforeMessageId =
cursor.beforeMessageId;

if (
!beforeCreatedAt ||
!beforeMessageId
) {

hasOlderMessages =
false;

return false;

}

loadingOlderMessages =
true;

const requestToken =
++olderMessagesLoadToken;

const oldScrollHeight =
chatMessages.scrollHeight;

const oldScrollTop =
chatMessages.scrollTop;

try {

const {
data,
error
} = await client.rpc(
"get_conversation_messages",
{
target_conversation_id:
requestedConversationId,

message_limit:
MESSAGE_PAGE_SIZE,

before_created_at:
beforeCreatedAt,

before_message_id:
beforeMessageId
}
);

if (
requestToken !==
olderMessagesLoadToken ||
requestedConversationId !==
currentConversationId
) {

return false;

}

if (error) {

wfescDebugError(
"فشل تحميل الرسائل القديمة",
error,
{
rpc:
"get_conversation_messages",

conversation_id:
requestedConversationId,

message_limit:
MESSAGE_PAGE_SIZE,

before_created_at:
beforeCreatedAt,

before_message_id:
beforeMessageId
}
);

return false;

}

const rawOlderMessages =
Array.isArray(data)
? [...data]
: [];

const olderMessages =
rawOlderMessages.reverse();

hasOlderMessages =
rawOlderMessages.length ===
MESSAGE_PAGE_SIZE;

if (
olderMessages.length ===
0
) {

hasOlderMessages =
false;

cacheCurrentMessages();

return false;

}

const existingIds =
new Set(
currentMessages
.map(
message =>
getMessageId(
message
)
)
.filter(
id =>
id != null
)
.map(
id =>
String(id)
)
);

const uniqueOlderMessages =
olderMessages.filter(
message => {

const id =
getMessageId(
message
);

if (
id == null
) {
return false;
}

const key =
String(id);

if (
existingIds.has(
key
)
) {

return false;

}

existingIds.add(
key
);

return true;

}
);

if (
!uniqueOlderMessages.length
) {

hasOlderMessages =
false;

cacheCurrentMessages();

return false;

}

currentMessages =
[
...uniqueOlderMessages,
...currentMessages
];

sortMessages(
currentMessages
);

const fragment =
document.createDocumentFragment();

uniqueOlderMessages.forEach(
message => {

fragment.appendChild(
createMessageElement(
message
)
);

}
);

chatMessages.insertBefore(
fragment,
chatMessages.firstChild
);

const newScrollHeight =
chatMessages.scrollHeight;

const heightDifference =
newScrollHeight -
oldScrollHeight;

chatMessages.scrollTop =
oldScrollTop +
heightDifference;

cacheCurrentMessages();

scheduleMessageSettingsApply();

return true;

} catch (error) {

wfescDebugError(
"استثناء أثناء تحميل الرسائل القديمة",
error,
{
rpc:
"get_conversation_messages",

conversation_id:
requestedConversationId,

before_created_at:
beforeCreatedAt,

before_message_id:
beforeMessageId
}
);

return false;

} finally {

if (
requestToken ===
olderMessagesLoadToken
) {

loadingOlderMessages =
false;

}

}

}

/* =========================================================
MESSAGE SCROLL
========================================================= */

function setupMessageScroll() {

if (
!chatMessages ||
messagesScrollListenerAttached
) {
return;
}

messagesScrollListenerAttached =
true;

chatMessages.addEventListener(
"scroll",
() => {

if (
openingConversation
) {
return;
}

if (
chatMessages.scrollTop <=
MESSAGE_TOP_THRESHOLD
) {

loadOlderMessages();

}

},
{
passive:
true
}
);

}

/* =========================================================
OPEN CONVERSATION
========================================================= */

async function openConversation(
conversationId,
contact = null,
type = null
) {

try {

await openConversationInternal(
conversationId,
contact,
type
);

} catch (error) {

wfescDebugError(
"خطأ غير متوقع أثناء فتح المحادثة",
error,
{
conversation_id:
conversationId,

type:
type,

current_user:
currentUser?.id ||
null,

current_conversation:
currentConversationId ||
null
}
);

openingConversation =
false;

if (chatView) {

chatView.style.visibility =
"visible";

}

if (chatMessages) {

chatMessages.style.visibility =
"visible";

}

}

}

async function openConversationInternal(
conversationId,
contact = null,
type = null
) {

if (
!conversationId ||
openingConversation
) {
return;
}

openingConversation =
true;

const loadToken =
++conversationLoadToken;

olderMessagesLoadToken++;

loadingOlderMessages =
false;

hasOlderMessages =
true;

removeTypingChannel(
false
).catch(
() => {}
);

currentConversationId =
conversationId;

let passedContact =
contact
? normalizeContact(
contact
)
: null;

const cachedContact =
getCachedConversationContact(
conversationId
);

if (
!hasRealContactData(
passedContact
) &&
hasRealContactData(
cachedContact
)
) {

passedContact =
normalizeContact(
cachedContact
);

}

currentConversationContact =
passedContact;

typingUsers.clear();

hideTypingIndicator();

if (
type ===
"support"
) {

currentConversationContact =
getSupportContact();

} else if (
!hasRealContactData(
currentConversationContact
)
) {

currentConversationContact = {

user_id:
passedContact?.user_id ||
cachedContact?.user_id ||
null,

display_name:
"مستخدم",

username:
"user",

avatar_url:
DEFAULT_AVATAR,

is_online:
false,

show_activity:
true

};

}

currentConversationContact =
applyActivityStateToContact(
currentConversationContact
);

/*
حماية Core مباشرة من الحظر.
إذا الشخص قام بحظر المستخدم الحالي،
لا نفتح المحادثة.
*/

if (
type !==
"support"
) {

const blockResult =
await canOpenConversationByBlock(
currentConversationContact
);

if (
loadToken !==
conversationLoadToken
) {

openingConversation =
false;

return;

}

if (
!blockResult.allowed &&
blockResult.blockedBy
) {

currentConversationContact = {

...currentConversationContact,

display_name:
"قام المستخدم بحظرك",

username:
"user",

avatar_url:
DEFAULT_AVATAR,

is_online:
false,

show_activity:
false,

blocked_by:
true

};

if (messageInput) {

messageInput.dataset.wfescBlockedBy =
"true";

}

clearAllRemoteTypingUsers();

chatHeaderInterface.refresh();

if (chatView) {

chatView.classList.remove(
"open"
);

chatView.style.visibility =
"visible";

}

if (chatMessages) {

chatMessages.style.visibility =
"visible";

}

if (page) {

page.classList.remove(
"chat-active"
);

}

openingConversation =
false;

try {

window.dispatchEvent(
new CustomEvent(
"wfesc:conversation-blocked",
{
detail: {
conversationId,
contact:
currentConversationContact
}
}
)
);

} catch (_) {}

return;

}

}

/*
إذا لم يعد هناك حظر من الطرف الآخر،
أزل علامة الحظر من الإدخال.
*/

if (messageInput) {

delete messageInput.dataset.wfescBlockedBy;

}

chatHeaderInterface.refresh();

if (chatView) {

chatView.classList.remove(
"open"
);

chatView.classList.remove(
"wfesc-chat-opening"
);

chatView.style.visibility =
"hidden";

}

if (chatMessages) {

chatMessages.style.visibility =
"hidden";

}

let contactPromise =
null;

const shouldFetchContact =
type !==
"support" &&
!hasRealContactData(
currentConversationContact
);

if (
shouldFetchContact
) {

contactPromise =
getConversationContact(
conversationId,
type,
currentConversationContact
)
.then(
async fetchedContact => {

if (
loadToken !==
conversationLoadToken
) {
return;
}

if (
fetchedContact &&
hasRealContactData(
fetchedContact
)
) {

currentConversationContact =
applyActivityStateToContact(
normalizeContact(
fetchedContact,
currentConversationContact
)
);

if (
hasRealContactData(
currentConversationContact
)
) {

cacheConversationContact(
conversationId,
currentConversationContact
);

}

const blockResult =
await canOpenConversationByBlock(
currentConversationContact
);

if (
loadToken !==
conversationLoadToken
) {
return;
}

if (
!blockResult.allowed &&
blockResult.blockedBy
) {

currentConversationContact = {

...currentConversationContact,

display_name:
"قام المستخدم بحظرك",

username:
"user",

avatar_url:
DEFAULT_AVATAR,

is_online:
false,

show_activity:
false,

blocked_by:
true

};

if (messageInput) {

messageInput.dataset.wfescBlockedBy =
"true";

}

clearAllRemoteTypingUsers();

chatHeaderInterface.refresh();

try {

window.dispatchEvent(
new CustomEvent(
"wfesc:conversation-blocked",
{
detail: {
conversationId,
contact:
currentConversationContact
}
}
)
);

} catch (_) {}

return;

}

if (messageInput) {

delete messageInput.dataset.wfescBlockedBy;

}

chatHeaderInterface.refresh();

}

}
)
.catch(
error => {

console.warn(
"WFESC contact background fetch:",
error
);

}
);

}

const loaded =
await loadConversationMessages(
loadToken
);

if (
contactPromise
) {

contactPromise.catch(
() => {}
);

}

if (
loadToken !==
conversationLoadToken
) {

openingConversation =
false;

return;

}

if (!loaded) {

if (chatView) {

chatView.classList.remove(
"open"
);

chatView.style.visibility =
"visible";

}

if (chatMessages) {

chatMessages.style.visibility =
"visible";

}

openingConversation =
false;

return;

}

/*
فحص أخير قبل تشغيل قناة Typing.
*/

if (
type !==
"support"
) {

const finalBlockState =
await getCurrentConversationBlockState();

if (
loadToken !==
conversationLoadToken
) {

openingConversation =
false;

return;

}

if (
finalBlockState.blockedBy
) {

if (messageInput) {

messageInput.dataset.wfescBlockedBy =
"true";

}

clearAllRemoteTypingUsers();

if (chatView) {

chatView.classList.remove(
"open"
);

}

openingConversation =
false;

return;

}

}

if (messageInput) {

delete messageInput.dataset.wfescBlockedBy;

}

if (chatView) {

chatView.classList.add(
"open"
);

chatView.style.visibility =
"visible";

}

if (chatMessages) {

chatMessages.style.visibility =
"visible";

}

if (page) {

page.classList.add(
"chat-active"
);

}

if (searchSection) {

searchSection.classList.add(
"hidden"
);

}

prepareChatAtBottom();

setupTypingChannel(
conversationId
).catch(
error => {

console.warn(
"WFESC typing channel:",
error
);

}
);

markConversationRead(
conversationId
).catch(
error => {

console.warn(
"WFESC mark read:",
error
);

}
);

requestAnimationFrame(
() => {

forceScrollToBottom();

playChatOpenAnimation();

updateTypingIndicatorPosition();

}
);

openingConversation =
false;

}

/* =========================================================
FETCH MESSAGE PAGE
========================================================= */

async function fetchConversationMessagePage(
conversationId
) {

const {
data,
error
} = await client.rpc(
"get_conversation_messages",
{
target_conversation_id:
conversationId,

message_limit:
MESSAGE_PAGE_SIZE,

before_created_at:
null,

before_message_id:
null
}
);

return {
data,
error
};

}

/* =========================================================
BACKGROUND MESSAGE REFRESH
========================================================= */

async function refreshConversationMessagesInBackground(
conversationId,
expectedLoadToken
) {

const key =
getCacheKey(
conversationId
);

if (!key) {
return;
}

if (
backgroundMessageRefreshes.has(
key
)
) {
return;
}

const task =
(async () => {

try {

const {
data,
error
} =
await fetchConversationMessagePage(
conversationId
);

if (error) {

console.warn(
"WFESC background messages refresh:",
error
);

return;

}

const freshMessages =
Array.isArray(data)
? [...data].reverse()
: [];

const freshCount =
freshMessages.length;

const currentStillSame =
expectedLoadToken ===
conversationLoadToken &&
String(
currentConversationId
) ===
String(
conversationId
);

if (
currentStillSame
) {

const oldMessages =
currentMessages;

const merged =
mergeMessageLists(
oldMessages,
freshMessages
);

const changed =
JSON.stringify(
merged
) !==
JSON.stringify(
oldMessages
);

currentMessages =
merged;

hasOlderMessages =
hasOlderMessages ||
freshCount ===
MESSAGE_PAGE_SIZE;

cacheCurrentMessages();

if (
changed
) {

const wasNear =
isNearBottom();

renderMessages({
initialLoad:
false
});

if (
wasNear
) {

requestAnimationFrame(
() => {

forceScrollToBottom();

}
);

}

}

} else {

const cached =
getCachedMessages(
conversationId
);

const merged =
mergeMessageLists(
cached?.messages ||
[],
freshMessages
);

conversationMessagesCache.set(
key,
{
messages:
merged,

hasOlderMessages:
Boolean(
cached?.hasOlderMessages !==
false ||
freshCount ===
MESSAGE_PAGE_SIZE
),

timestamp:
Date.now()
}
);

}

} catch (error) {

console.warn(
"WFESC background message refresh exception:",
error
);

} finally {

backgroundMessageRefreshes.delete(
key
);

}

})();

backgroundMessageRefreshes.set(
key,
task
);

return task;

}

/* =========================================================
LOAD INITIAL MESSAGES
========================================================= */

async function loadConversationMessages(
expectedLoadToken =
conversationLoadToken
) {

if (!currentConversationId) {
return false;
}

const requestedConversationId =
currentConversationId;

const cached =
getCachedMessages(
requestedConversationId
);

if (
cached &&
cached.messages.length
) {

currentMessages =
cached.messages;

hasOlderMessages =
cached.hasOlderMessages;

sortMessages(
currentMessages
);

if (chatMessages) {

chatMessages.style.visibility =
"hidden";

}

renderMessages({
initialLoad:
true
});

refreshConversationMessagesInBackground(
requestedConversationId,
expectedLoadToken
).catch(
() => {}
);

return true;

}

hasOlderMessages =
true;

loadingOlderMessages =
false;

olderMessagesLoadToken++;

if (chatMessages) {

chatMessages.style.visibility =
"hidden";

chatMessages.innerHTML =
"";

}

try {

const {
data,
error
} =
await fetchConversationMessagePage(
requestedConversationId
);

if (
expectedLoadToken !==
conversationLoadToken ||
requestedConversationId !==
currentConversationId
) {

return false;

}

if (error) {

wfescDebugError(
"فشل فتح الرسائل — RPC get_conversation_messages",
error,
{
rpc:
"get_conversation_messages",

conversation_id:
requestedConversationId,

message_limit:
MESSAGE_PAGE_SIZE,

before_created_at:
null,

before_message_id:
null,

current_user:
currentUser?.id ||
null
}
);

console.error(
"WFESC messages error:",
error
);

if (chatMessages) {

chatMessages.innerHTML = `
<div class="empty-state">

<div class="empty-icon">
⚠️
</div>

<strong>
تعذر تحميل الرسائل
</strong>

<p>
افتح لوحة التشخيص أسفل الشاشة لمعرفة السبب
</p>

</div>
`;

}

return false;

}

const loadedMessages =
Array.isArray(data)
? [...data]
: [];

currentMessages =
loadedMessages.reverse();

sortMessages(
currentMessages
);

hasOlderMessages =
loadedMessages.length ===
MESSAGE_PAGE_SIZE;

currentMessages =
currentMessages.map(
message => {

if (
message &&
message.optimistic
) {

const cleanMessage =
{
...message
};

delete cleanMessage.optimistic;

return cleanMessage;

}

return message;

}
);

cacheCurrentMessages();

renderMessages({
initialLoad:
true
});

return true;

} catch (error) {

wfescDebugError(
"استثناء أثناء فتح الرسائل",
error,
{
rpc:
"get_conversation_messages",

conversation_id:
requestedConversationId,

current_user:
currentUser?.id ||
null,

message_limit:
MESSAGE_PAGE_SIZE
}
);

console.error(
"WFESC load messages exception:",
error
);

if (
expectedLoadToken ===
conversationLoadToken &&
requestedConversationId ===
currentConversationId &&
chatMessages
) {

chatMessages.innerHTML = `
<div class="empty-state">

<div class="empty-icon">
⚠️
</div>

<strong>
تعذر تحميل الرسائل
</strong>

<p>
افتح لوحة التشخيص أسفل الشاشة لمعرفة السبب
</p>

</div>
`;

}

return false;

}

}

/* =========================================================
RENDER MESSAGES
========================================================= */

function renderMessages(
options = {}
) {

if (!chatMessages) {
return;
}

const initialLoad =
Boolean(
options.initialLoad
);

const oldScrollTop =
chatMessages.scrollTop;

const oldScrollHeight =
chatMessages.scrollHeight;

const oldClientHeight =
chatMessages.clientHeight;

const wasNear =
(
oldScrollHeight -
oldScrollTop -
oldClientHeight
) < 150;

chatMessages.innerHTML =
"";

if (!currentMessages.length) {

chatMessages.innerHTML = `
<div class="empty-state">

<div class="empty-icon">
💬
</div>

<strong>
لا توجد رسائل بعد
</strong>

<p>
ابدأ المحادثة الآن
</p>

</div>
`;

scheduleMessageSettingsApply();

if (initialLoad) {

requestAnimationFrame(
() => {

forceScrollToBottom();

}
);

}

return;

}

const fragment =
document.createDocumentFragment();

currentMessages.forEach(
message => {

const element =
createMessageElement(
message
);

fragment.appendChild(
element
);

}
);

chatMessages.appendChild(
fragment
);

scheduleMessageSettingsApply();

if (initialLoad) {

const oldBehavior =
chatMessages.style.scrollBehavior;

chatMessages.style.scrollBehavior =
"auto";

forceScrollToBottom();

requestAnimationFrame(
() => {

forceScrollToBottom();

chatMessages.style.scrollBehavior =
oldBehavior ||
"";

}
);

return;

}

if (wasNear) {

requestAnimationFrame(
() => {

scrollChatToBottom(
"smooth"
);

}
);

} else {

const heightDifference =
chatMessages.scrollHeight -
oldScrollHeight;

chatMessages.scrollTop =
oldScrollTop +
Math.max(
0,
heightDifference
);

}

}

/* =========================================================
CREATE MESSAGE ELEMENT
========================================================= */

function createMessageElement(
message
) {

const isMine =
isMessageMine(
message
);

const deleted =
isMessageDeleted(
message
);

const row =
document.createElement(
"div"
);

row.className =
"message-row " +
(
isMine
? "mine"
: "theirs"
);

if (
message?.optimistic
) {

row.classList.add(
"optimistic"
);

}

if (deleted) {

row.classList.add(
"message-deleted"
);

row.dataset.deleted =
"true";

}

const messageId =
getMessageId(
message
);

if (
messageId != null
) {

row.dataset.messageId =
String(
messageId
);

}

row.dataset.senderId =
String(
getMessageSenderId(
message
) ||
""
);

row.dataset.content =
getMessageContent(
message
);

const bubble =
document.createElement(
"div"
);

bubble.className =
"message-bubble";

bubble.dataset.side =
isMine
? "mine"
: "theirs";

if (deleted) {

bubble.dataset.deleted =
"true";

}

const content =
document.createElement(
"div"
);

content.className =
"message-content";

content.textContent =
getMessageDisplayContent(
message
);

if (deleted) {

content.classList.add(
"message-deleted-content"
);

}

const time =
document.createElement(
"div"
);

time.className =
"message-time";

time.textContent =
formatTime(
getMessageTime(
message
)
);

bubble.appendChild(
content
);

bubble.appendChild(
time
);

row.appendChild(
bubble
);

return row;

}

/* =========================================================
ADD MESSAGE
========================================================= */

function addMessageToCurrentConversation(
message,
options = {}
) {

if (!message) {
return null;
}

/*
لا تسمح بإدخال رسالة واردة من مستخدم محظور
إلى الواجهة عبر أي مسار داخلي.
*/

const senderId =
getMessageSenderId(
message
);

if (
senderId &&
currentUser?.id &&
String(senderId) !==
String(currentUser.id)
) {

const block =
getBlockModule();

if (block) {

Promise.all([

typeof block.isBlockedBy ===
"function"
? block.isBlockedBy(senderId)
: false,

typeof block.isBlocked ===
"function"
? block.isBlocked(senderId)
: false

])
.then(
([
blockedByThem,
blockedByUs
]) => {

if (
blockedByThem ||
blockedByUs
) {

clearTypingUser(
senderId
);

}

}
)
.catch(
() => {}
);

}

}

if (
options.conversationId &&
String(
options.conversationId
) !==
String(
currentConversationId
)
) {

return null;

}

const messageId =
getMessageId(
message
);

if (
messageId != null &&
findMessageInStateById(
messageId
)
) {

return null;

}

const optimisticMatch =
findOptimisticMessageInState(
message
);

if (optimisticMatch) {

const index =
currentMessages.indexOf(
optimisticMatch
);

if (index >= 0) {

currentMessages[index] =
message;

sortMessages(
currentMessages
);

cacheCurrentMessages();

const element =
findOptimisticMessageElement(
message
);

if (element) {

reconcileExistingMessage(
element,
message
);

return element;

}

return message;

}

}

const wasAtBottom =
isNearBottom();

currentMessages.push(
message
);

sortMessages(
currentMessages
);

cacheCurrentMessages();

if (
options.appendOnly &&
chatMessages
) {

const element =
createMessageElement(
message
);

chatMessages.appendChild(
element
);

scheduleMessageSettingsApply();

if (
options.scroll !==
false &&
wasAtBottom
) {

requestAnimationFrame(
() => {

scrollChatToBottom(
"smooth"
);

}
);

}

return element;

}

renderMessages();

if (
options.scroll !==
false
) {

requestAnimationFrame(
() => {

scrollChatToBottom(
"smooth"
);

}
);

}

return true;

}

/* =========================================================
MARK READ
========================================================= */

async function markConversationRead(
conversationId
) {

if (!conversationId) {
return;
}

try {

const {
error
} =
await client.rpc(
"mark_conversation_read",
{
target_conversation_id:
conversationId
}
);

if (error) {

console.warn(
"WFESC mark read:",
error
);

}

} catch (error) {

console.warn(
"WFESC mark read exception:",
error
);

}

}

/* =========================================================
CLOSE
========================================================= */

async function closeConversation() {

conversationLoadToken++;

olderMessagesLoadToken++;

loadingOlderMessages =
false;

hasOlderMessages =
true;

openingConversation =
false;

removeTypingChannel(
false
).catch(
() => {}
);

cacheCurrentMessages();

currentConversationId =
null;

currentConversationContact =
null;

currentMessages =
[];

typingUsers.clear();

if (messageInput) {

delete messageInput.dataset.wfescBlockedBy;

}

chatHeaderInterface.refresh();

if (chatView) {

chatView.classList.remove(
"wfesc-chat-opening"
);

chatView.classList.remove(
"open"
);

chatView.style.visibility =
"visible";

}

if (page) {

page.classList.remove(
"chat-active"
);

}

if (searchSection) {

searchSection.classList.remove(
"hidden"
);

}

if (chatMessages) {

chatMessages.innerHTML =
"";

chatMessages.style.visibility =
"visible";

}

if (currentUser) {

scheduleConversationListRefresh(
0
);

}

}

/* =========================================================
BACK
========================================================= */

if (backChatButton) {

backChatButton.addEventListener(
"click",
closeConversation
);

}

/* =========================================================
RESIZE
========================================================= */

window.addEventListener(
"resize",
() => {

updateTypingIndicatorPosition();

}
);

if (
window.visualViewport
) {

window.visualViewport.addEventListener(
"resize",
() => {

updateTypingIndicatorPosition();

}
);

window.visualViewport.addEventListener(
"scroll",
() => {

updateTypingIndicatorPosition();

}
);

}

/* =========================================================
AUTH
========================================================= */

async function initializeAuth() {

if (initializationPromise) {
return initializationPromise;
}

initializationPromise =
(async () => {

try {

const {
data,
error
} =
await client.auth.getSession();

if (error) {

wfescDebugError(
"فشل Supabase Auth",
error,
{
action:
"auth.getSession"
}
);

return;

}

currentUser =
data?.session?.user ||
null;

if (!currentUser) {

console.warn(
"WFESC: لا يوجد مستخدم مسجل الدخول."
);

initialized =
false;

return;

}

await loadConversations();

if (!currentUser) {
return;
}

setupMessageRealtime()
.catch(
error => {

console.warn(
"WFESC realtime startup:",
error
);

}
);

ensureSupportConversation()
.then(
supportId => {

if (
supportId &&
currentUser &&
!conversationExists(
supportId
)
) {

scheduleConversationListRefresh(
0
);

}

}
)
.catch(
error => {

console.warn(
"WFESC support background:",
error
);

}
);

initialized =
true;

console.log(
"WFESC Messages Core initialized"
);

} catch (error) {

initialized =
false;

wfescDebugError(
"فشل تشغيل Messages Core",
error,
{
user_id:
currentUser?.id ||
null
}
);

console.error(
"WFESC initialize error:",
error
);

} finally {

initializationPromise =
null;

}

})();

return initializationPromise;

}

/* =========================================================
AUTH STATE CHANGES
========================================================= */

client.auth.onAuthStateChange(
async (
event,
session
) => {

try {

const nextUser =
session?.user ||
null;

if (!nextUser) {

currentUser =
null;

initialized =
false;

realtimeStarted =
false;

realtimeStarting =
false;

realtimeConversationId =
null;

if (messageChannel) {

const oldChannel =
messageChannel;

messageChannel =
null;

try {

await client.removeChannel(
oldChannel
);

} catch (_) {}

}

await closeConversation();

conversations =
[];

currentMessages =
[];

conversationContactCache.clear();

renderConversations();

return;

}

const previousUserId =
currentUser?.id ||
null;

const nextUserId =
nextUser.id;

if (
previousUserId &&
String(previousUserId) !==
String(nextUserId)
) {

realtimeStarted =
false;

realtimeStarting =
false;

if (messageChannel) {

const oldChannel =
messageChannel;

messageChannel =
null;

try {

await client.removeChannel(
oldChannel
);

} catch (_) {}

}

await closeConversation();

conversations =
[];

currentMessages =
[];

conversationContactCache.clear();

}

currentUser =
nextUser;

if (
event ===
"SIGNED_IN" ||
event ===
"INITIAL_SESSION" ||
event ===
"TOKEN_REFRESHED" ||
event ===
"USER_UPDATED"
) {

await loadConversations();

if (!currentUser) {
return;
}

setupMessageRealtime()
.catch(
error => {

console.warn(
"WFESC realtime auth startup:",
error
);

}
);

ensureSupportConversation()
.then(
supportId => {

if (
supportId &&
currentUser &&
!conversationExists(
supportId
)
) {

scheduleConversationListRefresh(
0
);

}

}
)
.catch(
error => {

console.warn(
"WFESC support auth background:",
error
);

}
);

initialized =
true;

}

} catch (error) {

wfescDebugError(
"خطأ داخل Auth State Change",
error,
{
event:
event,

user_id:
currentUser?.id ||
null
}
);

}

}
);

/* =========================================================
PUBLIC API
========================================================= */

window.WFESC_MESSAGES_CORE = {

client,

chatHeader:
chatHeaderInterface,

getCurrentUser() {
return currentUser;
},

getCurrentConversation() {
return currentConversationId;
},

getCurrentContact() {
return currentConversationContact;
},

getConversations() {
return [
...conversations
];
},

getMessages() {
return [
...currentMessages
];
},

loadConversations,

loadConversationMessages,

openConversation,

closeConversation,

ensureSupportConversation,

getConversationContact,

markConversationRead,

renderMessages,

createMessageElement,

addMessageToCurrentConversation,

applyMessageSettings,

scrollChatToBottom,

forceScrollToBottom,

prepareChatAtBottom,

setupMessageRealtime,

setupTypingChannel,

sendTypingState,

stopTyping,

showTypingIndicator,

hideTypingIndicator,

updateTypingIndicatorPosition,

loadOlderMessages() {
return loadOlderMessages();
},

hasOlderMessages() {
return hasOlderMessages;
},

isLoadingOlderMessages() {
return loadingOlderMessages;
},

normalizeContact,

refreshCurrentContactActivity,

isMessageDeleted,

getMessageDisplayContent,

getCurrentConversationBlockState,

canOpenConversationByBlock,

shouldIgnoreRealtimeMessage,

debug(
title,
details
) {

wfescDebugShow(
title,
details
);

},

debugError(
title,
error,
extra
) {

wfescDebugError(
title,
error,
extra
);

},

clearMessageCache(
conversationId =
null
) {

if (
conversationId == null
) {

conversationMessagesCache.clear();

return;

}

conversationMessagesCache.delete(
String(
conversationId
)
);

},

clearContactCache(
conversationId =
null
) {

if (
conversationId == null
) {

conversationContactCache.clear();

return;

}

conversationContactCache.delete(
String(
conversationId
)
);

}

};

/* =========================================================
START
========================================================= */

function start() {

setupMessageScroll();

setupInputEvents();

if (
document.readyState ===
"loading"
) {

document.addEventListener(
"DOMContentLoaded",
initializeAuth,
{
once:
true
}
);

} else {

initializeAuth();

}

}

start();

})();
