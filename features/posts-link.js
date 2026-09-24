(function () {
    "use strict";

    function addPostsButton() {
        if (document.getElementById("wfesc-posts-button")) return;

        const aboutButton = document.querySelector('.main-btn[href="#about"]');

        if (!aboutButton) return;

        const postsButton = document.createElement("a");

        postsButton.id = "wfesc-posts-button";
        postsButton.href = "./posts.html";
        postsButton.textContent = "عرض المنشورات";

        postsButton.style.marginTop = "12px";
        postsButton.style.display = "inline-block";
        postsButton.style.padding = "13px 27px";
        postsButton.style.border = "1px solid #303030";
        postsButton.style.borderRadius = "12px";
        postsButton.style.color = "#fff";
        postsButton.style.textDecoration = "none";
        postsButton.style.background = "#0b0b0b";
        postsButton.style.transition = ".3s";

        postsButton.addEventListener("mouseenter", function () {
            postsButton.style.background = "#151515";
            postsButton.style.borderColor = "#555";
        });

        postsButton.addEventListener("mouseleave", function () {
            postsButton.style.background = "#0b0b0b";
            postsButton.style.borderColor = "#303030";
        });

        aboutButton.insertAdjacentElement("afterend", postsButton);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", addPostsButton);
    } else {
        addPostsButton();
    }
})();
