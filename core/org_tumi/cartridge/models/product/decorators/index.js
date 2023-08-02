'use strict';

const assign = require("modules/server/assign");

const EXPORTS = {};
[
    "customProductAttributes",
    "compareGroupAttributes",
    "buyItNow",
    "availableToSell",
    "selectedVariant",
    "monogram",
    "sceneProductId",
    "badges"
].forEach(function (decorator) {
    EXPORTS[decorator] = require('*/cartridge/models/product/decorators/' + decorator);
});

module.exports = assign(module.superModule, EXPORTS);