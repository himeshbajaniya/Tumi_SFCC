var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var FtpClientHelper = require('*/cartridge/scripts/helpers/ftpClientHelper');
/**
 * @description Returns a newly initialized service related to the given {serviceID}
 * If the service does not exists, this method will throw an error
 * This method should only be used to initialize (S)FTP services as the create request is based
 * on the assumption that the service is an instance of the dw.src.FTPService class
 *
 * @param {string} serviceID The service to initialize
 *
 * @throw {Error} If the service does not exists in the Business Manager
 *
 * @returns {Object} constructor function
 */
module.exports.getFTPService = function (serviceID) {
    var ftpService = LocalServiceRegistry.createService(serviceID, {
        createRequest: function (service) {
            var args = Array.prototype.slice.call(arguments, 1);
            service.setOperation.apply(service, args);
            return service;
        },
        parseResponse: function (service, result) {
            return result;
        },
        filterLogMessage: function () {}
    });

    return new FtpClientHelper(ftpService);
};
