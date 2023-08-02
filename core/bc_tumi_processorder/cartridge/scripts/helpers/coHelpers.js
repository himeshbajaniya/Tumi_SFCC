'use strict';

const CUSTOM_OBJ_TYPE = 'OrderReturns';
const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const Transaction = require('dw/system/Transaction');

function save(data) {
    if (!data || !data.entryCode) return false;
    Transaction.wrap(() => {
        var co = CustomObjectMgr.getCustomObject(CUSTOM_OBJ_TYPE, data.entryCode) || CustomObjectMgr.createCustomObject(CUSTOM_OBJ_TYPE, data.entryCode);
        Object.keys(data).forEach((key) => {
            if (co.describe().getCustomAttributeDefinition(key)) co.custom[key] = data[key];
        });
    });
    return true;
}

function fetch() {
    return CustomObjectMgr.queryCustomObjects(CUSTOM_OBJ_TYPE, null, null, null);
}

function remove(co) {
    Transaction.wrap(() => CustomObjectMgr.remove(co));
}

function CoHelpers() {
    this.save = save;
    this.fetch = fetch;
    this.remove = remove;
}

module.exports = CoHelpers;