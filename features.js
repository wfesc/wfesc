const features = [
    "./features/settings.js",
    "./features/loading.js"
];

features.forEach(file => {
    const script = document.createElement("script");
    script.src = file;
    script.defer = true;
    document.head.appendChild(script);
});
