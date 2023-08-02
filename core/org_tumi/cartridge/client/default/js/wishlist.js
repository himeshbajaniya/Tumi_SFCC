'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./wishlist/wishlist'));
    // processInclude(require('./product/compare'));
});
