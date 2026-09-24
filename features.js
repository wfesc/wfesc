const features = [
    "./features/settings.js",
    "./features/loading.js",
    "./features/welcome.js",
    "./features/posts-link.js"
];

features.forEach(file => {
    const script = document.createElement("script");
    script.src = file;
    script.defer = true;
    document.head.appendChild(script);
});
