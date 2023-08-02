'use strict';

window.jQuery = window.$ = require('jquery');
var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./components/device'));
    processInclude(require('./components/menu'));
    processInclude(require('base/components/cookie'));
    processInclude(require('base/components/consentTracking'));
    processInclude(require('./components/footer'));
    processInclude(require('./components/clientSideValidation'));
    processInclude(require('pixlee/pixlee/events'));
    processInclude(require('./common'));
});

require('bootstrap/js/src/util.js');
require('bootstrap/js/src/carousel.js');
require('bootstrap/js/src/modal.js');
require('bootstrap/js/src/tab.js');
require('bootstrap/js/src/tooltip');
require('base/components/spinner');