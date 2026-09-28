(() => {
"use strict";

/*
============================================================
WFESC MESSAGES CHAT ACTIONS
============================================================

المسؤول عن:

- قائمة الثلاث نقاط داخل المحادثة
- حذف المحادثة
- حذف لدي
- حذف للطرفين
- تأكيدات الحذف
- حظر المستخدم
- إلغاء الحظر
- منع إرسال الرسائل للمستخدم المحظور
- إشعار الطرف الآخر عند حذف المحادثة للطرفين
- إخراج الطرف الآخر من المحادثة عبر Realtime
- الحفاظ على Messages Core كما هو

لا يتم تعديل:
messages-core.js
messages-send.js
messages-settings.js
messages-keyboard.js
messages-activity.js

============================================================
*/

const CORE =
    () =>
        window.WFESC_MESSAGES_CORE || null;


/* =========================================================
HELPERS
========================================================= */

function getClient() {

    const core =
        CORE();

    return core?.client || null;
}


function getCurrentUser() {

    const core =
        CORE();

    if (
        !core ||
        typeof core.getCurrentUser !==
        "function"
    ) {
        return null;
    }

    return core.getCurrentUser();
}


/* =========================================================
FIXED CONVERSATION ID
========================================================= */

/*
المهم هنا:

messages-core.js يحتوي:

getCurrentConversation() {
    return currentConversationId;
}

أي أن الدالة ترجع UUID مباشرة،
وليس object.

لذلك لا نحاول قراءة:
conversation.id
conversation.conversation_id

بل نأخذ القيمة مباشرة.
*/

function getConversationId() {

    const core =
        CORE();

    if (
        !core ||
        typeof core.getCurrentConversation !==
        "function"
    ) {
        return null;
    }

    const conversation =
        core.getCurrentConversation();

    if (
        conversation == null
    ) {
        return null;
    }

    /*
     * إذا كان ID مباشرًا
     */
    if (
        typeof conversation ===
        "string"
    ) {

        return conversation;
    }

    /*
     * احتياط إضافي إذا تغيّر شكل البيانات
     * مستقبلاً بدون التأثير على النسخة الحالية.
     */

    if (
        typeof conversation ===
        "object"
    ) {

        return (
            conversation.conversation_id ||
            conversation.id ||
            conversation.currentConversationId ||
            null
        );
    }

    return null;
}


/* =========================================================
CURRENT CONTACT
========================================================= */

function getCurrentContact() {

    const core =
        CORE();

    if (
        !core ||
        typeof core.getCurrentContact !==
        "function"
    ) {
        return null;
    }

    return core.getCurrentContact();
}


/* =========================================================
ESCAPE
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


/* =========================================================
TOAST
========================================================= */

function showToast(
    message,
    duration = 2200
) {

    let toast =
        document.getElementById(
            "wfescChatActionsToast"
        );

    if (!toast) {

        toast =
            document.createElement(
                "div"
            );

        toast.id =
            "wfescChatActionsToast";

        toast.dir =
            "rtl";

        toast.style.cssText = `
            position:fixed;

            left:50%;
            bottom:92px;

            transform:
                translateX(-50%)
                translateY(15px);

            z-index:9999999;

            max-width:
                calc(100vw - 32px);

            padding:
                12px 18px;

            border-radius:
                14px;

            background:
                rgba(18,18,18,.96);

            color:#fff;

            border:
                1px solid
                rgba(255,255,255,.10);

            box-shadow:
                0 15px 45px
                rgba(0,0,0,.55);

            font-size:13px;
            font-weight:600;

            text-align:center;

            opacity:0;

            pointer-events:none;

            transition:
                opacity .18s ease,
                transform .18s ease;

            backdrop-filter:
                blur(14px);

            -webkit-backdrop-filter:
                blur(14px);
        `;

        document.body.appendChild(
            toast
        );
    }

    toast.textContent =
        message;

    toast.style.opacity =
        "1";

    toast.style.transform =
        "translateX(-50%) translateY(0)";

    clearTimeout(
        toast._wfescTimer
    );

    toast._wfescTimer =
        setTimeout(
            () => {

                toast.style.opacity =
                    "0";

                toast.style.transform =
                    "translateX(-50%) translateY(15px)";

            },
            duration
        );
}


/* =========================================================
ACTION MENU
========================================================= */

let menu =
    null;


function closeMenu() {

    if (!menu) {
        return;
    }

    menu.remove();

    menu =
        null;
}


function createMenu() {

    closeMenu();

    menu =
        document.createElement(
            "div"
        );

    menu.id =
        "wfescChatActionsMenu";

    menu.dir =
        "rtl";

    menu.style.cssText = `
        position:fixed;

        z-index:999998;

        top:64px;
        left:16px;

        width:220px;

        padding:7px;

        background:
            rgba(15,15,15,.97);

        border:
            1px solid
            rgba(255,255,255,.10);

        border-radius:16px;

        box-shadow:
            0 18px 55px
            rgba(0,0,0,.65);

        backdrop-filter:
            blur(18px);

        -webkit-backdrop-filter:
            blur(18px);

        animation:
            wfescChatActionsMenuIn
            .16s ease both;
    `;

    const styleId =
        "wfescChatActionsMenuStyle";

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

            @keyframes
            wfescChatActionsMenuIn {

                from {
                    opacity:0;
                    transform:
                        translateY(-6px)
                        scale(.97);
                }

                to {
                    opacity:1;
                    transform:
                        translateY(0)
                        scale(1);
                }
            }

            #wfescChatActionsMenu
            .wfesc-chat-action-item {

                width:100%;

                display:flex;
                align-items:center;

                gap:10px;

                border:0;

                background:
                    transparent;

                color:#fff;

                padding:
                    12px 13px;

                border-radius:11px;

                font-family:
                    inherit;

                font-size:13px;

                text-align:right;

                cursor:pointer;

                transition:
                    background .15s ease;
            }

            #wfescChatActionsMenu
            .wfesc-chat-action-item:hover {

                background:
                    rgba(255,255,255,.07);
            }

            #wfescChatActionsMenu
            .wfesc-chat-action-item.danger {

                color:#ff6b6b;
            }

            #wfescChatActionsMenu
            .wfesc-chat-action-divider {

                height:1px;

                margin:
                    5px 8px;

                background:
                    rgba(255,255,255,.07);
            }
        `;

        document.head.appendChild(
            style
        );
    }

    const deleteButton =
        document.createElement(
            "button"
        );

    deleteButton.type =
        "button";

    deleteButton.className =
        "wfesc-chat-action-item danger";

    deleteButton.innerHTML =
        `
            <span>🗑️</span>
            <span>حذف المحادثة</span>
        `;

    deleteButton.addEventListener(
        "click",
        () => {

            closeMenu();

            openDeleteChoice();

        }
    );


    const divider =
        document.createElement(
            "div"
        );

    divider.className =
        "wfesc-chat-action-divider";


    const blockButton =
        document.createElement(
            "button"
        );

    blockButton.type =
        "button";

    blockButton.className =
        "wfesc-chat-action-item";

    blockButton.innerHTML =
        `
            <span>🚫</span>
            <span>حظر المستخدم</span>
        `;

    blockButton.addEventListener(
        "click",
        () => {

            closeMenu();

            openBlockConfirmation();

        }
    );


    menu.appendChild(
        deleteButton
    );

    menu.appendChild(
        divider
    );

    menu.appendChild(
        blockButton
    );

    document.body.appendChild(
        menu
    );


    setTimeout(
        () => {

            const outsideClick =
                event => {

                    if (
                        menu &&
                        !menu.contains(
                            event.target
                        )
                    ) {

                        closeMenu();

                        document.removeEventListener(
                            "pointerdown",
                            outsideClick,
                            true
                        );
                    }
                };

            document.addEventListener(
                "pointerdown",
                outsideClick,
                true
            );

        },
        0
    );
}


/* =========================================================
FIND THREE DOT BUTTON
========================================================= */

function getChatMenuButton() {

    return (
        document.getElementById(
            "chatMenuButton"
        ) ||

        document.querySelector(
            '[data-chat-menu-button]'
        ) ||

        document.querySelector(
            '.chat-menu-button'
        )
    );
}


/* =========================================================
CONFIRMATION OVERLAY
========================================================= */

function createOverlay() {

    closeOverlay();

    const overlay =
        document.createElement(
            "div"
        );

    overlay.id =
        "wfescChatActionsOverlay";

    overlay.dir =
        "rtl";

    overlay.style.cssText = `
        position:fixed;

        inset:0;

        z-index:9999998;

        display:flex;

        align-items:center;
        justify-content:center;

        padding:20px;

        background:
            rgba(0,0,0,.72);

        backdrop-filter:
            blur(12px);

        -webkit-backdrop-filter:
            blur(12px);

        animation:
            wfescActionsOverlayIn
            .18s ease both;
    `;

    const styleId =
        "wfescActionsOverlayStyle";

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

            @keyframes
            wfescActionsOverlayIn {

                from {
                    opacity:0;
                }

                to {
                    opacity:1;
                }
            }

            #wfescChatActionsOverlay
            .wfesc-actions-card {

                width:
                    min(430px, 100%);

                padding:22px;

                border-radius:20px;

                background:
                    rgba(18,18,18,.98);

                border:
                    1px solid
                    rgba(255,255,255,.10);

                box-shadow:
                    0 25px 80px
                    rgba(0,0,0,.7);

                text-align:center;
            }

            #wfescChatActionsOverlay
            .wfesc-actions-title {

                color:#fff;

                font-size:17px;

                font-weight:800;

                line-height:1.7;

                margin-bottom:10px;
            }

            #wfescChatActionsOverlay
            .wfesc-actions-message {

                color:#aaa;

                font-size:13px;

                line-height:1.8;

                margin-bottom:20px;
            }

            #wfescChatActionsOverlay
            .wfesc-actions-buttons {

                display:flex;

                gap:9px;

                flex-direction:column;
            }

            #wfescChatActionsOverlay
            .wfesc-actions-button {

                width:100%;

                border:0;

                border-radius:12px;

                padding:12px;

                font-family:inherit;

                font-size:13px;

                font-weight:700;

                cursor:pointer;
            }

            #wfescChatActionsOverlay
            .wfesc-actions-confirm {

                background:#fff;

                color:#000;
            }

            #wfescChatActionsOverlay
            .wfesc-actions-danger {

                background:#b82b2b;

                color:#fff;
            }

            #wfescChatActionsOverlay
            .wfesc-actions-cancel {

                background:#222;

                color:#ddd;
            }

            #wfescChatActionsOverlay
            .wfesc-actions-choice {

                background:#191919;

                color:#fff;

                border:
                    1px solid
                    rgba(255,255,255,.08);
            }
        `;

        document.head.appendChild(
            style
        );
    }

    return overlay;
}


function closeOverlay() {

    const old =
        document.getElementById(
            "wfescChatActionsOverlay"
        );

    if (old) {
        old.remove();
    }
}


/* =========================================================
DELETE CHOICE
========================================================= */

function openDeleteChoice() {

    const conversationId =
        getConversationId();

    if (!conversationId) {

        showToast(
            "لا توجد محادثة مفتوحة"
        );

        return;
    }

    const overlay =
        createOverlay();

    const card =
        document.createElement(
            "div"
        );

    card.className =
        "wfesc-actions-card";

    card.innerHTML = `

        <div class="wfesc-actions-title">
            حذف المحادثة
        </div>

        <div class="wfesc-actions-message">
            اختر طريقة حذف الرسائل
        </div>

        <div class="wfesc-actions-buttons">

            <button
                type="button"
                class="
                    wfesc-actions-button
                    wfesc-actions-choice
                "
                data-action="me"
            >
                حذف لدي
            </button>

            <button
                type="button"
                class="
                    wfesc-actions-button
                    wfesc-actions-danger
                "
                data-action="everyone"
            >
                حذف للطرفين
            </button>

            <button
                type="button"
                class="
                    wfesc-actions-button
                    wfesc-actions-cancel
                "
                data-action="cancel"
            >
                إلغاء
            </button>

        </div>
    `;

    overlay.appendChild(
        card
    );

    document.body.appendChild(
        overlay
    );

    card
        .querySelector(
            '[data-action="me"]'
        )
        ?.addEventListener(
            "click",
            () => {

                openDeleteConfirmation(
                    "me"
                );

            }
        );

    card
        .querySelector(
            '[data-action="everyone"]'
        )
        ?.addEventListener(
            "click",
            () => {

                openDeleteConfirmation(
                    "everyone"
                );

            }
        );

    card
        .querySelector(
            '[data-action="cancel"]'
        )
        ?.addEventListener(
            "click",
            closeOverlay
        );
}


/* =========================================================
DELETE CONFIRMATION
========================================================= */

function openDeleteConfirmation(
mode
) {

    const conversationId =
        getConversationId();

    if (!conversationId) {

        closeOverlay();

        showToast(
            "لا توجد محادثة مفتوحة"
        );

        return;
    }

    const overlay =
        createOverlay();

    const card =
        document.createElement(
            "div"
        );

    card.className =
        "wfesc-actions-card";


    let title =
        "هل أنت متأكد؟";

    let message =
        "";

    if (
        mode ===
        "everyone"
    ) {

        title =
            "هل أنت متأكد من طلبك بحذف الرسائل؟";

        message =
            "تحذير سوف تنحذف من كلا الطرفين ولا يمكن استعادتها نهائيا";

    } else {

        title =
            "هل أنت متأكد من حذف الرسائل لديك؟";

        message =
            "سيتم حذف الرسائل من حسابك فقط، وسيبقى الطرف الآخر قادراً على رؤيتها.";

    }


    card.innerHTML = `

        <div class="wfesc-actions-title">
            ${escapeHtml(title)}
        </div>

        <div class="wfesc-actions-message">
            ${escapeHtml(message)}
        </div>

        <div class="wfesc-actions-buttons">

            <button
                type="button"
                class="
                    wfesc-actions-button
                    wfesc-actions-danger
                "
                data-action="confirm"
            >
                متابعة
            </button>

            <button
                type="button"
                class="
                    wfesc-actions-button
                    wfesc-actions-cancel
                "
                data-action="cancel"
            >
                إلغاء
            </button>

        </div>
    `;

    overlay.appendChild(
        card
    );

    document.body.appendChild(
        overlay
    );

    card
        .querySelector(
            '[data-action="confirm"]'
        )
        ?.addEventListener(
            "click",
            () => {

                openFinalDeleteConfirmation(
                    mode
                );

            }
        );

    card
        .querySelector(
            '[data-action="cancel"]'
        )
        ?.addEventListener(
            "click",
            closeOverlay
        );
}


/* =========================================================
FINAL DELETE CONFIRMATION
========================================================= */

function openFinalDeleteConfirmation(
mode
) {

    const conversationId =
        getConversationId();

    if (!conversationId) {

        closeOverlay();

        showToast(
            "لا توجد محادثة مفتوحة"
        );

        return;
    }

    const overlay =
        createOverlay();

    const card =
        document.createElement(
            "div"
        );

    card.className =
        "wfesc-actions-card";


    let title =
        "";

    let message =
        "";

    if (
        mode ===
        "everyone"
    ) {

        title =
            "أكد طلبك بحذف الرسائل من الطرفين";

        message =
            "سيتم حذف المحادثة والرسائل نهائياً من الطرفين ولا يمكن استعادتها.";

    } else {

        title =
            "أكد طلبك بحذف الرسائل لديك";

        message =
            "ستختفي الرسائل من حسابك فقط.";

    }


    card.innerHTML = `

        <div class="wfesc-actions-title">
            ${escapeHtml(title)}
        </div>

        <div class="wfesc-actions-message">
            ${escapeHtml(message)}
        </div>

        <div class="wfesc-actions-buttons">

            <button
                type="button"
                class="
                    wfesc-actions-button
                    wfesc-actions-danger
                "
                data-action="final"
            >
                تأكيد الحذف
            </button>

            <button
                type="button"
                class="
                    wfesc-actions-button
                    wfesc-actions-cancel
                "
                data-action="cancel"
            >
                إلغاء
            </button>

        </div>
    `;

    overlay.appendChild(
        card
    );

    document.body.appendChild(
        overlay
    );


    card
        .querySelector(
            '[data-action="final"]'
        )
        ?.addEventListener(
            "click",
            async () => {

                await executeDelete(
                    mode,
                    conversationId
                );

            }
        );


    card
        .querySelector(
            '[data-action="cancel"]'
        )
        ?.addEventListener(
            "click",
            closeOverlay
        );
}


/* =========================================================
DELETE FOR ME
========================================================= */

async function deleteForMe(
conversationId
) {

    const client =
        getClient();

    const user =
        getCurrentUser();

    if (
        !client ||
        !user ||
        !conversationId
    ) {

        throw new Error(
            "بيانات الحذف غير متوفرة"
        );
    }

    const {
        error
    } =
        await client.rpc(
            "hide_my_conversation",
            {
                target_conversation_id:
                    conversationId
            }
        );

    if (error) {
        throw error;
    }

    return true;
}


/* =========================================================
DELETE FOR EVERYONE
========================================================= */

async function deleteForEveryone(
conversationId
) {

    const client =
        getClient();

    const user =
        getCurrentUser();

    if (
        !client ||
        !user ||
        !conversationId
    ) {

        throw new Error(
            "بيانات الحذف غير متوفرة"
        );
    }

    /*
     * نرسل Broadcast قبل حذف conversation
     * لأن حذفها من قاعدة البيانات قد ينهي
     * أي قناة مرتبطة بالمحادثة.
     */

    await broadcastConversationDeleted(
        conversationId,
        user.id
    );


    const {
        data,
        error
    } =
        await client.rpc(
            "delete_conversation_for_everyone",
            {
                target_conversation_id:
                    conversationId
            }
        );

    if (error) {
        throw error;
    }

    if (
        data === false
    ) {

        throw new Error(
            "لم يتم حذف المحادثة"
        );
    }

    return true;
}


/* =========================================================
EXECUTE DELETE
========================================================= */

async function executeDelete(
mode,
conversationId
) {

    if (!conversationId) {

        closeOverlay();

        showToast(
            "لا توجد محادثة مفتوحة"
        );

        return;
    }

    const button =
        document.querySelector(
            "#wfescChatActionsOverlay [data-action='final']"
        );

    if (button) {

        button.disabled =
            true;

        button.textContent =
            "جارٍ الحذف...";
    }

    try {

        if (
            mode ===
            "everyone"
        ) {

            await deleteForEveryone(
                conversationId
            );

        } else {

            await deleteForMe(
                conversationId
            );
        }

        closeOverlay();

        showToast(
            "تم حذف المحادثة بنجاح",
            2000
        );


        /*
         * إغلاق المحادثة مباشرة من Core
         * حتى تختفي من القائمة الحالية.
         */

        const core =
            CORE();

        if (
            core &&
            typeof core.closeConversation ===
            "function"
        ) {

            await core.closeConversation();

        }


        /*
         * إعادة تحميل القائمة من Supabase
         */

        if (
            core &&
            typeof core.loadConversations ===
            "function"
        ) {

            await core.loadConversations();

        }

    } catch (error) {

        console.error(
            "WFESC delete conversation:",
            error
        );

        closeOverlay();

        showToast(
            "تعذر حذف المحادثة"
        );

        try {

            const core =
                CORE();

            if (
                core &&
                typeof core.debugError ===
                "function"
            ) {

                core.debugError(
                    "فشل حذف المحادثة",
                    error,
                    {
                        conversation_id:
                            conversationId,

                        mode:
                            mode
                    }
                );
            }

        } catch (_) {}
    }
}


/* =========================================================
REMOTE DELETE CHANNEL
========================================================= */

const deleteChannels =
    new Map();


async function broadcastConversationDeleted(
conversationId,
userId
) {

    const client =
        getClient();

    if (
        !client ||
        !conversationId
    ) {
        return;
    }

    const channelName =
        "wfesc-chat-actions-" +
        String(
            conversationId
        );

    let channel =
        deleteChannels.get(
            conversationId
        );

    if (!channel) {

        channel =
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

        deleteChannels.set(
            conversationId,
            channel
        );

        await new Promise(
            resolve => {

                let finished =
                    false;

                const finish =
                    () => {

                        if (finished) {
                            return;
                        }

                        finished =
                            true;

                        resolve();
                    };

                channel.subscribe(
                    status => {

                        if (
                            status ===
                            "SUBSCRIBED"
                        ) {

                            finish();

                        } else if (
                            status ===
                            "CHANNEL_ERROR" ||
                            status ===
                            "TIMED_OUT"
                        ) {

                            finish();
                        }
                    }
                );

                setTimeout(
                    finish,
                    1500
                );
            }
        );
    }

    try {

        await channel.send({

            type:
                "broadcast",

            event:
                "conversation_deleted",

            payload: {

                conversation_id:
                    conversationId,

                deleted_by:
                    userId || null
            }

        });

    } catch (error) {

        console.warn(
            "WFESC delete broadcast:",
            error
        );
    }
}


/* =========================================================
LISTEN FOR REMOTE DELETE
========================================================= */

function setupRemoteDeleteListener(
conversationId
) {

    const client =
        getClient();

    if (
        !client ||
        !conversationId
    ) {
        return;
    }

    if (
        deleteChannels.has(
            conversationId
        )
    ) {
        return;
    }

    const channelName =
        "wfesc-chat-actions-" +
        String(
            conversationId
        );

    const channel =
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

    deleteChannels.set(
        conversationId,
        channel
    );


    channel.on(

        "broadcast",

        {
            event:
                "conversation_deleted"
        },

        async payload => {

            const data =
                payload?.payload ||
                payload ||
                {};

            const deletedConversationId =
                data.conversation_id;

            if (
                !deletedConversationId ||
                String(
                    deletedConversationId
                ) !==
                String(
                    conversationId
                )
            ) {
                return;
            }


            /*
             * لا نعرض الرسالة إذا كان
             * الشخص الذي حذف هو المستخدم الحالي.
             */

            const currentUser =
                getCurrentUser();

            if (
                currentUser?.id &&
                data.deleted_by &&
                String(
                    currentUser.id
                ) ===
                String(
                    data.deleted_by
                )
            ) {

                return;
            }


            showRemoteDeleteOverlay();

        }
    );


    channel.subscribe(
        status => {

            if (
                status !==
                "SUBSCRIBED"
            ) {

                console.warn(
                    "WFESC delete channel:",
                    status
                );
            }
        }
    );
}


/* =========================================================
REMOTE DELETE FULL SCREEN
========================================================= */

function showRemoteDeleteOverlay() {

    closeOverlay();

    const overlay =
        createOverlay();

    overlay.style.zIndex =
        "99999999";

    const card =
        document.createElement(
            "div"
        );

    card.className =
        "wfesc-actions-card";

    card.innerHTML = `

        <div
            style="
                font-size:38px;
                margin-bottom:12px;
            "
        >
            🗑️
        </div>

        <div class="wfesc-actions-title">
            قام الطرف الآخر بحذف الرسائل من كلا الطرفين
        </div>

        <div class="wfesc-actions-message">
            تم حذف هذه المحادثة نهائياً.
        </div>

    `;

    overlay.appendChild(
        card
    );

    document.body.appendChild(
        overlay
    );


    setTimeout(
        async () => {

            closeOverlay();

            const core =
                CORE();

            if (
                core &&
                typeof core.closeConversation ===
                "function"
            ) {

                try {

                    await core.closeConversation();

                } catch (_) {}
            }

        },
        1800
    );
}


/* =========================================================
BLOCK
========================================================= */

function getBlockedUserId() {

    const contact =
        getCurrentContact();

    if (!contact) {
        return null;
    }

    return (
        contact.user_id ||
        contact.userId ||
        contact.profile_id ||
        contact.id ||
        null
    );
}


async function isUserBlocked(
blockedUserId
) {

    const client =
        getClient();

    const user =
        getCurrentUser();

    if (
        !client ||
        !user ||
        !blockedUserId
    ) {
        return false;
    }

    const {
        data,
        error
    } =
        await client
            .from(
                "user_blocks"
            )
            .select(
                "blocker_id,blocked_id"
            )
            .eq(
                "blocker_id",
                user.id
            )
            .eq(
                "blocked_id",
                blockedUserId
            )
            .maybeSingle();

    if (error) {

        console.warn(
            "WFESC check block:",
            error
        );

        return false;
    }

    return Boolean(
        data
    );
}


/* =========================================================
BLOCK CONFIRMATION
========================================================= */

async function openBlockConfirmation() {

    const userId =
        getBlockedUserId();

    if (!userId) {

        showToast(
            "لا يمكن حظر هذا المستخدم"
        );

        return;
    }

    const contact =
        getCurrentContact();

    const name =
        contact?.display_name ||
        contact?.full_name ||
        contact?.name ||
        "المستخدم";


    let alreadyBlocked =
        false;

    try {

        alreadyBlocked =
            await isUserBlocked(
                userId
            );

    } catch (_) {}


    const overlay =
        createOverlay();

    const card =
        document.createElement(
            "div"
        );

    card.className =
        "wfesc-actions-card";


    if (
        alreadyBlocked
    ) {

        card.innerHTML = `

            <div class="wfesc-actions-title">
                إلغاء حظر المستخدم
            </div>

            <div class="wfesc-actions-message">
                المستخدم ${escapeHtml(name)}
                محظور حالياً.
            </div>

            <div class="wfesc-actions-buttons">

                <button
                    type="button"
                    class="
                        wfesc-actions-button
                        wfesc-actions-confirm
                    "
                    data-action="unblock"
                >
                    إلغاء الحظر
                </button>

                <button
                    type="button"
                    class="
                        wfesc-actions-button
                        wfesc-actions-cancel
                    "
                    data-action="cancel"
                >
                    إلغاء
                </button>

            </div>
        `;

    } else {

        card.innerHTML = `

            <div class="wfesc-actions-title">
                حظر المستخدم
            </div>

            <div class="wfesc-actions-message">
                هل أنت متأكد من حظر ${escapeHtml(name)}؟
                بعد الحظر لن يتمكن المستخدم من إرسال رسائل جديدة إليك.
            </div>

            <div class="wfesc-actions-buttons">

                <button
                    type="button"
                    class="
                        wfesc-actions-button
                        wfesc-actions-danger
                    "
                    data-action="block"
                >
                    تأكيد الحظر
                </button>

                <button
                    type="button"
                    class="
                        wfesc-actions-button
                        wfesc-actions-cancel
                    "
                    data-action="cancel"
                >
                    إلغاء
                </button>

            </div>
        `;
    }


    overlay.appendChild(
        card
    );

    document.body.appendChild(
        overlay
    );


    card
        .querySelector(
            '[data-action="block"]'
        )
        ?.addEventListener(
            "click",
            async () => {

                await blockUser(
                    userId
                );

            }
        );


    card
        .querySelector(
            '[data-action="unblock"]'
        )
        ?.addEventListener(
            "click",
            async () => {

                await unblockUser(
                    userId
                );

            }
        );


    card
        .querySelector(
            '[data-action="cancel"]'
        )
        ?.addEventListener(
            "click",
            closeOverlay
        );
}


/* =========================================================
BLOCK USER
========================================================= */

async function blockUser(
blockedUserId
) {

    const client =
        getClient();

    const user =
        getCurrentUser();

    if (
        !client ||
        !user ||
        !blockedUserId
    ) {

        showToast(
            "تعذر تنفيذ الحظر"
        );

        return;
    }

    try {

        const {
            error
        } =
            await client
                .from(
                    "user_blocks"
                )
                .insert({

                    blocker_id:
                        user.id,

                    blocked_id:
                        blockedUserId
                });

        if (
            error &&
            error.code !==
            "23505"
        ) {

            throw error;
        }


        closeOverlay();

        showToast(
            "تم حظر المستخدم"
        );


        /*
         * إغلاق المحادثة الحالية
         */

        const core =
            CORE();

        if (
            core &&
            typeof core.closeConversation ===
            "function"
        ) {

            await core.closeConversation();

        }


    } catch (error) {

        console.error(
            "WFESC block user:",
            error
        );

        closeOverlay();

        showToast(
            "تعذر حظر المستخدم"
        );
    }
}


/* =========================================================
UNBLOCK USER
========================================================= */

async function unblockUser(
blockedUserId
) {

    const client =
        getClient();

    const user =
        getCurrentUser();

    if (
        !client ||
        !user ||
        !blockedUserId
    ) {

        showToast(
            "تعذر تنفيذ إلغاء الحظر"
        );

        return;
    }

    try {

        const {
            error
        } =
            await client
                .from(
                    "user_blocks"
                )
                .delete()
                .eq(
                    "blocker_id",
                    user.id
                )
                .eq(
                    "blocked_id",
                    blockedUserId
                );

        if (error) {
            throw error;
        }

        closeOverlay();

        showToast(
            "تم إلغاء حظر المستخدم"
        );

    } catch (error) {

        console.error(
            "WFESC unblock user:",
            error
        );

        closeOverlay();

        showToast(
            "تعذر إلغاء الحظر"
        );
    }
}


/* =========================================================
SETUP REMOTE LISTENER FOR CURRENT CHAT
========================================================= */

function setupForCurrentConversation() {

    const conversationId =
        getConversationId();

    if (!conversationId) {
        return;
    }

    setupRemoteDeleteListener(
        conversationId
    );
}


/* =========================================================
WATCH CHAT HEADER
========================================================= */

window.addEventListener(
    "wfesc:chat-header-refresh",
    () => {

        setupForCurrentConversation();

    }
);


/* =========================================================
MENU BUTTON
========================================================= */

function setupMenuButton() {

    const button =
        getChatMenuButton();

    if (!button) {

        /*
         * الهيدر قد يتم إنشاؤه أو تهيئته
         * بعد تحميل هذا الملف.
         */

        return false;
    }

    if (
        button.dataset.wfescActionsReady ===
        "true"
    ) {

        return true;
    }

    button.dataset.wfescActionsReady =
        "true";


    button.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            const conversationId =
                getConversationId();

            if (!conversationId) {

                showToast(
                    "لا توجد محادثة مفتوحة"
                );

                return;
            }

            createMenu();

        }
    );


    return true;
}


