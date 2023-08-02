'use strict';

/* API Includes */
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

/* Script Modules */
var reflektionHelper = require('~/cartridge/scripts/reflektionHelper');
var service = reflektionHelper.SERVICES.UPLOAD;

/**
 * Reflektion SFTP Service
 *
 * @returns {FTPService} the service
 */
exports.get = function () {
    return LocalServiceRegistry.createService(service, {
        createRequest: function (svc, serviceConfig) {
            svc.setCredentialID(serviceConfig.credentials);
        },
        parseResponse: function (svc, resp) {
            return resp;
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });
};
