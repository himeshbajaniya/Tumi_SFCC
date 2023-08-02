'use strict';

if (!window.$) {
    window.jQuery = window.$ = require('jquery');
}

var processInclude = require('./util');

$(document).ready(function () {
    processInclude(require('./emarsysAnalytics'));
    processInclude(require('./emarsysSubscription'));
});
