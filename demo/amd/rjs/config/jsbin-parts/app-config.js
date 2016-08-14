({
    mainConfigFile: "../../../require-config.js",
    optimize: "none",
    name: "local.main",
    exclude: [
        "usertiming",
        "jquery",
        "underscore",
        "backbone",
        "marionette",
        "backbone.declarative.views",
        'backbone.inline.template'
    ],
    out: "../../output/parts/app.js"
})