/* =========================================================
RETRY BUTTON SETUP
========================================================= */

function watchForMenuButton() {

    if (
        setupMenuButton()
    ) {
        return;
    }

    let attempts =
        0;

    const timer =
        setInterval(
            () => {

                attempts++;

                if (
                    setupMenuButton() ||
                    attempts >= 60
                ) {

                    clearInterval(
                        timer
                    );
                }

            },
            250
        );
}


/* =========================================================
PUBLIC API
========================================================= */

window.WFESC_MESSAGES_CHAT_ACTIONS = {

    getConversationId,

    getCurrentContact,

    openDeleteChoice,

    openBlockConfirmation,

    closeMenu,

    closeOverlay,

    deleteForMe,

    deleteForEveryone,

    blockUser,

    unblockUser,

    setupForCurrentConversation

};


/* =========================================================
START
========================================================= */

function start() {

    watchForMenuButton();

    /*
     * إذا كانت المحادثة مفتوحة مسبقاً
     * قبل تحميل هذا الملف.
     */

    setTimeout(
        () => {

            setupForCurrentConversation();

        },
        0
    );

}


/* =========================================================
CONVERSATION CHANGE WATCH
========================================================= */

window.addEventListener(
    "wfesc:chat-header-refresh",
    () => {

        setTimeout(
            () => {

                setupForCurrentConversation();

            },
            0
        );

    }
);


start();

})();
