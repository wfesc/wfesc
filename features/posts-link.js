(function () {
    "use strict";

    function addPostsButton() {
        if (document.getElementById("wfesc-posts-button")) {
            return;
        }

        const aboutButton = document.querySelector(
            '.hero a.main-btn[href="#about"]'
        );

        if (!aboutButton) {
            return;
        }

        const postsButton = document.createElement("a");

        postsButton.id = "wfesc-posts-button";
        postsButton.className = "main-btn";
        postsButton.href = "./posts.html";
        postsButton.textContent = "عرض المنشورات";

        postsButton.style.marginTop = "12px";

        aboutButton.insertAdjacentElement(
            "afterend",
            postsButton
        );
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", addPostsButton);
    } else {
        addPostsButton();
    }

})();
