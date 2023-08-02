'use strict';

function error(msg, args) {
    this.log.error(msg, Array.prototype.slice.call(arguments, 1, arguments.length));
}

function debug(msg, args) {
    this.log.debug(msg, Array.prototype.slice.call(arguments, 1, arguments.length));
}

function Log(category) {
    this.log = require('dw/system/Logger').getLogger('settlement', category || 'settlement');
    this.error = error;
    this.debug = debug;
}

module.exports = Log;