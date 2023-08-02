'use strict';

function buildTransactionModel(order) {
    var CreateTransactionModel = require('*/cartridge/models/createTransactionModel');
    var avhelper = require('*/cartridge/scripts/helpers/avhelper');
    var dworder = require('dw/order');
    var avataxHelper = avhelper.avataxHelperExported;
    var transactionModel = new CreateTransactionModel.CreateTransactionModel();
    var currentCustomer = order.customer;
    var counter = 0;
    var currentCustomerTaxId = !empty(currentCustomer.profile) ? currentCustomer.profile.taxID : null; // Tax ID of the currentCustomer
    // Lines array
    var lines = [];
    var defaultProductTaxCode = avataxHelper.prototype.getDefaultProductTaxCode();
    var defaultShippingMethodTaxCode = avataxHelper.prototype.getDefaultShippingMethodTaxCode() ? avataxHelper.prototype.getDefaultShippingMethodTaxCode() : 'FR';
    var taxIncluded = (dworder.TaxMgr.taxationPolicy === dworder.TaxMgr.TAX_POLICY_GROSS);
    // Save transaction preference in custom preferences
    var saveTransactionsToAvatax = avataxHelper.prototype.saveTransactionsToAvatax();
    // Commit transactions preference
    var commitTransactionsToAvatax = avataxHelper.prototype.commitTransactionsToAvatax();
    // Construct a shipFrom addressLocationInfo object from preferences
    var shipFromLocationCode = avataxHelper.prototype.getShipFromLocationCode();
    var shipFromLine1 = avataxHelper.prototype.getShipFromLine1();
    var shipFromLine2 = avataxHelper.prototype.getShipFromLine2();
    var shiFromLine3 = avataxHelper.prototype.getShipFromLine3();
    var shipFromCity = avataxHelper.prototype.getShipFromCity();
    var shipFromStateCode = avataxHelper.prototype.getShipFromStateCode();
    var shipFromZipCode = avataxHelper.prototype.getShipFromZipCode();
    var shipFromCountryCode = avataxHelper.prototype.getShipFromCountryCode();
    var shipFromLatitude = avataxHelper.prototype.getShipFromLatitude();
    var shipFromLongitude = avataxHelper.prototype.getShipFromLongitude();
    var aliShipFrom = new CreateTransactionModel.AddressLocationInfo();
    aliShipFrom.locationCode = !empty(shipFromLocationCode) ? shipFromLocationCode : '';
    aliShipFrom.line1 = !empty(shipFromLine1) ? shipFromLine1 : '';
    aliShipFrom.line2 = !empty(shipFromLine2) ? shipFromLine2 : '';
    aliShipFrom.line3 = !empty(shiFromLine3) ? shiFromLine3 : '';
    aliShipFrom.city = !empty(shipFromCity) ? shipFromCity : '';
    aliShipFrom.region = !empty(shipFromStateCode) ? shipFromStateCode : '';
    aliShipFrom.postalCode = !empty(shipFromZipCode) ? shipFromZipCode : '';
    aliShipFrom.country = !empty(shipFromCountryCode) ? shipFromCountryCode : '';
    aliShipFrom.latitude = !empty(shipFromLatitude) ? shipFromLatitude : '';
    aliShipFrom.longitude = !empty(shipFromLongitude) ? shipFromLongitude : '';
    var productLineItems = order.productLineItems;
    var pliIterator = productLineItems.iterator();
    var uuidLineNumbersMap = new dw.util.SortedMap();
    while (pliIterator.hasNext()) {
        var li = pliIterator.next();
        if ('shippingstatus' in li.custom && li.custom.shippingstatus && li.custom.shippingstatus.value !== 'SHIPPED') continue;
        if (!empty(li.shipment.shippingAddress)) {
            // create a line item and push it to lines array
            var line = new CreateTransactionModel.LineItemModel();
            var shippingAddress = li.shipment.shippingAddress;
            var shipToAddress;
            var shipFromAddress = aliShipFrom;
            // Construct a shipTo addressLocationInfo object from shippingAddress
            var aliShipTo = new CreateTransactionModel.AddressLocationInfo();
            aliShipTo.locationCode = '';
            aliShipTo.line1 = shippingAddress.address1;
            aliShipTo.line2 = shippingAddress.address2;
            aliShipTo.line3 = '';
            aliShipTo.city = shippingAddress.city;
            aliShipTo.region = shippingAddress.stateCode;
            aliShipTo.country = shippingAddress.countryCode.getDisplayValue().toString();
            aliShipTo.postalCode = shippingAddress.postalCode;
            aliShipTo.latitude = '';
            aliShipTo.longitude = '';
            shipToAddress = aliShipTo;
            // ------------------------ //
            uuidLineNumbersMap = new dw.util.SortedMap();
            uuidLineNumbersMap.put((++counter).toString(), li.UUID); // assign an integer value
            line.number = counter;
            line.quantity = li.quantityValue;
            line.amount = li.proratedPrice.value;
            // addresses model
            line.addresses = new CreateTransactionModel.AddressesModel();
            line.addresses.shipFrom = shipFromAddress;
            line.addresses.shipTo = shipToAddress;
            line.taxCode = !empty(li.getProduct().taxClassID) ? li.getProduct().taxClassID : defaultProductTaxCode;
            line.customerUsageType = null;
            line.itemCode = (!empty(li.product.UPC) ? ('UPC:' + li.product.UPC) : li.productName.toString()).substring(0, 50);
            line.exemptionCode = null;
            line.discounted = false;
            line.taxIncluded = taxIncluded;
            line.revenueAccount = null;
            line.ref1 = null;
            line.ref2 = null;
            line.description = !empty(li.product.shortDescription) ? (!empty(li.product.shortDescription.source) ? li.product.shortDescription.source.toString().substring(0, 255) : '') : '';
            line.businessIdentificationNo = currentCustomerTaxId;
            line.taxOverride = null;
            line.parameters = null;
            lines.push(line);
            var oliIterator = li.optionProductLineItems.iterator();
            while (oliIterator.hasNext()) {
                // create a line item and push it to lines array
                var oli = oliIterator.next();
                line = new CreateTransactionModel.LineItemModel();
                uuidLineNumbersMap.put((++counter).toString(), oli.UUID); // assign an integer value
                line.number = counter;
                line.quantity = oli.quantityValue;
                line.amount = oli.proratedPrice.value;
                // Addresses model
                line.addresses = new CreateTransactionModel.AddressesModel();
                line.addresses.shipFrom = shipFromAddress;
                line.addresses.shipTo = shipToAddress;
                line.taxCode = !empty(oli.taxClassID) ? oli.taxClassID : defaultProductTaxCode;
                line.customerUsageType = null;
                line.itemCode = !empty(oli.productName) ? oli.productName.toString().substring(0, 50) : '';
                line.exemptionCode = null;
                line.discounted = false;
                line.taxIncluded = taxIncluded;
                line.revenueAccount = null;
                line.ref1 = null;
                line.ref2 = null;
                line.description = !empty(oli.productName) ? oli.productName.substring(0, 50) : '';
                line.businessIdentificationNo = currentCustomerTaxId;
                line.taxOverride = null;
                line.parameters = null;
                lines.push(line);
            }
            if (!empty(li.shippingLineItem)) {
                // create a line item and push it to lines array
                var sli = li.shippingLineItem;
                line = new CreateTransactionModel.LineItemModel();
                uuidLineNumbersMap.put((++counter).toString(), sli.UUID); // assign an integer value
                line.number = counter;
                line.quantity = 1;
                line.amount = sli.adjustedPrice.value;
                // Addresse model
                line.addresses = new CreateTransactionModel.AddressesModel();
                line.addresses.shipFrom = shipFromAddress;
                line.addresses.shipTo = shipToAddress;
                line.taxCode = !empty(sli.taxClassID) ? sli.taxClassID.toString() : defaultShippingMethodTaxCode;
                line.customerUsageType = null;
                line.itemCode = !empty(sli.lineItemText) ? sli.lineItemText.toString().substring(0, 50) : 'shipping-line-item';
                line.exemptionCode = null;
                line.discounted = false;
                line.taxIncluded = taxIncluded;
                line.revenueAccount = null;
                line.ref1 = null;
                line.ref2 = null;
                line.description = !empty(sli.lineItemText) ? sli.lineItemText.toString().substring(0, 255) : 'shipping-line-item';
                line.businessIdentificationNo = currentCustomerTaxId;
                line.taxOverride = null;
                line.parameters = null;
                lines.push(line);
            }
        }
    }
    // Create shipping line items
    var shipmentsIterator = order.shipments.iterator();
    while (shipmentsIterator.hasNext()) {
        var shipment = shipmentsIterator.next();
        if (!empty(shipment.shippingAddress)) {
            var shippingLineItemsIterator = shipment.shippingLineItems.iterator();
            while (shippingLineItemsIterator.hasNext()) {
                li = shippingLineItemsIterator.next();
                line = new CreateTransactionModel.LineItemModel();
                uuidLineNumbersMap.put((++counter).toString(), li.UUID); // assign an integer value
                line.number = counter;
                line.quantity = 1;
                line.amount = li.adjustedPrice.value;
                // Addresse model
                shippingAddress = shipment.shippingAddress;
                line.addresses = new CreateTransactionModel.AddressesModel();
                line.addresses.shipFrom = aliShipFrom;
                // Construct a shipTo addressLocationInfo object from shippingAddress
                aliShipTo = new CreateTransactionModel.AddressLocationInfo();
                aliShipTo.locationCode = '';
                aliShipTo.line1 = shippingAddress.address1;
                aliShipTo.line2 = shippingAddress.address2;
                aliShipTo.line3 = '';
                aliShipTo.city = shippingAddress.city;
                aliShipTo.region = shippingAddress.stateCode;
                aliShipTo.country = shippingAddress.countryCode.getDisplayValue().toString();
                aliShipTo.postalCode = shippingAddress.postalCode;
                aliShipTo.latitude = '';
                aliShipTo.longitude = '';
                line.addresses.shipTo = aliShipTo;
                line.taxCode = !empty(li.taxClassID) ? li.taxClassID : defaultShippingMethodTaxCode;
                line.customerUsageType = null;
                line.itemCode = !empty(li.ID) ? li.ID.toString().substring(0, 50) : 'shipping-line-item';
                line.exemptionCode = null;
                line.discounted = false;
                line.taxIncluded = taxIncluded;
                line.revenueAccount = null;
                line.ref1 = null;
                line.ref2 = null;
                line.description = !empty(li.lineItemText) ? li.lineItemText.toString().substring(0, 255) : 'shipping-line-item';
                line.businessIdentificationNo = currentCustomerTaxId;
                line.taxOverride = null;
                line.parameters = null;
                lines.push(line);
            }
        }
    }
    // gift cert lines
    var giftCertLinesIterator = order.giftCertificateLineItems.iterator();
    while (giftCertLinesIterator.hasNext()) {
        var giftCert = giftCertLinesIterator.next();
        var gs = giftCert.shipment;
        if (!empty(gs.shippingAddress)) {
            line = new CreateTransactionModel.LineItemModel();
            uuidLineNumbersMap.put((++counter).toString(), giftCert.UUID); // assign an integer value
            line.number = counter;
            line.quantity = 1;
            line.amount = giftCert.getPriceValue();
            // Addresse model
            line.addresses = new CreateTransactionModel.AddressesModel();
            line.addresses.shipFrom = aliShipFrom;
            // Construct a shipTo addressLocationInfo object from shippingAddress
            var gsShipTo = new CreateTransactionModel.AddressLocationInfo();
            gsShipTo.locationCode = '';
            gsShipTo.line1 = gs.shippingAddress.address1;
            gsShipTo.line2 = gs.shippingAddress.address2;
            gsShipTo.line3 = '';
            gsShipTo.city = gs.shippingAddress.city;
            gsShipTo.region = gs.shippingAddress.stateCode;
            gsShipTo.country = gs.shippingAddress.countryCode.getDisplayValue().toString();
            gsShipTo.postalCode = gs.shippingAddress.postalCode;
            gsShipTo.latitude = '';
            gsShipTo.longitude = '';
            line.addresses.shipTo = gsShipTo;
            line.taxCode = !empty(giftCert.taxClassID) ? giftCert.taxClassID : 'PG050000'; // PG050000
            line.customerUsageType = null;
            line.itemCode = !empty(giftCert.getLineItemText()) ? giftCert.getLineItemText().toString().substring(0, 50) : gs.giftCertificateID.toString() || 'gift-certificate';
            line.exemptionCode = null;
            line.discounted = false;
            line.taxIncluded = taxIncluded;
            line.revenueAccount = null;
            line.ref1 = null;
            line.ref2 = null;
            line.description = !empty(giftCert.lineItemText) ? giftCert.lineItemText.toString().substring(0, 255) : 'gift-certificate';
            line.businessIdentificationNo = currentCustomerTaxId;
            line.taxOverride = null;
            line.parameters = null;
            lines.push(line);
        } else if (!empty(order.billingAddress)) {
            line = new CreateTransactionModel.LineItemModel();
            shipToAddress = order.billingAddress;
            uuidLineNumbersMap.put((++counter).toString(), giftCert.UUID); // assign an integer value
            line.number = counter;
            line.quantity = 1;
            line.amount = giftCert.getPriceValue();
            // Addresse model
            line.addresses = new CreateTransactionModel.AddressesModel();
            line.addresses.shipFrom = aliShipFrom;
            // Construct a shipTo addressLocationInfo object from shippingAddress
            gsShipTo = new CreateTransactionModel.AddressLocationInfo();
            gsShipTo.locationCode = '';
            gsShipTo.line1 = shipToAddress.address1;
            gsShipTo.line2 = shipToAddress.address2;
            gsShipTo.line3 = '';
            gsShipTo.city = shipToAddress.city;
            gsShipTo.region = shipToAddress.stateCode;
            gsShipTo.country = shipToAddress.countryCode.getDisplayValue().toString();
            gsShipTo.postalCode = shipToAddress.postalCode;
            gsShipTo.latitude = '';
            gsShipTo.longitude = '';
            line.addresses.shipTo = gsShipTo;
            line.taxCode = !empty(giftCert.taxClassID) ? giftCert.taxClassID : 'PG050000'; // PG050000
            line.customerUsageType = null;
            line.itemCode = !empty(giftCert.lineItemText) ? giftCert.lineItemText.toString().substring(0, 50) : gs.giftCertificateID.toString() || 'gift-certificate';
            line.exemptionCode = null;
            line.discounted = false;
            line.taxIncluded = taxIncluded;
            line.revenueAccount = null;
            line.ref1 = null;
            line.ref2 = null;
            line.description = !empty(giftCert.lineItemText) ? giftCert.lineItemText.toString().substring(0, 255) : 'gift-certificate';
            line.businessIdentificationNo = currentCustomerTaxId;
            line.taxOverride = null;
            line.parameters = null;
            lines.push(line);
        }
    }
    // Lines array - END
    // Construct a transaction object
    transactionModel.code = order.orderNo;
    //  If commit document not enabled in site preferences, type is SalesOrder
    transactionModel.type = saveTransactionsToAvatax ? transactionModel.type.C_SALESINVOICE : transactionModel.type.C_SALESORDER;
    transactionModel.lines = lines;
    transactionModel.commit = !!(commitTransactionsToAvatax && orderNo);
    transactionModel.companyCode = avataxHelper.prototype.getCompanyCode();
    transactionModel.date = order.creationDate;
    transactionModel.salespersonCode = null;
    transactionModel.customerCode = empty(order.getCustomerEmail()) ? 'so-cust-code' : order.getCustomerEmail();
    transactionModel.debugLevel = transactionModel.debugLevel.C_NORMAL;
    transactionModel.serviceMode = transactionModel.serviceMode.C_AUTOMATIC;
    transactionModel.businessIdentificationNo = currentCustomerTaxId;
    transactionModel.currencyCode = order.currencyCode;
    return transactionModel;
}

function adjustTax(order) {
    if (!order) {
        return null;
    }
    try {
        var settingsObject = JSON.parse(require('dw/system/Site').getCurrent().getCustomPreferenceValue('ATSettings'));
        if (!settingsObject.taxCalculation) {
            return null;
        }
        var svcResponse = require('*/cartridge/scripts/avaTaxClient').createOrAdjustTransaction('', {
            createTransactionModel: buildTransactionModel(order)
        });
        if (svcResponse.statusCode !== 'ERROR') {
            require('dw/system/Transaction').wrap(() => order.custom.reconcileTaxPrice = svcResponse.totalTax);
        }
    } catch (e) {
        require('dw/system/Logger').getLogger('Avalara').error('\n Message: {0} \n stack: {1}', e.message, e.stack);
    }
}

module.exports = {
    adjustTax: adjustTax
};