(function () {
    "use strict";

    function addPostsLink() {
        const nav = document.querySelector("nav");

        if (!nav) {
            setTimeout(addPostsLink, 500);
            return;
        }

        if (document.getElementById("wfesc-posts-link")) return;

        const links = nav.querySelectorAll("a");

        const postsLink = document.createElement("a");
        postsLink.id = "wfesc-posts-link";
        postsLink.href = "./posts.html";
        postsLink.textContent = "المنشورات";

        nav.insertBefore(postsLink, links[2] || null);
    }

    addPostsLink();
})();
