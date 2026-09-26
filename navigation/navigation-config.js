/* =========================================================
   WFESC NAVIGATION CONFIG
   navigation-config.js
   ========================================================= */

(function () {

    "use strict";

    if (window.WFESCNavigationConfig) {
        return;
    }

    window.WFESCNavigationConfig = {

        pages: {

            home: "index.html",

            messages: "messages.html",

            publish: "publish.html",

            profile: "profile.html",

            settings: "settings.html",

            posts: "posts.html"

        },

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

        loading: {

            enabled: true,

            minimumTime: 500,

            navigationDelay: 350,

            maximumTime: 10000

        }

    };

})();
