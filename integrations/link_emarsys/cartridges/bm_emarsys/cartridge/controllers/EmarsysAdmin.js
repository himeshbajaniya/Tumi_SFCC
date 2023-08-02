'use strict';

var server = require('server');
var Transaction = require('dw/system/Transaction');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var BMEmarsysHelper = require('*/cartridge/scripts/helpers/bmEmarsysHelper');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.get('ShowCatalogConfigurations', server.middleware.https, function (req, res, next) {
    try {
        var productAttrs = BMEmarsysHelper.copyCustomPrefValue('emarsysPredictProductAttributes');
        var additionalValues = BMEmarsysHelper.parseCustomPrefValue('emarsysCatalogExportType');
        var tabsAttr = BMEmarsysHelper.getTabsAttr('EmarsysCatalogConfig', 'EmarsysCatalogConfig', true);
        var newCatalogConfigs = BMEmarsysHelper.parseCustomObjects({
            objectType: 'EmarsysCatalogConfig',
            objectKey: null,
            contentFieldKey: 'EmarsysCatalogConfig',
            additionalFieldKey: 'exportType'
        });

        res.render('mainPage', {
            contentTemplate: 'dynamic',
            pageType: 'catalog.configurations',
            tabsAttr: tabsAttr,
            content: {
                contentConfigs: newCatalogConfigs,
                generalAttrs: productAttrs,
                additionalValues: additionalValues,
                isProperties: true
            }
        });
    } catch (err) {
        res.render('components/errorPage', { message: 'Configuration error:', error: err });
    }
    next();
});

server.post('SaveCatalogConfigurations', server.middleware.https, function (req, res, next) {
    var catalogConf = JSON.parse(request.httpParameterMap.data.value);

    if (catalogConf) {
        try {
            Transaction.wrap(function () {
                var currentCustomObject = CustomObjectMgr.getCustomObject('EmarsysCatalogConfig', catalogConf.typeCustomObject);

                currentCustomObject.custom.mappedFields = JSON.stringify(catalogConf.fields);
                if (Object.prototype.hasOwnProperty.call(catalogConf, 'additionalValue')) {
                    currentCustomObject.custom.exportType = catalogConf.additionalValue;
                }
            });
            res.json({
                success: true
            });
        } catch (err) {
            res.json({
                success: false,
                responseText: 'An error occurred while transacting a possibly missing custom object or custom fields.' +
                '\nMessege: ' + err.message
            });
        }
    } else {
        res.json({
            success: false,
            responseText: 'Missing parameter "data" in request'
        });
    }

    next();
});

server.get('ShowOrderConfirmation', server.middleware.https, function (req, res, next) {
    try {
        var confirmAttrs = BMEmarsysHelper.parseCustomPrefValue('emarsysOrderConfirmationElements');
        var newOrderConfigs = BMEmarsysHelper.parseCustomObjects({
            objectType: 'EmarsysTransactionalEmailsConfig',
            objectKey: 'orderconf',
            contentFieldKey: 'EmarsysEmailTypeConfig',
            additionalFieldKey: 'externalEvent'
        });
        var additionalValues = BMEmarsysHelper.getExternalEvents('StoredEvents', 'otherResult');

        res.render('mainPage', {
            contentTemplate: 'dynamic',
            pageType: 'order.configurations',
            content: {
                contentConfigs: newOrderConfigs,
                generalAttrs: confirmAttrs,
                additionalValues: additionalValues,
                isProperties: false
            }
        });
    } catch (err) {
        res.render('components/errorPage', { message: 'Configuration error:', error: err });
    }
    next();
});

