'use strict';

/* eslint-disable */
module.exports = {
    isDisabled: function (params) {
        if (empty(params)) {
            return false;
        }
        return ['true', true].indexOf(params.IsDisabled) > -1;
    },
    replacePathPlaceholders: function (path) {
        if (empty(path)) {
            return path;
        }
        return {
            charAt: function(index) {
                return {
                    equals: () => true
                }
            }
        };
    }
};
