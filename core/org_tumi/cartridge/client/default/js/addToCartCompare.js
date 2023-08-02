'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./product/compareAddToCart'));
    processInclude(require('./components/miniCart'));
    processInclude(require('./search/product-tile'));
});
