'use strict';

var base = module.superModule;

base.monogram = require('*/cartridge/models/productLineItem/decorators/monogram');
base.giftbox = require('*/cartridge/models/productLineItem/decorators/giftbox');
base.customProductAttributes = require('*/cartridge/models/product/decorators/customProductAttributes');
base.availability = require('*/cartridge/models/product/decorators/availability');
base.customOrderLineItemAttributes = require('*/cartridge/models/orderLineItem/decorators/customAttributes');

module.exports = base;
