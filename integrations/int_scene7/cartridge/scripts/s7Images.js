'use strict';
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger');
var baseUrl = '';

/**
 *
 * @param {dw.svc.LocalServiceRegistry} service scene 7 service
 * @param {string} productId product id
 * @returns {string} updated url
 */
function createServiceUrl(service, productId) {
    baseUrl = service.getURL();
    var requestUrl = baseUrl + 'Tumi/' + String(productId) + '?req=imageset';
    return requestUrl;
}

/**
 *
 * @param {Object} productId product id
 * @returns {Object} response of service
 */
function s7Images(productId) {
    var serviceResult = {};
    try {
        var s7Service = LocalServiceRegistry.createService('scene7.images', {
            createRequest: function (service, requestDataContainer) {
                service.setRequestMethod(requestDataContainer.requestMethod);
                service.setURL(requestDataContainer.serviceUrl);
            },
            parseResponse: function (service, response) {
                var resImagesNames = response.text;
                var imageUrls = [];
                var resImgNamesTrimmed = resImagesNames ? resImagesNames.trim() : resImagesNames;
                if (resImgNamesTrimmed && (resImgNamesTrimmed !== '')) {
                    var resImgNameArray = resImgNamesTrimmed.split(',');
                    resImgNameArray.forEach(function (resImageName) {
                        var imageNameArray = resImageName.split(';');
                        var imageUrl = baseUrl + imageNameArray[0];
                        imageUrls.push(imageUrl);
                    });
                }
                return imageUrls;
            }
        });
        var requestDataContainer = {
            requestMethod: 'GET',
            serviceUrl: createServiceUrl(s7Service, productId)
        };
        serviceResult = s7Service.call(requestDataContainer);
    } catch (err) {
        Logger.error(err.toString() + ' in ' + err.fileName + ':' + err.lineNumber);
    }
    return serviceResult;
}

module.exports = {
    getS7Images: s7Images
};
