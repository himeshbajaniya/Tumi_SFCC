'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./login'));
    processInclude(require('./components/store-component'));
    // processInclude(require('./components/miniCart'));
    processInclude(require('./components/search'));
    processInclude(require('./storeLocator/storeLocator'));
    processInclude(require('./components/hero-component'));
    processInclude(require('./components/sub-hero-component'));
    processInclude(require('./components/content-banner'));
    processInclude(require('./components/tumi-at-your-service'));
    processInclude(require('./components/best-seller'));
    processInclude(require('./components/bookmark'));
    processInclude(require('./reflektionCarousel'));
    processInclude(require('./components/homePageIntersection'));
    processInclude(require('./product/compare'));
});
