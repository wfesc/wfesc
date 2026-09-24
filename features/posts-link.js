<!DOCTYPE html>
<html lang="ar" dir="rtl">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>منشورات WFESC</title>

    <style>

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        html {
            scroll-behavior: smooth;
        }

        body {
            background: #050505;
            color: #fff;
            font-family: Arial, Tahoma, sans-serif;
            min-height: 100vh;
            overflow-x: hidden;
        }


        /* =========================
           شاشة التحميل
        ========================= */

        #posts-loader {
            position: fixed;
            inset: 0;
            z-index: 99999;

            display: flex;
            align-items: center;
            justify-content: center;

            background: #050505;

            transition:
                opacity .7s ease,
                visibility .7s ease;
        }

        #posts-loader.hide {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
        }

        .loader-content {
            width: 90%;
            max-width: 360px;
            text-align: center;
        }

        .loader-logo {
            font-size: 42px;
            font-weight: bold;
            letter-spacing: 8px;

            animation: logoPulse 1.8s ease-in-out infinite;
        }

        .loader-subtitle {
            margin-top: 12px;

            color: #777;

            font-size: 11px;
            letter-spacing: 4px;
        }

        .loader-line {
            width: 100%;
            height: 2px;

            margin-top: 30px;

            background: #171717;

            overflow: hidden;
            border-radius: 20px;
        }

        .loader-line::after {
            content: "";

            display: block;

            width: 35%;
            height: 100%;

            background: #fff;

            animation: loadingLine 1.4s ease-in-out infinite;
        }

        .loader-text {
            margin-top: 15px;

            color: #666;

            font-size: 12px;
        }

        @keyframes logoPulse {

            0%,
            100% {
                opacity: .45;
                transform: scale(.98);
            }

            50% {
                opacity: 1;
                transform: scale(1);
            }
        }

        @keyframes loadingLine {

            0% {
                transform: translateX(350%);
            }

            100% {
                transform: translateX(-350%);
            }
        }


        /* =========================
           الهيدر
        ========================= */

        .posts-header {
            position: fixed;

            top: 0;
            right: 0;
            left: 0;

            height: 65px;

            z-index: 1000;

            display: flex;
            align-items: center;
            justify-content: space-between;

            padding: 0 20px;

            background: rgba(5, 5, 5, .88);

            border-bottom: 1px solid #202020;

            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
        }

        .posts-logo {
            font-size: 18px;
            font-weight: bold;

            letter-spacing: 3px;
        }

        .back-button {
            border: 1px solid #292929;

            background: #101010;

            color: #fff;

            padding: 8px 14px;

            border-radius: 9px;

            cursor: pointer;

            text-decoration: none;

            font-size: 13px;

            transition: .25s;
        }

        .back-button:hover {
            background: #fff;
            color: #000;
        }


        /* =========================
           المنشورات
        ========================= */

        .posts-container {

            width: 100%;
            max-width: 600px;

            margin: auto;

            padding-top: 65px;
        }

        .post {

            min-height: calc(100vh - 65px);

            display: flex;
            flex-direction: column;
            justify-content: center;

            padding: 20px 14px 35px;

            border-bottom: 1px solid #202020;

            opacity: 0;
            transform: translateY(35px);

            animation: postAppear .8s ease forwards;
        }

        .post:nth-child(2) {
            animation-delay: .15s;
        }

        .post:nth-child(3) {
            animation-delay: .3s;
        }

        .post:nth-child(4) {
            animation-delay: .45s;
        }

        @keyframes postAppear {

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }


        /* =========================
           الصور
        ========================= */

        .post-media {

            width: 100%;
            max-height: 72vh;

            object-fit: contain;

            background: #090909;

            border-radius: 16px;

            display: block;

            transition:
                transform .4s ease,
                filter .4s ease;
        }

        .post-media:hover {

            transform: scale(1.01);

            filter: brightness(1.08);
        }


        /* =========================
           الفيديو
        ========================= */

        .post-video {

            width: 100%;
            max-height: 72vh;

            border-radius: 16px;

            background: #000;

            display: block;
        }


        /* =========================
           معلومات المنشور
        ========================= */

        .post-info {

            padding: 18px 5px 0;
        }

        .post-title {

            font-size: 19px;

            margin-bottom: 9px;
        }

        .post-text {

            color: #aaa;

            font-size: 14px;

            line-height: 1.8;
        }

        .post-meta {

            margin-top: 12px;

            color: #666;

            font-size: 11px;
        }


        /* =========================
           أزرار المنشور
        ========================= */

        .post-actions {

            display: flex;

            gap: 8px;

            margin-top: 16px;
        }

        .post-action {

            border: 1px solid #252525;

            background: #0c0c0c;

            color: #aaa;

            padding: 8px 13px;

            border-radius: 9px;

            font-size: 12px;

            cursor: pointer;

            transition: .25s;
        }

        .post-action:hover {

            background: #151515;

            color: #fff;

            border-color: #444;
        }


        /* =========================
           حالة عدم وجود منشورات
        ========================= */

        .empty-posts {

            min-height: 100vh;

            display: flex;

            align-items: center;

            justify-content: center;

            text-align: center;

            padding: 30px;

            color: #777;
        }


        /* =========================
           الهاتف
        ========================= */

        @media (max-width: 600px) {

            .posts-header {
                padding: 0 13px;
            }

            .posts-logo {
                font-size: 16px;
            }

            .post {

                padding:
                    15px
                    10px
                    30px;
            }

            .post-media,
            .post-video {

                border-radius: 13px;
            }

            .post-title {
                font-size: 17px;
            }

            .post-text {
                font-size: 13px;
            }

        }

    </style>

