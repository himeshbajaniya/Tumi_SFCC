'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./cart/cart'));
    processInclude(require('./components/search'));
    processInclude(require('./components/bookmark'));
    processInclude(require('./storeLocator/storeLocator'));
    processInclude(require('./login'));
    processInclude(require('./reflektionCarousel'));
});
