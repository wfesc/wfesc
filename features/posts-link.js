(function () {
    "use strict";

    const button = document.createElement("button");

    button.textContent = "المنشورات";
    button.style.position = "fixed";
    button.style.top = "150px";
    button.style.left = "20px";
    button.style.zIndex = "999999";
    button.style.padding = "12px 20px";
    button.style.background = "#111";
    button.style.color = "#fff";
    button.style.border = "1px solid #333";
    button.style.borderRadius = "10px";
    button.style.fontSize = "14px";

    document.body.appendChild(button);
})();
