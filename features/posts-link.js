(function () {
    "use strict";

    function addPostsLink() {
        if (document.getElementById("wfesc-posts-link")) return;

        const links = document.querySelectorAll(".nav-links a");
        let target = null;

        links.forEach(link => {
            const text = link.textContent.trim();

            if (text === "تعرف علينا" || text === "من نحن") {
                target = link;
            }
        });

        if (!target) return;

        const postsLink = document.createElement("a");

        postsLink.id = "wfesc-posts-link";
        postsLink.href = "./posts.html";
        postsLink.textContent = "المنشورات";

        target.insertAdjacentElement("afterend", postsLink);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", addPostsLink);
    } else {
        addPostsLink();
    }
})();