server.get('ShowShippingConfirmation', server.middleware.https, function (req, res, next) {
    try {
        var confirmAttrs = BMEmarsysHelper.parseCustomPrefValue('emarsysShippingInformationElements');
        var newShippingConfigs = BMEmarsysHelper.parseCustomObjects({
            objectType: 'EmarsysTransactionalEmailsConfig',
            objectKey: 'shipping',
            contentFieldKey: 'EmarsysEmailTypeConfig',
            additionalFieldKey: 'externalEvent'
        });
        var additionalValues = BMEmarsysHelper.getExternalEvents('StoredEvents', 'otherResult');

        res.render('mainPage', {
            contentTemplate: 'dynamic',
            pageType: 'shipping.configurations',
            content: {
                contentConfigs: newShippingConfigs,
                generalAttrs: confirmAttrs,
                additionalValues: additionalValues,
                isProperties: false
            }
        });
    } catch (err) {
        res.render('components/errorPage', { message: 'Configuration error:', error: err });
    }
    next();
});

server.get('ShowOrderCancelledConfigurations', server.middleware.https, function (req, res, next) {
    try {
        var confirmAttrs = BMEmarsysHelper.parseCustomPrefValue('emarsysCancelledOrderInformationElements');
        var additionalValues = BMEmarsysHelper.getExternalEvents('StoredEvents', 'otherResult');
        var newOrderCancelledConfObj = BMEmarsysHelper.parseCustomObjects({
            objectType: 'EmarsysTransactionalEmailsConfig',
            objectKey: 'orderCancelledConf',
            contentFieldKey: 'EmarsysEmailTypeConfig',
            additionalFieldKey: 'externalEvent'
        });

        res.render('mainPage', {
            contentTemplate: 'dynamic',
            pageType: 'order.cancelled.configurations',
            content: {
                contentConfigs: newOrderCancelledConfObj,
                generalAttrs: confirmAttrs,
                additionalValues: additionalValues,
                isProperties: false
            }
        });
    } catch (err) {
        res.render('components/errorPage', { message: 'Configuration error:', error: err });
    }
    next();
});

server.post('SaveTransactionalEmailsConfig', server.middleware.https, function (req, res, next) {
    var transactionalEmailsConfig = JSON.parse(request.httpParameterMap.data.value);

    if (transactionalEmailsConfig) {
        try {
            Transaction.wrap(function () {
                var currentCustomObject = CustomObjectMgr.getCustomObject('EmarsysTransactionalEmailsConfig', transactionalEmailsConfig.typeCustomObject);

                currentCustomObject.custom.mappedFields = JSON.stringify(transactionalEmailsConfig.fields);
                if (Object.prototype.hasOwnProperty.call(transactionalEmailsConfig, 'additionalValue')) {
                    currentCustomObject.custom.externalEvent = transactionalEmailsConfig.additionalValue;
                }
            });
            res.json({
                success: true
            });
        } catch (err) {
            res.json({
                success: false,
                responseText: 'An error occurred while transacting a possibly missing custom object or custom fields.' +
                '\nMessege: ' + err.message
            });
        }
    } else {
        res.json({
            success: false,
            responseText: 'Missing parameter "data" in request'
        });
    }

    next();
});

server.get('ShowDBLoad', server.middleware.https, function (req, res, next) {
    try {
        var profileFieldsObject = JSON.parse(CustomObjectMgr.getCustomObject('EmarsysProfileFields', 'profileFields').custom.result);
        var confirmAttrs = BMEmarsysHelper.parseCustomPrefValue('emarsysDBLoadAttributes');
        var newDBloadConfigs = BMEmarsysHelper.parseCustomObjects({
            objectType: 'EmarsysDBLoadConfig',
            objectKey: 'dbloadConfig',
            contentFieldKey: 'EmarsysDBLoadConfig',
            additionalFieldKey: null
        });

        res.render('mainPage', {
            contentTemplate: 'dynamic',
            pageType: 'dbload.configurations',
            content: {
                contentConfigs: newDBloadConfigs,
                generalAttrs: profileFieldsObject,
                selectPlacheholder: confirmAttrs,
                newLabelForPlaceholderCol: 'available.attribute',
                newLabelForAvailableCol: 'emarsys.field'
            }
        });
    } catch (err) {
        res.render('components/errorPage', { message: 'Configuration error:', error: err });
    }
    next();
});