</head>


<body>


    <!-- =========================
         شاشة التحميل
    ========================= -->

    <div id="posts-loader">

        <div class="loader-content">

            <div class="loader-logo">
                WFESC
            </div>

            <div class="loader-subtitle">
                POSTS
            </div>

            <div class="loader-line"></div>

            <div class="loader-text">
                جاري تحميل المنشورات...
            </div>

        </div>

    </div>


    <!-- =========================
         الهيدر
    ========================= -->

    <header class="posts-header">

        <div class="posts-logo">
            WFESC
        </div>

        <a
            class="back-button"
            href="./index.html"
        >
            الرئيسية
        </a>

    </header>


    <!-- =========================
         المنشورات
    ========================= -->

    <main class="posts-container">


        <!-- المنشور الأول -->

        <section class="post">

            <img
                class="post-media"
                src="./sorg.jpg"
                alt="WFESC"
            >

            <div class="post-info">

                <h2 class="post-title">
                    مرحباً بكم في WFESC
                </h2>

                <p class="post-text">
                    ذاكرة العراق بصورة مختلفة.
                    هنا تبدأ رحلة المنشورات والمحتوى الخاص بـ WFESC.
                </p>

                <div class="post-meta">
                    WFESC
                </div>

                <div class="post-actions">

                    <button
                        class="post-action"
                        type="button"
                    >
                        ♡ إعجاب
                    </button>

                    <button
                        class="post-action"
                        type="button"
                    >
                        💬 تعليق
                    </button>

                </div>

            </div>

        </section>


    </main>


    <script>

        /* =========================
           تشغيل شاشة التحميل
        ========================= */

        window.addEventListener("load", function () {

            setTimeout(function () {

                const loader =
                    document.getElementById("posts-loader");

                if (loader) {

                    loader.classList.add("hide");

                }

            }, 1300);

        });


        /* =========================
           منع النقر الوهمي حالياً
        ========================= */

        document
            .querySelectorAll(".post-action")
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        /*

                        سيتم ربط هذه الأزرار
                        بنظام اللايك والتعليقات لاحقاً.

                        */

                    }
                );

            });

    </script>


</body>

</html>
