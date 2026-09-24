(function () {
    "use strict";

    function addPostsLink() {
        if (document.getElementById("wfesc-posts-link")) return;

        const nav = document.querySelector("nav");
        if (!nav) return;

        const aboutLink = [...nav.querySelectorAll("a")]
            .find(link => link.textContent.trim() === "من نحن");

        if (!aboutLink) return;

        const postsLink = document.createElement("a");

        postsLink.id = "wfesc-posts-link";
        postsLink.href = "./posts.html";
        postsLink.textContent = "المنشورات";

        aboutLink.insertAdjacentElement("afterend", postsLink);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", addPostsLink);
    } else {
        addPostsLink();
    }
})();
