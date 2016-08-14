({
    mainConfigFile: "../../../require-config.js",
    optimize: "none",
    name: "local.main",
    excludeShallow: [
        "local.main",
        "local.base",
        "local.views-backbone",
        "local.views-marionette"
    ],
    out: "../../output/parts/vendor.js"
})