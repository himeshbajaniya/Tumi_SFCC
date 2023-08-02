'use strict';

var Status = require('dw/system/Status');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');
var FileWriter = require('dw/io/FileWriter');
var File = require('dw/io/File');
var ProductManager = require('dw/catalog/ProductMgr');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');

var logger = require('dw/system/Logger').getLogger('Scene7', 'ProductImageExport');

/**
 *
 * @function
 * @name createServiceUrl
 * @param {dw.svc.LocalServiceRegistry} service scene 7 service
 * @param {string} productId product id
 * @returns {string} updated url
 */
function createServiceUrl(service, productId) {
    var baseUrl = service.getURL();
    var requestUrl = baseUrl + 'Tumi/' + String(productId) + '?req=imageset';
    return requestUrl;
}

/**
 *
 * @function
 * @name getScene7Images
 * @param {Object} productId product id
 * @returns {Object} response of service
 */
function getScene7Images(productId) {
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
                        var imageUrl = imageNameArray[0];
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
    } catch (e) {
        var error = e;
        logger.error(error.toString() + ' in ' + error.fileName + ':' + error.lineNumber);
    }
    return serviceResult.object && serviceResult.object.length !== 0 ? serviceResult.object : null;
}

/**
 *
 * @function
 * @name getScene7ImageDataForAltImages
 * @param {dw.io.XMLStreamWriter} xsw XML Stream Writer
 * @param {string} product product
 * @param {array} scene7ImagesArr List of Scene7Images
 * @param {string} styleVariant product styleVariant
 */
function getScene7ImageDataForAltImages(xsw, product, scene7ImagesArr, styleVariant) {
    try {
        var altImages = [];
        altImages = scene7ImagesArr.filter(function (x) {
            return (x.indexOf('_alt') !== -1);
        });
        if (altImages.length !== 0) {
            xsw.writeStartElement('image-group');
            xsw.writeAttribute('view-type', 'alt');
            xsw.writeAttribute('variation-value', styleVariant);
            for (var i in altImages) {
                xsw.writeStartElement('image');
                    xsw.writeAttribute('path', altImages[i]);
                xsw.writeEndElement();
            }
            xsw.writeEndElement();
        }
    } catch (e) {
        var error = e;
        logger.error(error.toString() + ' in ' + error.fileName + ':' + error.lineNumber);
        return new Status(Status.OK, null, error.message);
    }
}

/**
 *
 * @function
 * @name getScene7ImageDataForSwatchImages
 * @param {dw.io.XMLStreamWriter} xsw XML Stream Writer
 * @param {string} product product
 * @param {array} scene7ImagesArr List of Scene7Images
 * @param {string} styleVariant product styleVariant
 */
function getScene7ImageDataForSwatchImages(xsw, product, scene7ImagesArr, styleVariant) {
    try {
        var swatchImages = [];
        swatchImages = scene7ImagesArr.filter(function (x) {
            return (x.indexOf('_sw') !== -1);
        });
        if (swatchImages.length !== 0) {
            xsw.writeStartElement('image-group');
            xsw.writeAttribute('view-type', 'swatch');
            xsw.writeAttribute('variation-value', styleVariant);
            for (var i in swatchImages) {
                xsw.writeStartElement('image');
                    xsw.writeAttribute('path', swatchImages[i]);
                xsw.writeEndElement();
            }
            xsw.writeEndElement();
        }
    } catch (e) {
        var error = e;
        logger.error(error.toString() + ' in ' + error.fileName + ':' + error.lineNumber);
        return new Status(Status.OK, null, error.message);
    }
}

/**
 *
 * @function
 * @name getScene7ImageDataForMainImages
 * @param {dw.io.XMLStreamWriter} xsw XML Stream Writer
 * @param {string} product product
 * @param {array} scene7ImagesArr List of Scene7Images
 * @param {string} styleVariant product styleVariant
 */
function getScene7ImageDataForMainImages(xsw, product, scene7ImagesArr, styleVariant) {
    try {
        var mainImages = [];
        mainImages = scene7ImagesArr.filter(function (x) {
            return (x.indexOf('_main') !== -1);
        });

        if (mainImages.length !== 0) {
            xsw.writeStartElement('image-group');
            xsw.writeAttribute('view-type', 'main');
            xsw.writeAttribute('variation-value', styleVariant);
            for (var i in mainImages) {
                xsw.writeStartElement('image');
                    xsw.writeAttribute('path', mainImages[i]);
                xsw.writeEndElement();
            }
            xsw.writeEndElement();
        }
    } catch (e) {
        var error = e;
        logger.error(error.toString() + ' in ' + error.fileName + ':' + error.lineNumber);
        return new Status(Status.OK, null, error.message);
    }
}

