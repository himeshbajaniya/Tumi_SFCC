'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./profile/profile'));
    processInclude(require('./addressBook/addressBook'));
    processInclude(require('./orderHistory/orderHistory'));
    processInclude(require('./components/shoppingPreference'));
    processInclude(require('./components/communicationPreference'));
    processInclude(require('./monogram/my-monogram'));
    processInclude(require('./mysetting/mysetting'));
});
