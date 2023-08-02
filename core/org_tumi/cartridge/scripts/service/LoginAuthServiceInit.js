'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

/**
 *    HTTP Services
 * @param {Object} requestObj The param to initialize
 * @returns {Object} response for this service
 */
function createService(requestObj) {
    return LocalServiceRegistry.createService('tumi.loginAPI.auth', {
        createRequest: function (svc) {
            svc.setRequestMethod('POST');
            svc.addHeader('Accept', '*/*');
            svc.addHeader('Content-Type', 'application/x-www-form-urlencoded');
            svc.addParam('userName', requestObj.userName);
            svc.addParam('password', requestObj.password);
            return requestObj;
        },
        parseResponse: function (svc, client) {
            return client.text;
        }
    });
}

module.exports = {
    LoginAuthService: createService
};
