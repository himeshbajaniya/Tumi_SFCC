'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./checkout/checkout'));
    processInclude(require('./checkout/cybersource/flexMicroform'));
    processInclude(require('cybersource/checkout/shippingDAV'));
    processInclude(require('valuetec/checkout/giftCard'));
});
