window.jQuery = window.$ = require('jquery');
var processInclude = require('./util');

$(document).ready(function () {
    processInclude(require('./tabs'));
    processInclude(require('./forms'));
    processInclude(require('./dynamic'));
    processInclude(require('./externalEvents'));
});
