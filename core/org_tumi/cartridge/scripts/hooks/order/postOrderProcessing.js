'use strict';

var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger').getLogger('postOrderProcessing', 'postOrderProcessing');
var Site = require('dw/system/Site');
var Order = require('dw/order/Order');
var vasCount = 0;

function updateOrder(order) {
    try {
        var shipment;
        var productLineItems;
        //var vasCount = 0;
        var vasMonogramAttributes;
        var consignmentID;
        var count;

        Transaction.wrap(function () {
            var x = 97;
            var count = 0;
            for (var i = 0; i < order.shipments.length; i++) {
                shipment = order.shipments[i];
                productLineItems = shipment.productLineItems;
                var nonMonogramConsignmentId;
                var consignmentId;
                var nonMonogramConsignmentIdAlreadyCreated = false;
                var lastVisitedMonogramType = null;
                var increaseConsignmentPrefix;
                var searchAttributeData = order.orderNo;

                for (var s = 0; s < productLineItems.length; s++) {
                    var productLineItem = productLineItems[s];
                    if (!productLineItem.custom.isPremiumMonogramLetter && !productLineItem.custom.parentProductLineItemID) {
                        //vasCount += 1;
                        productLineItem.custom.entryCode = productLineItem.orderItem.itemID.substr(0, productLineItem.orderItem.itemID.indexOf('#')) + '_' + (vasCount);
                        vasCount += 1;
                        searchAttributeData = searchAttributeData + ',' + productLineItem.productName;
                    }
                    if (productLineItem.custom.giftBoxEnableLineitem || productLineItem.giftMessage) {
                        var vasEntriesMsg = {};
                        var vasEntries;
                        vasEntriesMsg = {
                            productCode: 'GIFTMSG',
                            productType: 'GIFTMSG',
                            quantity: productLineItem.quantity.value,
                            vasField1: productLineItem.custom.recipientName,
                            vasField2: productLineItem.giftMessage,
                            vasField3: productLineItem.custom.senderName
                        }
                        if (productLineItem.custom.giftBoxEnableLineitem) {
                        var giftBoxData = updateVasDataGiftBox(productLineItem);
                        vasEntries = [giftBoxData, vasEntriesMsg];
                        } else {
                        vasEntries = [vasEntriesMsg];
                        }
                        productLineItem.custom.vasGiftBoxAttributes = JSON.stringify(vasEntries);
                    }
                    count ? count : 0;
                    if (productLineItem.custom.monogramDataOnPLI == null && !productLineItem.custom.isPremiumMonogramLetter && !productLineItem.custom.parentProductLineItemID && !productLineItem.custom.giftBoxEnableLineitem && !productLineItem.giftMessage ) { // productLineItem has no Monogram
                        //Plain Products
                        if (s == 0) {
                            //count = 0;
                            nonMonogramConsignmentId = String.fromCharCode(x + count) + order.orderNo;
                            productLineItem.custom.consignmentID = nonMonogramConsignmentId;
                            nonMonogramConsignmentIdAlreadyCreated = true;
                            lastVisitedMonogramType = 'nonmonogram';
                        } else {
                            increaseConsignmentPrefix = incrementConsignmentPrefix(lastVisitedMonogramType, 'nonmonogram', nonMonogramConsignmentIdAlreadyCreated);
                            lastVisitedMonogramType = 'nonmonogram';
                        }

                        if (increaseConsignmentPrefix) {
                            count += 1;
                            nonMonogramConsignmentId = String.fromCharCode(x + count) + order.orderNo;
                            productLineItem.custom.consignmentID = nonMonogramConsignmentId;
                            nonMonogramConsignmentIdAlreadyCreated = true;
                        } else {
                            productLineItem.custom.consignmentID = nonMonogramConsignmentId;
                        }
                    } else if (!productLineItem.custom.isPremiumMonogramLetter && !productLineItem.custom.parentProductLineItemID && !productLineItem.custom.giftBoxEnableLineitem && !productLineItem.giftMessage) { 
                        // ProductLineItem has Monogram
                        if (productLineItem.custom.isPremiumMonogram) {
                            updateVASData(productLineItems, productLineItem.UUID);
                        }
                        if (s == 0) {
                            //count = 0;
                            consignmentId = String.fromCharCode(x + count) + order.orderNo;
                            productLineItem.custom.consignmentID = consignmentId;
                            lastVisitedMonogramType = 'monogram';
                        } else {
                            increaseConsignmentPrefix = incrementConsignmentPrefix(lastVisitedMonogramType, 'monogram', nonMonogramConsignmentIdAlreadyCreated);
                            lastVisitedMonogramType = 'monogram';
                        }

                        if (increaseConsignmentPrefix) {
                            count += 1;
                            consignmentId = String.fromCharCode(x + count) + order.orderNo;
                            productLineItem.custom.consignmentID = consignmentId;
                        }
                    } else if ((productLineItem.custom.giftBoxEnableLineitem || productLineItem.giftMessage) && !productLineItem.custom.parentProductLineItemID && productLineItem.custom.monogramDataOnPLI == null) {
                        // ProductLineItem has GiftBox
                        var giftBoxConsignmentId;
                        if (s == 0) {
                            //count = 0;
                            giftBoxConsignmentId = String.fromCharCode(x + count) + order.orderNo;
                            productLineItem.custom.consignmentID = giftBoxConsignmentId;
                            lastVisitedMonogramType = 'monogram';
                        } else {
                            increaseConsignmentPrefix = incrementConsignmentPrefix(lastVisitedMonogramType, 'monogram', nonMonogramConsignmentIdAlreadyCreated);
                            lastVisitedMonogramType = 'monogram';
                        }

                        if (increaseConsignmentPrefix) {
                            count += 1;
                            giftBoxConsignmentId = String.fromCharCode(x + count) + order.orderNo;
                            productLineItem.custom.consignmentID = giftBoxConsignmentId;
                        }
                    } else if (!productLineItem.custom.isPremiumMonogramLetter && productLineItem.custom.monogramDataOnPLI && (productLineItem.custom.giftBoxEnableLineitem || productLineItem.giftMessage) && !productLineItem.custom.parentProductLineItemID) {
                        var giftBoxMonoConsignmentId;
                        if (productLineItem.custom.isPremiumMonogram) {
                            updateVASData(productLineItems, productLineItem.UUID);
                        }
                        if (s == 0) {
                            //count = 0;
                            giftBoxMonoConsignmentId = String.fromCharCode(x + count) + order.orderNo;
                            productLineItem.custom.consignmentID = giftBoxMonoConsignmentId;
                            lastVisitedMonogramType = 'monogram';
                        } else {
                            increaseConsignmentPrefix = incrementConsignmentPrefix(lastVisitedMonogramType, 'monogram', nonMonogramConsignmentIdAlreadyCreated);
                            lastVisitedMonogramType = 'monogram';
                        }

                        if (increaseConsignmentPrefix) {
                            count += 1;
                            giftBoxMonoConsignmentId = String.fromCharCode(x + count) + order.orderNo;
                            productLineItem.custom.consignmentID = giftBoxMonoConsignmentId;
                        }
                    }
                    order.custom.productLineItemNames = searchAttributeData;
                }
                 x += 1;
                 lastVisitedMonogramType = 'nonmonogram';
                    for (var s = 0; s < productLineItems.length; s++) {
                        var productLineItem = productLineItems[s];
                        if (productLineItem.custom.monogramDataOnPLI || productLineItem.custom.vasGiftBoxAttributes) {
                            calculateVASAttributes(productLineItems, productLineItem, productLineItem.UUID);
                        }

                    }
                order.custom.lincReadyForExport = true;
                for (var j = 0; j < order.customer.customerGroups.length; j++){
                    if (order.customer.customerGroups[j].ID == Site.getCurrent().getCustomPreferenceValue('employeeCustomerGroup')) {
                        order.custom.isEmployeeOrder = true;
                    }
                else {
                    order.custom.isEmployeeOrder = false;
                }
            }
            }
        });
        // MARK Order as READY FOR EXPORT now as all the modifications is completed at this point.
        Transaction.wrap(function () {
            order.setExportStatus(Order.EXPORT_STATUS_READY);
        });
    } catch (e) {
        Logger.error('[postOrderProcessing.js] updateOrder() method crashed for OrderID: {0} at line:{1}. ERROR: {2}', order.orderNo, e.lineNumber, e.message);
    }
};

    /**
     * Returns True or False based on whether new consignmentId needs to generated or not
     */
    function incrementConsignmentPrefix(lastVisitedMonogramType, currentVisitingMonogramType, nonMonogramConsignmentIdExists) {
        var increaseConsignmentPrefix = true;
        if (lastVisitedMonogramType === 'nonmonogram') {
            if (currentVisitingMonogramType === 'nonmonogram') {
                increaseConsignmentPrefix = false;
            } else {
                increaseConsignmentPrefix = true;
            }
        } else if (lastVisitedMonogramType === 'monogram') {
            if (currentVisitingMonogramType === 'monogram') {
                increaseConsignmentPrefix = true;
            } else if (currentVisitingMonogramType === 'nonmonogram') {
                if (nonMonogramConsignmentIdExists) {
                    increaseConsignmentPrefix = false;
                } else {
                    increaseConsignmentPrefix = true;
                }
            }
        }
        return increaseConsignmentPrefix;
    }

    /**
     * Updates the price and tax in VAS Data in case of premium monogramming.
     */
    function updateVASData(productLineItems, productLineItemUUID) {
        var monogrammedPLI = getProductLineItemByUUID(productLineItems, productLineItemUUID);
        var associatedLettersUUID = monogrammedPLI.custom.associatedLetters.split(',');
        var VASData = JSON.parse(monogrammedPLI.custom.monogramDataOnPLI);
        for each(var VASEntry in VASData) {
            if ('productName' in VASEntry) {
                for each(var letterPLI in productLineItems) {
                    if ((letterPLI.custom.isPremiumMonogramLetter) && (letterPLI.product.custom.premiumMonogramLetter == VASEntry.productName.toUpperCase())) {
                        VASEntry.basePrice = letterPLI.price.value;
                        VASEntry.totalPrice = letterPLI.price.value;
                        VASEntry.sumTaxValues = letterPLI.tax.value;
                        break;
                    }
                }
            }
        }
        var newVasEntry = JSON.stringify(VASData);

        Transaction.wrap(function () {
            monogrammedPLI.custom.monogramDataOnPLI = newVasEntry;
        });
    }

    function getProductLineItemByUUID(productLineItems, pliUUID) {
        var productLineItem = null;
        if (productLineItems && pliUUID) {
            for each(var pli in productLineItems) {
                if (pli.UUID === pliUUID) {
                    productLineItem = pli;
                    break;
                }
            }
        }
        return productLineItem;
    }

    function updateVasDataGiftBox(productLineItem) {
       // var giftProductLineitem = getGiftBoxProductLineItemByUUID(productLineItems, pliUUID);
        var vasEntriesgift = {};
        vasEntriesgift = {
            productCode: 'GIFTBOX',
            productType: 'GIFTBOX',
            basePrice: '0.00',
            totalPrice: '0.00',
            sumTaxValues: '0.00',
            quantity: '1'
        }
        return vasEntriesgift;
    };



    function getGiftBoxProductLineItemByUUID(productLineItems, pliUUID) {
        var productLineItem = null;
        if (productLineItems && pliUUID) {
            for each(var pli in productLineItems) {
                // var parentProductLineItemID = pli.custom.parentProductLineItemID;
                if (pli.custom.parentProductLineItemID === pliUUID) {
                    productLineItem = pli;
                    break;
                }
            }
        }
        return productLineItem;
    };
    //var vasCounter;

    function calculateVASAttributes(productLineItems, productLineItem, productLineItemUUID) {
        if (productLineItem.custom.monogramDataOnPLI) {
            var monogrammedPLI = getProductLineItemByUUID(productLineItems, productLineItemUUID);
            var monogramData = JSON.parse(monogrammedPLI.custom.monogramDataOnPLI);
            for (var i = 0; i < monogramData.length; i++) {
                var vasfield3;
                if(monogramData[i].productType == 'MONOTAG' || monogramData[i].productType == 'MONOPATCH') {
                    vasfield3 = 'font';
                }
                else if (monogramData[i].productType == 'PREMIUMMONOTAG' || monogramData[i].productType == 'PREMIUMMONOPATCH') {
                    vasfield3 = 'monogramtag';
                }
            }
            var idModified = monogramData.map(
                obj => {
                    return {
                        "productCode": obj.productCode,
                        "productType": obj.productType,
                        "quantity": obj.quantity,
                        "vasField1": obj.character,
                        "vasField2": obj.color,
                        "vasField3": obj[vasfield3],
                        "vasField4": obj.size,
                        "vasField5": obj.patchColor,
                        "productName": obj.productName,
                        "basePrice": obj.basePrice,
                        "totalPrice": obj.totalPrice,
                        "sumTaxValues": obj.sumTaxValues,
                    }
                }
            );
            var newVasEntry = JSON.stringify(idModified);
            Transaction.wrap(function () {
                monogrammedPLI.custom.monogramDataOnPLI = newVasEntry;
            });
        }
        if (productLineItem.custom.vasGiftBoxAttributes) {
            var giftboxData = JSON.parse(productLineItem.custom.vasGiftBoxAttributes);
        }
       
        if ((!empty(idModified)) && (!empty(giftboxData))) {
            var vasDataValue = idModified.concat(giftboxData);
            for (var i = 0; i < vasDataValue.length; i++) {
                var vasentryCodeNew = productLineItem.orderItem.itemID.substr(0, productLineItem.orderItem.itemID.indexOf('#')) + '_' + (vasCount);
                vasDataValue[i]['vasEntryCode'] = vasentryCodeNew;
                vasCount = vasCount + 1;
            }
            Transaction.wrap(function () {
                var newVasDataValue = JSON.stringify(vasDataValue);
                productLineItem.custom.vasTotalAttributes = newVasDataValue;
            });
        } else if (!empty(idModified)) {
            for (var i = 0; i < idModified.length; i++) {
                var vasentryCodeNew = productLineItem.orderItem.itemID.substr(0, productLineItem.orderItem.itemID.indexOf('#')) + '_' + (vasCount);
                idModified[i]['vasEntryCode'] = vasentryCodeNew;
                vasCount = vasCount + 1;
            }
            Transaction.wrap(function () {
                var newVasDataValueMonogram = JSON.stringify(idModified);
                productLineItem.custom.vasTotalAttributes = newVasDataValueMonogram;
            });
        } else if (!empty(giftboxData)) {
            for (var i = 0; i < giftboxData.length; i++) {
                var vasentryCodeNew = productLineItem.orderItem.itemID.substr(0, productLineItem.orderItem.itemID.indexOf('#')) + '_' + (vasCount);
                giftboxData[i]['vasEntryCode'] = vasentryCodeNew;
                vasCount = vasCount + 1;
            }
            Transaction.wrap(function () {
                var newVasDataValueGift = JSON.stringify(giftboxData);
                productLineItem.custom.vasTotalAttributes = newVasDataValueGift;
            });
        }

    };

    module.exports = exports = {
        updateOrder: updateOrder,
        incrementConsignmentPrefix: incrementConsignmentPrefix,
        updateVASData: updateVASData
    };