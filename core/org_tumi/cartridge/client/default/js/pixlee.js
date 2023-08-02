'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('pixlee/pixlee/widgets/pdp'));
    processInclude(require('pixlee/pixlee/widgets/clp'));
    processInclude(require('pixlee/pixlee/widgets/homePage'));
});
