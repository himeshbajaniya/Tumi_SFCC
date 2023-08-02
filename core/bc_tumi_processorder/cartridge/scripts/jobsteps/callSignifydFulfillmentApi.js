'use strict';
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var HookMgr = require('dw/system/HookMgr');
var Site = require('dw/system/Site');
var collections = require('*/cartridge/scripts/util/collections');
var signifydFulfilmentEntries;

function read(args) {
    if( signifydFulfilmentEntries.hasNext() ) {
        return signifydFulfilmentEntries.next();
    }
    return null;
}

function process(signifydFulfilmentEntry, args) {
    return signifydFulfilmentEntry;
}

function write(args, jobparams) {
    collections.forEach(args, function (signifydFulfilmentEntry) {
        if (HookMgr.hasHook('app.singnifyd.fulfillment')) {
            HookMgr.callHook('app.singnifyd.fulfillment', 'sendFulfillment', signifydFulfilmentEntry.custom.orderno, signifydFulfilmentEntry.custom.pliuuid);
        }
    });
}

function beforeStep(args) {
    var siteID = Site.getCurrent().getID();
    if (siteID === 'tumi-us') {
        signifydFulfilmentEntries =  CustomObjectMgr.getAllCustomObjects('SignifydFulfilmentEntriesForUS');
    } else if (siteID === 'tumi-ca') {
        signifydFulfilmentEntries =  CustomObjectMgr.getAllCustomObjects('SignifydFulfilmentEntriesForCA');
    }
    
}

module.exports = {
    read: read,
    process: process,
    write: write,
    beforeStep: beforeStep
};