server.post('SaveDBLoad', server.middleware.https, function (req, res, next) {
    var DBloadConfig = JSON.parse(request.httpParameterMap.data.value);

    if (DBloadConfig) {
        try {
            Transaction.wrap(function () {
                var DBLoadConfigCustomObj = CustomObjectMgr.getCustomObject('EmarsysDBLoadConfig', DBloadConfig.typeCustomObject);

                DBLoadConfigCustomObj.custom.mappedFields = JSON.stringify(DBloadConfig.fields);
            });
            res.json({
                success: true
            });
        } catch (err) {
            res.json({
                success: false,
                responseText: 'An error occurred while transacting a possibly missing custom object or custom fields.' +
                '\nMessege: ' + err.message
            });
        }
    } else {
        res.json({
            success: false,
            responseText: 'Missing parameter "data" in request'
        });
    }

    next();
});

server.get('ShowSmartInsight', server.middleware.https, function (req, res, next) {
    try {
        var smartInsight = BMEmarsysHelper.copyCustomPrefValue('emarsysSmartInsightAvailableElements');
        var newSmartInsightConfigs = BMEmarsysHelper.parseCustomObjects({
            objectType: 'EmarsysSmartInsightConfiguration',
            objectKey: 'emarsysSmartInsight',
            contentFieldKey: 'SmartInsightConfig',
            additionalFieldKey: null
        });

        res.render('mainPage', {
            contentTemplate: 'dynamic',
            pageType: 'smartinsight.configurations',
            content: {
                contentConfigs: newSmartInsightConfigs,
                generalAttrs: smartInsight
            }
        });
    } catch (err) {
        res.render('components/errorPage', { message: 'Configuration error:', error: err });
    }
    next();
});

server.post('SaveSmartInsight', server.middleware.https, function (req, res, next) {
    var shippingConf = JSON.parse(request.httpParameterMap.data.value);

    if (shippingConf) {
        try {
            Transaction.wrap(function () {
                var currentCustomObject = CustomObjectMgr.getCustomObject('EmarsysSmartInsightConfiguration', shippingConf.typeCustomObject);

                currentCustomObject.custom.mappedFields = JSON.stringify(shippingConf.fields);
            });
            res.json({
                success: true
            });
        } catch (err) {
            res.json({
                success: false,
                responseText: 'An error occurred while transacting a possibly missing custom object or custom fields.' +
                '\nMessege: ' + err.message
            });
        }
    } else {
        res.json({
            success: false,
            responseText: 'Missing parameter "data" in request'
        });
    }

    next();
});

server.get('ShowOrderConfirmationEmail', server.middleware.https, csrfProtection.generateToken, function (req, res, next) {
    var orderConfEmailForm = server.forms.getForm('sendOrderConfEmail');
    orderConfEmailForm.clear();

    res.render('mainPage', {
        contentTemplate: 'sendOrderConfEmail',
        pageType: 'orderconfemail.configurations',
        orderConfEmailForm: orderConfEmailForm
    });

    next();
});

server.post('SendOrderConfirmationEmail', server.middleware.https, csrfProtection.validateRequest, function (req, res, next) {
    var orderConfEmailForm = server.forms.getForm('sendOrderConfEmail');
    var orderId = orderConfEmailForm.orderId.value;
    var order = require('dw/order/OrderMgr').getOrder(orderId);

    if (order) {
        try {
            Transaction.wrap(function () {
                if (require('dw/system/HookMgr').hasHook('emarsys.sendOrderConfirmation')) {
                    require('dw/system/HookMgr').callHook('emarsys.sendOrderConfirmation', 'orderConfirmation', { Order: order });
                }
            });
            res.json({
                success: true,
                responseText: 'Message sent and order status updated'
            });
        } catch (err) {
            res.json({
                success: false,
                responseText: 'An error occurred while transacting a possibly missing custom object or custom fields.' +
                '\nMessege: ' + err.message
            });
        }
    } else {
        res.json({
            success: false,
            responseText: 'Order with number: ' + orderId + ' not exist.'
        });
    }

    next();
});


module.exports = server.exports();
