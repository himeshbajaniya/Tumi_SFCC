'use strict';

var path = require('path');
var properties = require('properties-parser');
var locale = 'x_default';

function msg(key, bundleName, defaultValue) {
    var bundlePath;
    var props;
    var resourceDirPath;
    switch(bundleName) {
        case 'errorMessages':
           resourceDirPath = './cartridges/bm_emarsys/cartridge/templates/resources/';
           break;
        case 'locale':
            resourceDirPath = './cartridges/int_emarsys/cartridge/templates/resources/';
            break;
        default:
            resourceDirPath = './cartridges/app_storefront_base/cartridge/templates/resources/';
    }

    if (!key) {
        return defaultValue;
    }
    if (bundleName) {
        if (locale !== 'x_default') {
            bundlePath = path.resolve(resourceDirPath + bundleName + '_' + locale + '.properties');
            try {
                props = properties.read(bundlePath);
                if (props[key]) {
                    return props[key];
                }
            } catch (e) {
                // continue
            }
        }
        bundlePath = path.resolve(resourceDirPath + bundleName + '.properties');
        try {
            props = properties.read(bundlePath);
            if (props[key]) {
                return props[key];
            }
        } catch (e) {
            // continue
        }
    }
    return defaultValue || key;
}

function msgf() {
    // pass through to msg if there are no extra format arguments
    if (arguments.length < 4) {
        return msg.apply(null, arguments);
    }
    var args = Array.prototype.slice.call(arguments);
    var value = msg.apply(null, args.slice(0, 3));
    return value.replace(/{(\d)}/g, function (match, p) {
        var position = Number(p);
        if (args[position + 3]) {
            return args[position + 3];
        // if no arguments found, return the original placeholder
        }
        return match;
    });
}

module.exports = {
    msg: msg,
    msgf: msgf,
    locale: locale
};
