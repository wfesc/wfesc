
window.WFESCNavigationSettings = {

    /*
     * ==========================================
     * صفحات الموقع
     * ==========================================
     */

    pages: {
        home: "index.html",
        messages: "messages.html",
        publish: "publish.html",
        profile: "profile.html",
        settings: "settings.html",
        posts: "posts.html"
    },


    /*
     * ==========================================
     * خيارات شريط التنقل
     * ==========================================
     */

    buttons: [

        {
            id: "home",
            title: "البداية",
            icon: "⌂",
            page: "home"
        },

        {
            id: "messages",
            title: "الرسائل",
            icon: "💬",
            page: "messages"
        },

        {
            id: "publish",
            title: "النشر",
            icon: "＋",
            page: "publish"
        },

        {
            id: "profile",
            title: "الملف الشخصي",
            icon: "👤",
            page: "profile"
        },

        {
            id: "settings",
            title: "الإعدادات",
            icon: "⚙",
            page: "settings"
        },

        {
            id: "posts",
            title: "المنشورات",
            icon: "🏷️",
            page: "posts"
        }

    ],


    /*
     * ==========================================
     * إعدادات التحميل
     * ==========================================
     */

    loading: {

        enabled: true,

        // أقل مدة تظهر فيها شاشة التحميل
        minimumTime: 500,

        // مدة الانتظار قبل الانتقال للصفحة الجديدة
        navigationDelay: 350,

        // أقصى مدة احتياطية حتى لا تبقى الشاشة عالقة
        maximumTime: 10000

    },


    /*
     * ==========================================
     * إعدادات الواجهة
     * ==========================================
     */

    interface: {

        // إظهار شريط التنقل بعد انتهاء تحميل الصفحة
        showAfterLoad: true,

        // إخفاء شريط التنقل أثناء الانتقال
        hideDuringNavigation: true,

        // إظهار شاشة التحميل
        showLoadingScreen: true

    }

};
