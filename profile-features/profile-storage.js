
(function () {
    "use strict";

    /*
     * WFESC Profile Storage
     * ---------------------
     * مسؤول عن:
     * - رفع صورة الحساب
     * - رفع صورة الغلاف
     * - حذف صورة الحساب
     * - حذف صورة الغلاف
     * - استخدام نفس Supabase الخاص بالموقع
     *
     * Bucket المطلوب:
     * wfesc-profile-images
     */

    if (window.WFESCProfileStorage) {
        return;
    }

    const STORAGE_BUCKET = "wfesc-profile-images";
    const STORAGE_ROOT = "profiles";

    let storageClient = null;


    /* =========================================================
       CONFIG
    ========================================================= */

    function getConfig() {
        const config = window.WFESCSettingsAuthConfig;

        if (!config) {
            throw new Error("WFESC_AUTH_CONFIG_NOT_FOUND");
        }

        if (!config.supabaseUrl || !config.supabaseKey) {
            throw new Error("WFESC_SUPABASE_CONFIG_INVALID");
        }

        return config;
    }


    /* =========================================================
       SUPABASE CLIENT
    ========================================================= */

    function getClient() {

        /*
         * إذا كان settings-auth.js قد وفّر العميل
         * نستخدمه مباشرة.
         */

        if (
            window.WFESCSettingsAuthClient &&
            typeof window.WFESCSettingsAuthClient.storage !== "undefined"
        ) {
            return window.WFESCSettingsAuthClient;
        }


        /*
         * إذا لم يكن متوفرًا، ننشئ عميلًا من نفس
         * إعدادات Supabase الموجودة بالموقع.
         */

        if (
            storageClient &&
            typeof storageClient.storage !== "undefined"
        ) {
            return storageClient;
        }

        if (
            !window.supabase ||
            typeof window.supabase.createClient !== "function"
        ) {
            throw new Error("SUPABASE_LIBRARY_NOT_READY");
        }

        const config = getConfig();

        storageClient = window.supabase.createClient(
            config.supabaseUrl,
            config.supabaseKey
        );

        return storageClient;
    }


    /* =========================================================
       CURRENT USER
    ========================================================= */

    async function getCurrentUser() {

        /*
         * نستخدم نظام تسجيل الدخول الأصلي أولًا.
         */

        if (
            window.WFESCSettingsAuth &&
            typeof window.WFESCSettingsAuth.getCurrentUser === "function"
        ) {
            const result =
                await window.WFESCSettingsAuth.getCurrentUser();

            const user =
                result?.data?.user ||
                result?.user ||
                result;

            if (user && user.id) {
                return user;
            }
        }


        if (
            window.WFESCSettingsAuth &&
            typeof window.WFESCSettingsAuth.getUser === "function"
        ) {
            const result =
                await window.WFESCSettingsAuth.getUser();

            const user =
                result?.data?.user ||
                result?.user ||
                result;

            if (user && user.id) {
                return user;
            }
        }


        /*
         * احتياطًا نقرأ المستخدم من نفس جلسة Supabase.
         */

        const client = getClient();

        const { data, error } =
            await client.auth.getUser();

        if (error) {
            throw error;
        }

        if (!data || !data.user) {
            throw new Error("WFESC_LOGIN_REQUIRED");
        }

        return data.user;
    }


    /* =========================================================
       VALIDATE IMAGE TYPE
    ========================================================= */

    function validateImageType(type) {

        if (type !== "avatar" && type !== "cover") {
            throw new Error("WFESC_INVALID_IMAGE_TYPE");
        }

        return true;
    }


    /* =========================================================
       DATA URL -> BLOB
    ========================================================= */

    function dataUrlToBlob(dataUrl) {

        if (
            typeof dataUrl !== "string" ||
            !dataUrl.startsWith("data:")
        ) {
            throw new Error("WFESC_INVALID_IMAGE_DATA");
        }

        const parts = dataUrl.split(",");

        if (parts.length !== 2) {
            throw new Error("WFESC_INVALID_DATA_URL");
        }

        const header = parts[0];
        const base64 = parts[1];

        const mimeMatch =
            header.match(/data:([^;]+);base64/);

        const mimeType =
            mimeMatch && mimeMatch[1]
                ? mimeMatch[1]
                : "image/jpeg";

        let binary;

        try {
            binary = atob(base64);
        } catch (error) {
            throw new Error("WFESC_INVALID_BASE64");
        }

        const length = binary.length;
        const bytes = new Uint8Array(length);

        for (let i = 0; i < length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        return {
            blob: new Blob([bytes], {
                type: mimeType
            }),
            mimeType
        };
    }


    /* =========================================================
       FILE EXTENSION
    ========================================================= */

    function getExtension(mimeType) {

        switch (mimeType) {

            case "image/png":
                return "png";

            case "image/webp":
                return "webp";

            case "image/gif":
                return "gif";

            case "image/jpeg":
            case "image/jpg":
            default:
                return "jpg";
        }
    }


    /* =========================================================
       STORAGE PATH
    ========================================================= */

    function getStoragePath(userId, type, extension) {

        validateImageType(type);

        if (!userId) {
            throw new Error("WFESC_USER_ID_REQUIRED");
        }

        return (
            STORAGE_ROOT +
            "/" +
            userId +
            "/" +
            type +
            "." +
            extension
        );
    }


    /* =========================================================
       REMOVE OLD IMAGE FILES
    ========================================================= */

    async function removeImageFiles(userId, type) {

        validateImageType(type);

        if (!userId) {
            throw new Error("WFESC_USER_ID_REQUIRED");
        }

        const client = getClient();

        const folder =
            STORAGE_ROOT +
            "/" +
            userId;

        const { data, error } =
            await client.storage
                .from(STORAGE_BUCKET)
                .list(folder, {
                    limit: 100,
                    offset: 0
                });

        if (error) {
            throw error;
        }

        if (!Array.isArray(data) || data.length === 0) {
            return {
                removed: false,
                files: []
            };
        }

        const allowedNames = [
            type + ".jpg",
            type + ".jpeg",
            type + ".png",
            type + ".webp",
            type + ".gif"
        ];

        const filesToDelete = data
            .filter(function (file) {
                return allowedNames.includes(file.name);
            })
            .map(function (file) {
                return folder + "/" + file.name;
            });

        if (filesToDelete.length === 0) {
            return {
                removed: false,
                files: []
            };
        }

        const { error: removeError } =
            await client.storage
                .from(STORAGE_BUCKET)
                .remove(filesToDelete);

        if (removeError) {
            throw removeError;
        }

        return {
            removed: true,
            files: filesToDelete
        };
    }


    /* =========================================================
       UPLOAD IMAGE
    ========================================================= */

    async function uploadImage(options) {

        options = options || {};

        const type = options.type;
        const dataUrl = options.dataUrl;
        const userId = options.userId || null;

        validateImageType(type);

        if (!dataUrl) {
            throw new Error("WFESC_IMAGE_REQUIRED");
        }

        const user =
            userId
                ? { id: userId }
                : await getCurrentUser();

        if (!user || !user.id) {
            throw new Error("WFESC_LOGIN_REQUIRED");
        }

        const converted =
            dataUrlToBlob(dataUrl);

        const blob =
            converted.blob;

        const mimeType =
            converted.mimeType;

        const extension =
            getExtension(mimeType);

        const path =
            getStoragePath(
                user.id,
                type,
                extension
            );

        const client = getClient();


        /*
         * نحذف النسخ القديمة أولًا حتى لا تبقى
         * صور قديمة داخل Storage.
         */

        try {
            await removeImageFiles(
                user.id,
                type
            );
        } catch (removeError) {

            /*
             * إذا كانت الملفات القديمة غير موجودة
             * نكمل الرفع بشكل طبيعي.
             *
             * أما أخطاء الصلاحيات وغيرها فنتركها
             * حتى لا يتم رفع الصورة بشكل غير صحيح.
             */

            if (
                removeError &&
                removeError.message &&
                !String(removeError.message)
                    .toLowerCase()
                    .includes("not found")
            ) {
                console.warn(
                    "WFESC Storage old image cleanup:",
                    removeError
                );
            }
        }


        /*
         * رفع الصورة الجديدة.
         */

        const { data, error } =
            await client.storage
                .from(STORAGE_BUCKET)
                .upload(
                    path,
                    blob,
                    {
                        cacheControl: "3600",
                        upsert: true,
                        contentType: mimeType
                    }
                );

        if (error) {
            throw error;
        }


        /*
         * الحصول على الرابط العام.
         */

        const publicResult =
            client.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(path);

        const publicUrl =
            publicResult &&
            publicResult.data &&
            publicResult.data.publicUrl
                ? publicResult.data.publicUrl
                : "";


        if (!publicUrl) {
            throw new Error(
                "WFESC_PUBLIC_URL_NOT_FOUND"
            );
        }


        /*
         * إضافة رقم نسخة للرابط حتى لا يعرض
         * المتصفح الصورة القديمة من Cache.
         */

        const finalUrl =
            publicUrl +
            "?v=" +
            Date.now();


        return {
            success: true,
            type: type,
            userId: user.id,
            path: data?.path || path,
            publicUrl: finalUrl,
            cleanUrl: publicUrl
        };
    }


    /* =========================================================
       DELETE IMAGE
    ========================================================= */

    async function deleteImage(options) {

        options = options || {};

        const type = options.type;
        const userId = options.userId || null;

        validateImageType(type);

        const user =
            userId
                ? { id: userId }
                : await getCurrentUser();

        if (!user || !user.id) {
            throw new Error("WFESC_LOGIN_REQUIRED");
        }

        const result =
            await removeImageFiles(
                user.id,
                type
            );

        return {
            success: true,
            type: type,
            userId: user.id,
            removed: result.removed
        };
    }


    /* =========================================================
       GET PUBLIC URL
    ========================================================= */

    function getPublicUrl(path) {

        if (!path) {
            return "";
        }

        const client = getClient();

        const result =
            client.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(path);

        if (
            !result ||
            !result.data ||
            !result.data.publicUrl
        ) {
            return "";
        }

        return (
            result.data.publicUrl +
            "?v=" +
            Date.now()
        );
    }


    /* =========================================================
       CHECK STORAGE
    ========================================================= */

    async function checkStorage() {

        const client = getClient();

        const { data, error } =
            await client.storage
                .from(STORAGE_BUCKET)
                .list("", {
                    limit: 1,
                    offset: 0
                });

        if (error) {
            return {
                success: false,
                error: error
            };
        }

        return {
            success: true,
            data: data || []
        };
    }


    /* =========================================================
       PUBLIC API
    ========================================================= */

    window.WFESCProfileStorage = {

        bucket: STORAGE_BUCKET,

        root: STORAGE_ROOT,

        getClient: getClient,

        getCurrentUser: getCurrentUser,

        uploadImage: uploadImage,

        deleteImage: deleteImage,

        removeImageFiles: removeImageFiles,

        getPublicUrl: getPublicUrl,

        checkStorage: checkStorage

    };


    /*
     * جاهز.
     */

    console.log(
        "WFESC Profile Storage loaded."
    );

})();
