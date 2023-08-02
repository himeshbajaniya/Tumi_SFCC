'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var serviceName = 'tumi.janrain.authinfo.service';
var serviceConfig = {
    createRequest: function (service, requestDataContainer) {
        var token = requestDataContainer.token;
        service.setRequestMethod('GET');
        var serviceCredential = service.configuration.credential;
        var apiKey = serviceCredential.user;
        var serviceUrl = serviceCredential.URL;
        serviceUrl += '?apiKey=' + apiKey + '&token=' + token;
        var requestData = {};
        service.setURL(serviceUrl);
        requestData.token = token;
        requestData.apiKey = apiKey;
        return requestData;
    },
    parseResponse: function (service, serviceResponse) {
        return serviceResponse.text;
    },
    filterLogMessage: function (msg) {
        return msg;
    }
};
exports.JanrainAuthInfoService = LocalServiceRegistry.createService(serviceName, serviceConfig);
