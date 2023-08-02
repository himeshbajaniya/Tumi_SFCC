'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./product/detail'));
    processInclude(require('./components/purchase-component'));
    processInclude(require('cybersource/product/detail'));
    if ($('button.buy-it-now').length > 0) processInclude(require('./product/buyitnow'));
    processInclude(require('./accent/product'));
    processInclude(require('./login'));
    processInclude(require('./components/miniCart'));
    processInclude(require('./components/search'));
    processInclude(require('./components/bookmark'));
    processInclude(require('./reflektionCarousel'));
    processInclude(require('./storeLocator/storeLocator'));
});
