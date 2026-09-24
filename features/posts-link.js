(function () {
    "use strict";

    function addPostsLink() {
        if (document.getElementById("wfesc-posts-link")) return;

        const allLinks = document.querySelectorAll("a");
        let target = null;

        allLinks.forEach(link => {
            const text = link.textContent.trim();

            if (
                text === "تعرف علينا" ||
                text === "من نحن" ||
                text === "تعرف علينا بنا" 
            ) {
                target = link;
            }
        });

        if (!target) return;

        const postsLink = document.createElement("a");

        postsLink.id = "wfesc-posts-link";
        postsLink.href = "./posts.html";
        postsLink.textContent = "المنشورات";

        postsLink.style.cursor = "pointer";

        target.parentNode.insertBefore(
            postsLink,
            target.nextSibling
        );
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", addPostsLink);
    } else {
        addPostsLink();
    }
})();
