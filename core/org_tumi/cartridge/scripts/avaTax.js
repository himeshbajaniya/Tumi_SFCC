/* eslint-disable no-undef */
/**
 * Helps connect SF B2C to AvaTax services
 */

'use strict';
var base = module.superModule;
var dwlogger = require('dw/system/Logger');
var dwsite = require('dw/system/Site');
// script includes
var avaTaxClient = require('*/cartridge/scripts/avaTaxClient');

// Logger includes
var LOGGER = dwlogger.getLogger('Avalara', 'AvaTax');

// AvaTax setting preference
var settingsObject = JSON.parse(dwsite.getCurrent().getCustomPreferenceValue('ATSettings'));

// Model includes
var CommitTransactionModel = require('*/cartridge/models/commitTransactionModel');
var VoidTransactionModel = require('*/cartridge/models/voidTransactionModel');

/**
 * Marks a transaction by changing its status to 'Committed'.
 * @param {string} orderNo - DW order number of the transaction to be committed
 * @returns {*} A response object that contains information about the committed transaction
 */
base.commitDocument = function (orderNo) {
    var message = '';

    try {
        var companyCode = settingsObject.companyCode || '';
        var transactionCode = orderNo;
        var commitTransactionModel = new CommitTransactionModel.CommitTransactionModel();
        var documentType = 'SalesInvoice';
        commitTransactionModel.commit = true;
        var svcResponse = avaTaxClient.commitTransaction(companyCode, transactionCode, commitTransactionModel, documentType);
        // ----------------- Logentries - START -------------------- //
        if (!empty(svcResponse.statusCode) && svcResponse.statusCode !== 'OK') {
            message = 'AvaTax commit document failed. Service configuration issue.';
        }
        if (svcResponse.error || svcResponse.message || svcResponse.errorMessage) {
            if (svcResponse.errorMessage) {
                message = svcResponse.errorMessage.error.message;
            }
            if (svcResponse.message) {
                message = svcResponse.message;
            }
            if (svcResponse.error) {
                message = svcResponse.message;
            }
        }
        return svcResponse;
    } catch (e) {
        LOGGER.warn('[AvaTax | Commit document failed with error - {0}. File - AvaTax.js~commitDocument]', e.message);
        return {
            error: true,
            message: 'Document commit failed'
        };
    }
}

/**
 * Voids the document.
 * @param {string} orderNo - DW order number
 * @returns {*} A response object that contains information about the voided transaction
 */
base.voidDocument = function (orderNo) {
    var message = '';
    try {
        var companyCode = settingsObject.companyCode || '';
        var transactionCode = orderNo;
        var voidTransactionModel = new VoidTransactionModel.VoidTransactionModel();
        voidTransactionModel.code = voidTransactionModel.code.C_DOCVOIDED;

        var svcResponse = avaTaxClient.voidTransaction(companyCode, transactionCode, voidTransactionModel);
        // ----------------- Logentries - START --------------------
        if (!empty(svcResponse.statusCode) && svcResponse.statusCode !== 'OK') {
            message = 'AvaTax void document failed. Service configuration issue.';
        }
        if (svcResponse.error || svcResponse.message || svcResponse.errorMessage) {
            if (svcResponse.errorMessage) {
                message = svcResponse.errorMessage.error.message;
            }
            if (svcResponse.message) {
                message = svcResponse.message;
            }
            if (svcResponse.error) {
                message = svcResponse.message;
            }
        }
        return svcResponse;
    } catch (e) {
        LOGGER.warn('[AvaTax | Void document failed with error - {0}. File - AvaTax.js~voidDocument]', e.message);
        return {
            error: true,
            message: 'Document void failed'
        };
    }
}

// module exports
module.exports = base;
