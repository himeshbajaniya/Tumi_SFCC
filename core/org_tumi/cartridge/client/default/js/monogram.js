'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./monogram/base'));
    processInclude(require('./monogram/classic'));
    processInclude(require('./monogram/premium'));
});
