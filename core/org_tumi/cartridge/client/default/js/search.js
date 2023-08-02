'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    // processInclude(require('base/product/quickView')); Currently we don't have SLP and PLP so commented the quickView.
    processInclude(require('./search/product-landing'));
    // processInclude(require('./product/compare'));
    processInclude(require('./search/product-tile'));
});
