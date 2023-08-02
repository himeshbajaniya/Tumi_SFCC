'use strict';

var URLUtils = require('./URLUtils');

function URLAction(action, siteName) {
    this.action = action;
    this.siteName = siteName;
}

function URLParameter(aName, aValue) {
    this.aName = aName;
    this.aValue = aValue;
}

var web = {
    URLAction: URLAction,
    URLParameter: URLParameter,
    URLUtils: URLUtils
};

module.exports = web;