/**
 * 
 * @function
 * @name populateScene7ImageDataForVariant
 * @param {dw.io.XMLStreamWriter} xsw XML Stream Writer
 * @param {string} product product
 * @param {object} scene7Images List of Scene7Images
 * @param {string} styleVariant product styleVariant
 */
function populateScene7ImageDataForVariant(xsw, product, scene7Images, styleVariant) {
    try {
        var scene7ImagesArr = [];
        for (var i in scene7Images) {
            scene7ImagesArr.push(scene7Images[i]);
        }
        getScene7ImageDataForAltImages(xsw, product, scene7ImagesArr, styleVariant);
        getScene7ImageDataForSwatchImages(xsw, product, scene7ImagesArr, styleVariant);
        getScene7ImageDataForMainImages(xsw, product, scene7ImagesArr, styleVariant);
    } catch (e) {
        var error = e;
        logger.error(error.toString() + ' in ' + error.fileName + ':' + error.lineNumber);
        return new Status(Status.OK, null, error.message);
    }
}

/**
 *
 * @function
 * @name populateScene7ImageDataForMaster
 * @param {dw.io.XMLStreamWriter} xsw XML Stream Writer
 * @param {string} masterProduct masterProduct
 */
function populateScene7ImageDataForMaster(xsw, masterProduct) {
    try {
        var variationModel = masterProduct && masterProduct.variationModel ;
        var variants = variationModel.getVariants().iterator();
        if (variationModel.variants.length > 0) {
            xsw.writeStartElement('product');
            xsw.writeAttribute('product-id', masterProduct.ID);
            xsw.writeStartElement('images');
                while(variants.hasNext()) {
                    var variant = variants.next();
                    var styleVariant =  variant.custom && variant.custom.styleVariant ? variant.custom.styleVariant : null;
                    var scene7Images = getScene7Images(styleVariant);
                    if (scene7Images !== null) {
                        populateScene7ImageDataForVariant(xsw, masterProduct, scene7Images, styleVariant);
                    }
                }
            xsw.writeEndElement();
            xsw.writeEndElement();
        }
         
    } catch (e) {
        var error = e;
        logger.error(error.toString() + ' in ' + error.fileName + ':' + error.lineNumber);
        return new Status(Status.OK, null, error.message);
        xsw.writeEndElement();
        xsw.writeEndElement();
    }
}

/**
 * 
 * @function
 * @name execute
 * @param {Object} params Job parameters
 */
function execute(params) {
    try {
        // Set file path from site preference
        var TargetFolder = params.TargetFolder;
        var targetFolderPath = File.IMPEX + File.SEPARATOR + TargetFolder;
        var exportedDate = StringUtils.formatCalendar(new Calendar(), 'yyyy-MM-dd_HH-mm-ss-SSS');
        // Set file name from site preference
        var fileName = params.fileName + exportedDate + '.xml';
        var targetFile = new File(targetFolderPath + File.SEPARATOR + fileName);
        if (!targetFile.exists()) {
            new File(targetFolderPath).mkdirs();
            targetFile.createNewFile();
        }
        var xsw = null;
        var fileWriter = new FileWriter(targetFile, 'UTF-8');
        xsw = new XMLStreamWriter(fileWriter);
        xsw.writeStartDocument();
        xsw.writeStartElement('catalog');
            xsw.writeAttribute('catalog-id', params.catalogId);
            xsw.writeAttribute('xmlns', 'http://www.demandware.com/xml/impex/catalog/2006-10-31');
            // var referenceProductID = '142070';
            // var product = ProductManager.getProduct(referenceProductID);
            var productIter = ProductManager.queryAllSiteProducts();
            while (productIter.hasNext()) {
               var product = productIter.next();
                if (product.bundle || product.productSet) {
                    continue;
                }

                if(product.master){
                    populateScene7ImageDataForMaster(xsw, product);
                }
            }
        xsw.writeEndElement();
        xsw.close();
    } catch (e) {
        var error = e;
        logger.error(error.toString() + ' in ' + error.fileName + ':' + error.lineNumber);
        return new Status(Status.ERROR, null, error.message);
        xsw.writeEndElement();
        xsw.close();
    }
}

module.exports = {
    execute: execute,
    getScene7Images: getScene7Images,
    createServiceUrl: createServiceUrl
};
