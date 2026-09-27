/* =========================================================
   WFESC PROFILE STORAGE
   الملف المسؤول عن صور الملف الشخصي والغلاف
   Bucket: wfesc-profile-images
========================================================= */

(function () {
    "use strict";

    const BUCKET_NAME = "wfesc-profile-images";
    const STORAGE_ROOT = "profiles";

    function getSupabaseClient() {
        if (window.WFESCSupabase) {
            return window.WFESCSupabase;
        }

        if (window.supabase && typeof window.supabase.createClient === "function") {
            const url =
                window.WFESC_SUPABASE_URL ||
                window.SUPABASE_URL;

            const key =
                window.WFESC_SUPABASE_KEY ||
                window.SUPABASE_KEY;

            if (url && key) {
                window.WFESCSupabase = window.supabase.createClient(url, key);
                return window.WFESCSupabase;
            }
        }

        throw new Error("Supabase client غير متوفر");
    }

    function getExtensionFromDataUrl(dataUrl) {
        if (!dataUrl || typeof dataUrl !== "string") {
            return "jpg";
        }

        const match = dataUrl.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,/);

        if (!match) {
            return "jpg";
        }

        let ext = match[1].toLowerCase();

        if (ext === "jpeg") {
            ext = "jpg";
        }

        if (!["jpg", "png", "webp"].includes(ext)) {
            ext = "jpg";
        }

        return ext;
    }

    function dataUrlToBlob(dataUrl) {
        if (!dataUrl || typeof dataUrl !== "string") {
            throw new Error("الصورة غير صالحة");
        }

        const parts = dataUrl.split(",");

        if (parts.length !== 2) {
            throw new Error("صيغة الصورة غير صالحة");
        }

        const mimeMatch = parts[0].match(/data:([^;]+);base64/);

        if (!mimeMatch) {
            throw new Error("نوع الصورة غير معروف");
        }

        const mimeType = mimeMatch[1];

        const binary = atob(parts[1]);
        const length = binary.length;
        const bytes = new Uint8Array(length);

        for (let i = 0; i < length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        return new Blob([bytes], {
            type: mimeType
        });
    }

    async function getCurrentUserId() {
        const supabase = getSupabaseClient();

        const {
            data,
            error
        } = await supabase.auth.getUser();

        if (error) {
            throw error;
        }

        if (!data || !data.user || !data.user.id) {
            throw new Error("يجب تسجيل الدخول أولًا");
        }

        return data.user.id;
    }

    function buildPath(userId, type, extension) {
        const safeType = type === "cover" ? "cover" : "avatar";

        return (
            STORAGE_ROOT +
            "/" +
            userId +
            "/" +
            safeType +
            "." +
            extension
        );
    }

    async function uploadImage(options) {
        options = options || {};

        const type = options.type === "cover"
            ? "cover"
            : "avatar";

        const dataUrl = options.dataUrl;

        if (!dataUrl) {
            throw new Error("لم يتم اختيار صورة");
        }

        const userId = options.userId || await getCurrentUserId();

        const extension = getExtensionFromDataUrl(dataUrl);
        const blob = dataUrlToBlob(dataUrl);

        const path = buildPath(
            userId,
            type,
            extension
        );

        const supabase = getSupabaseClient();

        const {
            error: uploadError
        } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(
                path,
                blob,
                {
                    contentType: blob.type || "image/jpeg",
                    upsert: true,
                    cacheControl: "3600"
                }
            );

        if (uploadError) {
            throw uploadError;
        }

        const {
            data: publicData
        } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(path);

        const publicUrl =
            publicData &&
            publicData.publicUrl
                ? publicData.publicUrl
                : "";

        if (!publicUrl) {
            throw new Error("تعذر إنشاء رابط الصورة");
        }

        const cleanUrl =
            publicUrl +
            (publicUrl.includes("?") ? "&" : "?") +
            "v=" +
            Date.now();

        return {
            success: true,
            type: type,
            userId: userId,
            path: path,
            publicUrl: publicUrl,
            cleanUrl: cleanUrl
        };
    }

    async function deleteImage(options) {
        options = options || {};

        const type = options.type === "cover"
            ? "cover"
            : "avatar";

        const userId = options.userId || await getCurrentUserId();

        const supabase = getSupabaseClient();

        const possiblePaths = [
            buildPath(userId, type, "jpg"),
            buildPath(userId, type, "png"),
            buildPath(userId, type, "webp")
        ];

        const {
            error
        } = await supabase.storage
            .from(BUCKET_NAME)
            .remove(possiblePaths);

        if (error) {
            throw error;
        }

        return {
            success: true,
            type: type,
            userId: userId
        };
    }

    function getPublicUrl(path) {
        if (!path) {
            return "";
        }

        const supabase = getSupabaseClient();

        const {
            data
        } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(path);

        return data && data.publicUrl
            ? data.publicUrl
            : "";
    }

    async function checkStorage() {
        const supabase = getSupabaseClient();

        const {
            data,
            error
        } = await supabase.storage
            .from(BUCKET_NAME)
            .list(
                STORAGE_ROOT,
                {
                    limit: 1
                }
            );

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

    window.WFESCProfileStorage = {
        uploadImage,
        deleteImage,
        getPublicUrl,
        checkStorage,
        getCurrentUserId
    };

})();
