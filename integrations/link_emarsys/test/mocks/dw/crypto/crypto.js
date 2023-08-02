'use strict';

var Encoding = require('./Encoding');
var Mac = require('./Mac');


var crypto = {
    Encoding: Encoding,
    Mac: Mac
};

module.exports = crypto;
