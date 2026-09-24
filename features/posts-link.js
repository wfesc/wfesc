(function () {
    "use strict";

    function initPostsLink() {
        if (document.getElementById("wfesc-posts-link")) {
            return;
        }

        const nav = document.querySelector("nav");

        if (!nav) {
            return;
        }

        const links = nav.querySelectorAll("a");

        if (links.length < 2) {
            return;
        }

        const postsLink = document.createElement("a");

        postsLink.id = "wfesc-posts-link";
        postsLink.href = "./posts.html";
        postsLink.textContent = "المنشورات";

        postsLink.style.color = "#aaa";
        postsLink.style.textDecoration = "none";
        postsLink.style.margin = "0 16px";
        postsLink.style.fontSize = "14px";
        postsLink.style.transition = ".3s";

        postsLink.addEventListener("mouseenter", function () {
            postsLink.style.color = "#fff";
        });

        postsLink.addEventListener("mouseleave", function () {
            postsLink.style.color = "#aaa";
        });

        nav.insertBefore(postsLink, links[2]);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initPostsLink);
    } else {
        initPostsLink();
    }

})();
