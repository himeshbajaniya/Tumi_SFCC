/**
 * Helper class for working with Emarsys API
 *
 */

var Money = require('dw/value/Money');
var Site = require('dw/system/Site');
var ShippingMgr = require('dw/order/ShippingMgr');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var web = require('dw/web');
var order = require('dw/order');
var currentSite = Site.getCurrent();

/**
 * Parse string representation of array
 * @param {string} listText - string representation of Array (may be empty)
 * @return {Array} - parsed array (null for parse error)
 */
function parseList(listText) {
    var list = [];
    if (listText && listText.length) {
        try {
            list = JSON.parse(listText);
        } catch (err) {
            list = null;
        }
    }
    return list;
}

function getProductItems(items, currencyCode) {
    var result = [];
    items.forEach(function (productLineItem) {
        result.push(getProductItem(productLineItem, currencyCode));
    });
    return result;
}

function getProductItem(productLineItem, currencyCode) {
    var collections = require('*/cartridge/scripts/util/collections');
    var ImageModel = require('*/cartridge/models/product/productImages');
    var product = productLineItem.product;
    var image = new ImageModel(product, { types: ['small'], quantity: 'all' });

    var discount = 0;

    var vasMonogramAttributes = productLineItem.custom.monogramDataOnPLI ? JSON.parse(productLineItem.custom.monogramDataOnPLI) : false;
    var vasEntries = vasMonogramAttributes ? vasMonogramAttributes : false;

    var monoPatch = vasEntries && vasEntries[0].productCode === 'MONOPATCH' ? vasEntries[0] : vasEntries[1];
    var monoTag = vasEntries && vasEntries[0].productCode === 'MONOTAG' ? vasEntries[0] : vasEntries[1];
    var monoPatchLetters = monoPatch && monoPatch.character ? monoPatch.character.split(' ') : false;
    var monoTagLetters = monoTag && monoTag.character ? monoTag.character.split(' ') : false;

    collections.forEach(productLineItem.priceAdjustments, function (priceAdjustment) {
        discount = discount + Math.abs(priceAdjustment.price.value);
    });

    return {
        StockFlag: 'In Stock',
        ProductName: productLineItem.productName,
        ProductImage: image.small[0].url,
        ItemGiftBoxPrice: 0,
        ProductPrice: productLineItem.getAdjustedNetPrice().value,
        Unit: productLineItem.product.unit,
        ItemNumber: productLineItem.productID,
        Currency: currencyCode,
        trackingnumber: '',
        ItemSaleDiscountAmount: discount,
        ProductColor: product.custom.color,
        ItemSubtotal: productLineItem.adjustedPrice.value,
        trackingurl: '',
        Quantity: productLineItem.quantityValue,
        GiftMessage: productLineItem.giftMessage,
        ColorAccentsColor: '',
        ProductSize: '',
        GiftBoxFlag: productLineItem.isGift,
        backorderdate: '',
        MonogramLetters: monoPatchLetters[0] ? monoPatchLetters[0] : '',
        MonogramLetters2: monoPatchLetters[1] ? monoPatchLetters[1] : '',
        MonogramLetters3: monoPatchLetters[2] ? monoPatchLetters[2] : '',
        MonogramFontColor: monoPatch && monoPatch.color ? monoPatch.color : '',
        MonogramFontStyle: monoPatch && monoPatch.font ? monoPatch.font : '',
        MonogramTagLetters: monoTagLetters[0] ? monoTagLetters[0] : '',
        MonogramTagLetters2: monoTagLetters[1] ? monoTagLetters[1] : '',
        MonogramTagLetters3: monoTagLetters[2] ? monoTagLetters[2] : '',
        MonogramTagFontColor: monoTag && monoTag.color ? monoTag.color : '',
        MonogramTagFontStyle: monoTag && monoTag.font ? monoTag.font : ''
    };
}

function getAddress(address, email) {
    return {
        address: {
            Email: email,
            FirstName: address.firstName,
            StateProvince: address.stateCode,
            PhoneNumber: address.phone,
            PostalCode: address.postalCode,
            Country: address.countryCode.displayValue,
            LastName: address.lastName,
            City: address.city,
            StreetAddress2: address.address2,
            StreetAddress1: address.address1
        },
        emptyAddress: {
            Email: '',
            FirstName: '',
            StateProvince: '',
            PhoneNumber: '',
            PostalCode: '',
            Country: '',
            LastName: '',
            City: '',
            StreetAddress2: '',
            StreetAddress1: ''
        }
    };
}

/**
 * @description Get gender name
 * @param {*} GenderValueCodes Gender value codes
 * @param {*} Profile current profile
 * @param {Object} FieldValueMapping Object to retrieve data from
 * @param {string} attributeId attribute Id
 * @return {string} name gender
 */
function getGenderName (GenderValueCodes, Profile, FieldValueMapping, attributeId) {
    if ('gender' in Profile && !empty(Profile.gender.displayValue) && Profile.gender.displayValue.toLowerCase() in GenderValueCodes) {
        var genderCode = GenderValueCodes[Profile.gender.displayValue.toLowerCase()];
        var genderValue = '';

        Object.keys(FieldValueMapping[attributeId]).forEach(function (keyGender) {
            var gender = FieldValueMapping[attributeId][keyGender];
            if (+gender.value === +genderCode) {
                genderValue = gender.choice;
            }
        }, this);

        return genderValue;
    }
    return '';
}

/**
 * @description Get country name
 * @param {Object} CountryValueCodes Country value codes
 * @param {Object} Address address
 * @param {Object} FieldValueMapping Object to retrieve data from
 * @param {string} attributeId attribute Id
 * @return {string} name country
 */
function getCountryName(CountryValueCodes, Address, FieldValueMapping, attributeId) {
    if ('countryCode' in Address && !empty(Address.countryCode.displayValue) && Address.countryCode.displayValue in CountryValueCodes) {
        var countryCode = CountryValueCodes[Address.countryCode.displayValue];
        var countryValue = '';

        Object.keys(FieldValueMapping[attributeId]).forEach(function (key) {
            var country = FieldValueMapping[attributeId][key];
            if (country.value === countryCode) {
                countryValue = country.choice;
            }
        }, this);
        return countryValue;
    }
    return '';
}

/**
 * @description Get attribute value
 * @param {Object} Address address
 * @param {Object} Profile current profile
 * @param {Object} Field field
 * @param {Object} CountryValueCodes Country value codes
 * @param {Object} GenderValueCodes Gender value codes
 * @param {Object} FieldValueMapping Object to retrieve data from
 * @return {string} attribute value
 */
function getAttributeValue(Address, Profile, Field, CountryValueCodes, GenderValueCodes, FieldValueMapping, getValues) {
    var attributeName = Field.placeholder;
    var attributeValue = '';
    var attributeId = Field.field;
    if (attributeName === 'gender') {
        attributeValue = getGenderName(GenderValueCodes, Profile, FieldValueMapping, attributeId);
    } else if (attributeName === 'countryCode') {
        // attributeValue = getCountryName(CountryValueCodes, Address, FieldValueMapping, attributeId);
        attributeValue = Address.countryCode.displayValue;
    } else if (attributeName.split('.')[0] === 'custom') {
        var assignedValue = getValues(attributeName, Profile, 0);
        attributeValue = getSingleChoiceFieldValue(FieldValueMapping, Field, assignedValue);
    } else if (attributeName in Address && !empty(Address[attributeName])) {
        if (attributeName === 'address1') {
            attributeValue = Address[attributeName] + (Address.address2 !== null ? ' ' + Address.address2 : '');
        } else {
            attributeValue = Address[attributeName];
        }
    } else if (attributeName in Profile && !empty(Profile[attributeName])) {
        if (attributeName === 'birthday') {
            var birthday = Profile[attributeName].getFullYear().toFixed() + '-' +
            (Profile[attributeName].getMonth() + 1).toFixed() + '-' +
            Profile[attributeName].getDate().toFixed();

            attributeValue = birthday;
        } else {
            attributeValue = Profile[attributeName];
        }
    }

    return attributeValue;
}

/**
 * @description get SingleChoiceFieldValue
 * @param {Object} FieldValueMapping Object to retrieve data from
 * @param {Object} Field Field
 * @param {string} assignedValue assignedValue
 * @return {string} value
 */
function getSingleChoiceFieldValue(FieldValueMapping, Field, assignedValue) {
    var attributeValue = '';
    if (assignedValue) {
        var listOfValues = [];    // list of all possible values for specified field

        if (FieldValueMapping[Field.field]) {
            listOfValues = FieldValueMapping[Field.field];
        }

        var hasOtherValue = false;  // flag to find if 'Other' value is present among all possible values
        var otherValue = '';
        if (listOfValues.length > 0) {
            Object.keys(listOfValues).forEach(function (key) {
                var value = listOfValues[key];
                if (assignedValue.toLowerCase() === value.choice.toLowerCase()) {
                    attributeValue = value.choice;
                } else if (value.choice.toLowerCase() === 'other') {
                    hasOtherValue = true;
                    otherValue = value.choice;
                }
            }, this);
        } else {
            return assignedValue;
        }

        if (!attributeValue && hasOtherValue) {
            attributeValue = otherValue;
        }
    }

    return attributeValue;
}

/**
 * @description main function (constructor)
 */
function EmarsysHelper() {
    /**
     * @description Triggers API call
     * @param {string} endpoint - the endpoint to use when generating urls
     * @param {Object} requestBody - the request object
     * @param {string} requestMethod - method GET/POST/...
     * @return {Object} service Call
     */
    this.triggerAPICall = function (endpoint, requestBody, requestMethod) {
        var service = require('*/cartridge/scripts/service/emarsysService');

        return service.call(endpoint, requestBody, requestMethod);
    };

    /**
     * @description Get sourceId
     * @param {Object} callResult - result call request
     * @param {string} name - name source
     * @return {string} soursId
     */
    this.getSourceId = function (callResult, name) {
        var dataObj = JSON.parse(callResult.object);
        var sources = dataObj.data;
        var sourceId;

        for (var i = 0; i < sources.length; i++) {
            var source = sources[i];
            if (source.name === name) {
                sourceId = source.id;
                break;
            }
        }
        return sourceId;
    };

    /**
     * @description Add new fields
     * @param {Object} map - Object to retrieve data from
     * @param {Object} requestBody - The request object
     * @return {void}
     */
    this.addFields = function (map, requestBody) {
        var reqBody = requestBody;
        if (map) {
            // add new fields
            Object.keys(map).forEach(function (key) {
                if (key === '5') {
                    reqBody[key] = this.convertGenderCode(map[key]);
                } else if (key === '14') {
                    reqBody[key] = this.convertCountryCode(map[key]);
                } else if (map[key]) {
                    reqBody[key] = map[key];
                }
            }, this);
        }
    };

    /**
     * @description Method adds object's specified keys' values to map object which is used to populate request body sent to emarsys
     * @param {Object} object Object to retrieve data from
     * @param {Object} map Object to add data to
     */
    this.addDataToMap = function (object, map) {
        // read site preference value with emarsys ids for fields
        var emarsysIdsMap = JSON.parse(currentSite.getCustomPreferenceValue('emarsysContactFieldsMap'));
        var newMap = map;

        Object.keys(emarsysIdsMap).forEach(function (element) {
            var value = null;
            value = this.getValues(emarsysIdsMap[element], object, 0);

            if (value && typeof (value) === 'object') {
                value = value.value;
            }

            if (value) {
                newMap[element] = value;
            }
        }, this);

        // if addres2 property is not null add it to the address field
        if ('address2' in object && object.address2) {
            newMap['10'] += ', ' + object.address2;
        }
    };

    /**
     * @description Method adds Address object's specified keys' values to map object which is used to populate request body sent to emarsys
     * @param {Object} object Object to retrieve data from
     * @param {Object} map Object to add data to
     * @param {Int} i Int address counter
     */
    this.addAddressDataToMap = function (object, map, i) {
        var emarsysIdsMap = JSON.parse(currentSite.getCustomPreferenceValue('emarsysAddressFieldsMap'));
        var newMap = map;

        Object.keys(emarsysIdsMap[i]).forEach(function (element) {
            var value = null;
            value = this.getValues(emarsysIdsMap[i][element], object, 0);

            if (typeof (value) === 'object') {
                value = value.value;
            }

            if (value) {
                newMap[element] = value;
            }
        }, this);
    };

    /**
     * @description Returns country code object
     * @param {string} countryCode - specific country code
     * @return {Object} coutnry code
     */
    this.convertCountryCode = function (countryCode) {
        var countryCodes = JSON.parse(currentSite.getCustomPreferenceValue('emarsysCountryCodes'));
        return countryCodes[countryCode.toLowerCase()];
    };

    /**
     * @description returns gender code object
     * @param {string} gender - specific gender code
     * @return {Object} gender codes
     */
    this.convertGenderCode = function (gender) {
        var genderCodes = JSON.parse(currentSite.getCustomPreferenceValue('emarsysGenderCodes'));
        return genderCodes[gender];
    };

    /**
     * @description  This function transforms the field string into an object
     * and iterates through the object parameter to find values. If you only have one attribute to go through, use skipLoop = 1;
     * @param {string} field - Current field
     * @param {Object} object - Object to retrieve data from
     * @param {number} skipLoop - Number skip loop
     * @return {string} Attributtes
     */
    this.getValues = function (field, object, skipLoop) {
        if (!empty(field)) {
            var toObject = field.split('.');
            var attributes = '';

            if (skipLoop === 0 && toObject[0] in object) {
                attributes = object[toObject[0]];
            }

            if (skipLoop === 1 && toObject[1] in object) {
                attributes = object[toObject[1]];
            }

            toObject.forEach(function (val, key) {
                if (skipLoop) {
                    if (key !== 0 && key !== 1) {
                        attributes = attributes[val];
                    }
                } else if (key !== 0) {
                    attributes = val in attributes ? attributes[val] : '';
                }
            }, this);

            if (attributes instanceof Money) {
                attributes = attributes.getValueOrNull() || '0';
            }

            // 23.10.18 : fix g.h. : Date Attribute for order.creationDate is wrong.
            if (attributes instanceof Date) {
                attributes = this.formatDate(attributes, '-', ':');
            }

            try {
                if (typeof (attributes) === 'object') {
                    attributes = attributes.value;
                }
            } catch (e) {
                attributes = attributes || '';
            }

            return attributes;
        }
        return null;
    };

    /**
     * @description Returns link to PDP
     * @param {Object} product - Current product
     * @returns {string} Current url or null
     */
    this.returnProductURL = function (product) {
        if (!empty(product)) {
            var pid = null;
            var cgid = null;
            if (product instanceof order.ProductLineItem) {
                pid = product.productID;
                cgid = product.categoryID;
            } else {
                var firstCategoryID = !empty(product.allCategories) ? product.allCategories[0].getID() : null;
                var primaryCategoryID = !empty(product.primaryCategory) ? product.primaryCategory.getID() : null;
                var classificationCategoryID = !empty(product.classificationCategory) ? product.classificationCategory.getID() : null;
                cgid = primaryCategoryID || classificationCategoryID || firstCategoryID;
                pid = product.ID;
            }
            var URLAction = new web.URLAction('Product-Show', Site.current.ID);
            var URLParameter = new web.URLParameter('pid', pid);
            var URL = web.URLUtils.https(URLAction, URLParameter);
            if (cgid) {
                URL.append('cgid', cgid);
            }
            return URL;
        }
        return null;
    };


    /**
     * @description Append the product to our product list
     * @param {Object} mappedFields - Object to retrieve data from
     * @param {Object} Order - Object to retrieve data from
     * @param {Object} dataObject - Object to add data to
     * @return {void}
     */
    this.appendProductInfo = function (mappedFields, Order, dataObject) {
        /**
         * @description Add product image url
         * @param {string} viewType - Image size
         * @param {Object} placeholder - Placeholder
         * @param {Object} productLineItem - ProductLineItem
         * @return {void}
         */
        function addProductImageUrl(viewType, placeholder, productLineItem) {
            var addProduct = {};
            addProduct[placeholder] = productLineItem.product.getImage(viewType) !== null ? productLineItem.product.getImage(viewType).getAbsURL().toString() : '';
        }

        if (mappedFields && Order && dataObject) {
            for (var i = 0; i < Order.shipments[0].productLineItems.length; i++) {
                // Needed vars
                var productLineItem = Order.shipments[0].productLineItems[i];
                var rebate = '';
                var url;

                // Get product URL
                url = this.returnProductURL(productLineItem);

                // Get product price adjustments
                rebate = this.returnProductRebate(productLineItem);

                // Add product
                var addProduct = {};

                for (var j = 0; j < mappedFields.length; j++) {
                    var placeholder = mappedFields[j].placeholder;
                    var field = mappedFields[j].field;
                    var splitField = mappedFields[j].field.split('.');

                    switch (splitField[0]) {
                        case 'product':
                            if (splitField[1] === 'url') {
                                addProduct[placeholder] = url.toString();
                            } else if (splitField[1] === 'image') {
                                var viewType = currentSite.getCustomPreferenceValue('emarsysProductImageSize');
                                addProductImageUrl(viewType, placeholder, productLineItem);
                            } else if (splitField[1] === 'rebate') {
                                addProduct[placeholder] = rebate;
                            } else {
                                addProduct[placeholder] = this.getValues(field, productLineItem, 1);
                            }
                            break;

                        case 'productItemPrice':
                            addProduct[placeholder] = productLineItem.proratedPrice.toFormattedString();
                            break;

                        case 'productItemGrossPrice':
                            addProduct[placeholder] = productLineItem.proratedPrice.add(productLineItem.adjustedTax).toFormattedString();
                            break;

                        case 'productItemTax':
                            addProduct[placeholder] = productLineItem.adjustedTax.toFormattedString();
                            break;
                        default:
                            break;
                    }
                }

                dataObject.push(addProduct); // append the product to our product list
            }
        }
    };

    /**
     * @description This function adds order information to the JSON object sent to Emarsys
     * @param {Object} mappedFields - Object to retrieve data from
     * @param {Object} dataObject - Object to add data to
     * @param {Object} Order - Object to retrieve data from
     * @return {void}
     */
    this.appendGlobalMappedFieldsObject = function (mappedFields, dataObject, Order) {
        var newDataObject = dataObject;
        /**
         * @description Select placeholder
         * @param {Object} mappedField1 - To retrieve data from
         * @return {void}
         */
        function mappedField(mappedField1) {
            var placeholder = mappedField1.placeholder;
            var field = mappedField1.field;
            var splitField = mappedField1.field.split('.');

            switch (splitField[0]) {
                /*  Billing address
                    The available element should starts with 'billingAddress' and it should contain real attributes
                    in this way we get needed values from billingAddress object.
                    Examples: billingAddress.address1, billingAddress.postalCode, billingAddress.countryCode.displayValue, etc.
                */
                case 'billingAddress':
                    newDataObject[placeholder] = this.getValues(field, Order, 0);
                    break;

                /*  Shipping address
                    The available element should starts with 'shippingAddress' and it should contain real attributes
                    in this way we get needed values from order.shipments[0].shippingAddress object.
                    Examples: shippingAddress.address1, shippingAddress.postalCode, shippingAddress.countryCode.displayValue, etc.
                */
                case 'shippingAddress':
                    newDataObject[placeholder] = this.getValues(field, Order.shipments[0], 0);
                    break;

                /*  General order attributes
                    The available element should starts with 'order' and it should contain real attributes
                    in this way we get needed values from order object.
                    Examples: order.orderNo, order.creationDate, etc.
                */
                case 'order':
                    newDataObject[placeholder] = this.getValues(field, Order, 1);
                    break;

                /*  Tracking number
                    Separate case for 'trackingNumber' element only.
                */
                case 'trackingNumber':
                    newDataObject[placeholder] = Order.shipments[0].trackingNumber;
                    break;

                /*  Delivery method
                    Separate case for 'deliveryMethod.display' element only.
                    It reads shipping method name and description from order.shipments[0].shippingMethod object
                */
                case 'deliveryMethod':
                    newDataObject[placeholder] = Order.shipments[0].shippingMethod.displayName + ' - ' + Order.shipments[0].shippingMethod.description;
                    break;

                /*  Payment method
                    Separate case for 'paymentMethod.display' element only.
                    It reads 1st payment method from order object
                */
                case 'paymentMethod':
                    newDataObject[placeholder] = Order.paymentInstruments[0].paymentMethod;
                    break;

                /*  Order rebate
                    Separate case for 'orderRebate' element only.
                */
                case 'orderRebate':
                    newDataObject[placeholder] = this.returnOrderRebate(Order).toFormattedString();
                    break;

                /*  Shipping costs
                    Separate case for 'shippingCosts.display' element only,
                    it reads shipping total price from order.shipments[0] object
                */
                case 'shippingCosts':
                    newDataObject[placeholder] = Order.shipments[0].shippingTotalPrice.toFormattedString();
                    break;

                /* Tracking number, shipment company, date of arrival, tracking link,
                    should have the following element definition:
                    custom.shipmentTrackingNumber
                    custom.shippingCompany
                    custom.arrivalDate
                    custom.trackingLink
                    The available element should starts with 'custom',
                    it reads custom attributes values from order.shipments[0] object
                */
                case 'custom':
                    newDataObject[placeholder] = this.getValues(field, Order.shipments[0].custom, 1);
                    break;

                case 'constant':
                    newDataObject[placeholder] = splitField[1];
                    break;
                default:
                    break;
            }
        }

        if (!empty(mappedFields) && !empty(newDataObject) && !empty(Order)) {
            for (var i = 0; i < mappedFields.length; i++) {
                mappedField.call(this, mappedFields[i]);
            }
        }
    };

    /**
     * @description Returns object attribute
     * @param {Object} obj obj
     * @param {Object} attributes - array of attributes
     * @returns {Money|string} Value
     */
    this.getObjectAttr = function (obj, attributes) {
        // if we have no attributes, then return empty string
        if (!attributes.length) {
            return '';
        }

        // set attribute as first attribute from object
        var lineItemAttr = null;
        try {
            lineItemAttr = obj[attributes[0]];
        } catch (e) {
            lineItemAttr = null;
        }

        // remove first element from attrArr
        attributes.shift();

        // while attribute exists in it's parent object
        if (lineItemAttr) {
            attributes.forEach(function (key) {
                // check if object is not empty
                if (lineItemAttr) {
                    // try to retrieve object's key
                    try {
                        lineItemAttr = lineItemAttr[key];
                    } catch (e) {
                        lineItemAttr = null;
                    }
                }
            });
        }
        if (lineItemAttr instanceof Money) {
            lineItemAttr = lineItemAttr.getValueOrNull() || '0';
        }
        return lineItemAttr || '';
    };

   /**
     * @description Returns product rebate
     * @param {Object} product - Current product
     * @returns {dw.value.Money} Product rebate
     */
    this.returnProductRebate = function (product) {
        var currencyCode = Site.current.defaultCurrency;
        var rebate = new Money(0, currencyCode);
        if (!empty(product)) {
            var quantity = product.quantityValue;
            var adjustedPrice = product.adjustedPrice.divide(quantity);
            var basePrice = product.basePrice;
            currencyCode = product.price.currencyCode;
            rebate = new Money(0, currencyCode);
            if (basePrice.subtract(adjustedPrice).value > 0) {
                rebate = basePrice.subtract(adjustedPrice);
                rebate = rebate.multiply(quantity);
            }
        }
        return rebate;
    };

    /**
     * @description Returns order rebate
     * @param {Object} Order - Current order
     * @returns {dw.value.Money} Product rebate
     */
    this.returnOrderRebate = function (Order) {
        var currencyCode = Site.current.defaultCurrency;
        var rebate = new Money(0, currencyCode);
        if (!empty(Order)) {
            var shippingMethod = Order.shipments[0].getShippingMethod();
            var shippingModel = ShippingMgr.getShipmentShippingModel(Order.shipments[0]);
            var shippingCost = shippingModel.getShippingCost(shippingMethod).amount;

            currencyCode = Order.currencyCode;
            rebate = new Money(0, currencyCode);

            // order level rebate
            if (Order.priceAdjustments.length > 0) {
                for (var i = 0; i < Order.priceAdjustments.length; i++) {
                    var basePrice = Order.priceAdjustments[i].basePrice;
                    rebate = rebate.add(basePrice.multiply(-1));
                }
            }

            // product level rebate
            var productLineItems = Order.shipments[0].productLineItems;
            for (var j = 0; j < productLineItems.length; j++) {
                rebate = rebate.add(this.returnProductRebate(productLineItems[j]));
            }

            // shipping level rebate
            if (Order.shipments[0].shippingTotalTax.value === 0 && shippingCost.value !== Order.shipments[0].shippingTotalTax.value) {
                rebate = rebate.add(shippingCost);
            }
        }
        return rebate;
    };

    /**
     * @description Add SourceId to request
     * @param {Object} object - Input object
     * @return {void}
     */
    this.addSourceIdToRequest = function (object) {
        var newObject = object;
        var source = currentSite.getCustomPreferenceValue('emarsysSourceID');

        if (source) {
            newObject.source_id = source;
        }
    };

    /**
     * @description Format date
     * @param {string} date - Current date
     * @param {string} dateDelimeter - Date delimeter
     * @param {string} timeDelimeter - Time delimeter
     * @return {string} Format date
     */
    this.formatDate = function (date, dateDelimeter, timeDelimeter) {
        var newDateDelimeter = dateDelimeter || false;
        var newTimeDelimeter = timeDelimeter || '';

        var day = (date.getDate() > 9 ? '' : '0') + date.getDate();
        var month = (date.getMonth() + 1 > 9 ? '' : '0') + (date.getMonth() + 1);
        var year = (date.getFullYear() > 9 ? '' : '0') + date.getFullYear();
        var hours = (date.getHours() > 9 ? '' : '0') + date.getHours();
        var minutes = (date.getMinutes() > 9 ? '' : '0') + date.getMinutes();
        var seconds = (date.getSeconds() > 9 ? '' : '0') + date.getSeconds();

        var firstHalf = [year, month, day].join(newDateDelimeter);
        var secondHalf = [hours, minutes, seconds].join(newTimeDelimeter);

        var dateGlue = '';
        if (newDateDelimeter && dateDelimeter) {
            dateGlue = ' ';
        }

        return [firstHalf, secondHalf].join(dateGlue);
    };

    /**
     * @description Get Emarsys profile fields descriptions
     * @return {Object} - Emarsys fields descriptions
     */
    this.prepareFieldsDescriptions = function () {
        var fieldValueMapping = {};
        var profileFieldsList = [];
        try {
            var ProfileFieldsCO = CustomObjectMgr.getCustomObject('EmarsysProfileFields', 'profileFields');
            profileFieldsList = JSON.parse(ProfileFieldsCO.custom.result);
        } catch (err) {
            throw new Error('[Emarsys emarsysHelper.js getEmarsysProfileFields()] - ***Get Emarsys profile fields error message:' + err.message + '\n' + err.stack);
        }

        try {
            fieldValueMapping = JSON.parse(currentSite.getCustomPreferenceValue('emarsysSingleChoiceValueMapping'));
        } catch (err) {
            throw new Error('[Emarsys emarsysHelper.js getSingleChoiceValueMapping()] - ***Get single choice value mapping error message:' + err.message + '\n' + err.stack);
        }

        var profileFields = {};
        profileFieldsList.forEach(function (fieldObj) {
            var field = {
                id: '' + fieldObj.id,
                name: fieldObj.name,
                string_id: fieldObj.string_id,
                application_type: fieldObj.application_type
            };

            field.isSingleChoice = Object.keys(this.fieldValueMapping).indexOf(field.id) !== -1;
            // get options data (if any exist)
            if (field.isSingleChoice) {
                field.options = {};
                this.fieldValueMapping[field.id].forEach(function (valueObj) {
                    this.options[valueObj.choice] = valueObj.value;
                }, field);
            }

            // write data to profile fields collection if the record is valid
            if (!empty(fieldObj.string_id) && !empty(fieldObj.id)) {
                this.profileFields[fieldObj.string_id] = field;
            }
        }, {
            profileFields: profileFields,
            fieldValueMapping: fieldValueMapping
        });
        return profileFields;
    };

    /**
     * Reads specified fields of EmarsysExternalEvents custom object
     * @param {string} customObjectKey - EmarsysExternalEvents custom object key
     * @param {Array} fieldsKeys - keys of fields to read
     * @return {Object} - custom object data
     */
    this.readEventsCustomObject = function (customObjectKey, fieldsKeys) {
        var custom = {};

        // get object which contain external events description (on BM side)
        custom.object = CustomObjectMgr.getCustomObject('EmarsysExternalEvents', customObjectKey);
        if (custom.object === null) {
            throw new Error(
                'Custom object EmarsysExternalEvents with id "' +
                customObjectKey +
                '" does not exist'
            );
        }

        custom.fields = {};
        fieldsKeys.forEach(function (fieldKey) {
            var isValid = true;
            var result = null;

            switch (fieldKey) {
                case 'newsletterSubscriptionSource':
                case 'otherSource':
                    result = parseList(this.object.custom[fieldKey]);
                    isValid = !empty(result) && result.length !== 0;
                    break;
                case 'newsletterSubscriptionResult':
                case 'otherResult':
                    result = parseList(this.object.custom[fieldKey]);
                    isValid = !empty(result);
                    break;
                case 'campaignsCategory':
                    result = this.object.custom[fieldKey];
                    isValid = !empty(result);
                    break;
                default:
                    result = this.object.custom[fieldKey];
            }

            if (!isValid) {
                throw new Error(
                    'Invalid field "' +
                    fieldKey +
                    '" in custom object EmarsysExternalEvents'
                );
            }
            this.fields[fieldKey] = result;
        }, custom);

        return custom;
    };

    /**
     * Prepare collection from the list of items by simple value
     * @param {Array} list - list to prepare collection from
     * @param {Function} getKeyValue - custom function to get key property (required for list of objects)
     * @return {Object} - resultant collection
     */
    this.getValuesCollection = function (list, getKeyValue) {
        var context = {
            collection: {},
            getKeyValue: getKeyValue
        };

        if (!empty(list)) {
            if (empty(getKeyValue) && typeof list[0] !== 'object') {
                list.forEach(function (item) {
                    if (item && !this.collection[item]) {
                        this.collection[item] = item;
                    }
                }, context);
            } else if (!empty(getKeyValue) && typeof list[0] === 'object') {
                list.forEach(function (item) {
                    var keyValue = item && this.getKeyValue(item);
                    if (keyValue && !this.collection[keyValue]) {
                        this.collection[keyValue] = item;
                    }
                }, context);
            }
        }

        return context.collection;
    };

    this.populateOrderData = function (order) {
        var collections = require('*/cartridge/scripts/util/collections');
        var discount = 0;

        collections.forEach(order.priceAdjustments, function (priceAdjustment) {
            discount = discount + Math.abs(priceAdjustment.price.value);
        });

        return {
            Order: {
                Status: 'SENT_FOR_FULFILLMENT',
                ShippingAmount: order.getAdjustedShippingTotalNetPrice().value,
                CreditCardExpiry: order.paymentInstrument.creditCardExpirationMonth + '/' + order.paymentInstrument.creditCardExpirationYear,
                LastFourCreditCardDigits: order.paymentInstrument.creditCardNumber,
                OrderNumber: order.orderNo,
                GiftCardNumber: '',
                SubTotal: order.adjustedMerchandizeTotalNetPrice.value,
                OrderDate: this.formatDate(order.creationDate, '-', ':'),
                GiftCardAppliedAmount: order.giftCertificateTotalPrice.value,
                BillingAddress: getAddress(order.billingAddress, order.customerEmail).address,
                StatusUrl: '',
                GiftBoxPrice: 0,
                PromoCodesAppliedAmount: 0,
                Total: order.totalGrossPrice.value,
                Currency: order.getCurrencyCode(),
                PaymentMethod: order.paymentInstrument.creditCardType,
                SaleDiscountAmount: discount,
                PersonalizationPrice: 0,
                SalesTaxAmount: order.totalTax.value
            },
            uid: order.etag,
            Language: order.customerLocaleID ? String(order.customerLocaleID).split('_')[0] : 'en',
            FirstName: order.billingAddress.firstName,
            Title: '',
            Country: order.billingAddress.countryCode.displayValue,
            ORDER_BILLING_ADDRESS_EMAIL: order.customerEmail,
            LastName: order.billingAddress.lastName
        };
    };

    this.splitLineItemAsConsignments = function (order) {
        var HashMap = require('dw/util/HashMap');
        var shipment;
        var productLineItems;
        var consignments = new HashMap();
        for (var i = 0; i < order.shipments.length; i++) {
            shipment = order.shipments[i];
            productLineItems = shipment.productLineItems;

            for (var s = 0; s < productLineItems.length; s++) {
                var productLineItem = productLineItems[s];
                var consignmentID = productLineItem.custom.consignmentID;
                var shippingAddress = getAddress(shipment.shippingAddress, order.customerEmail);
                var isInStorePickup = shipment.custom.shipmentType === 'instore';

                var currencyCode = order.getCurrencyCode();

                if (!consignments.containsKey(consignmentID)) {
                    var consignment = {
                        Status: 'processing',
                        LinkToTrackingNumber: '',
                        ShippingPrice: shipment.adjustedShippingTotalGrossPrice.valueOrNull,
                        InStorePickUpFlag: isInStorePickup,
                        Currency: order.getCurrencyCode(),
                        Total: shipment.adjustedMerchandizeTotalGrossPrice.value,
                        DeliveryAddress: isInStorePickup ? shippingAddress.emptyAddress : shippingAddress.address,
                        DeliveryMode: shipment.shippingMethod.displayName,
                        Tax: shipment.shippingTotalTax.getValueOrNull() || 0,
                        Items: [getProductItem(productLineItem, currencyCode)],
                        InStorePickupAddress: isInStorePickup ? shippingAddress.address: shippingAddress.emptyAddress
                    };
                    consignments.put(consignmentID, consignment);
                } else {
                    consignments.get(consignmentID).Items.push(getProductItem(productLineItem, currencyCode));
                }
            }
        }

        return consignments;
    };

    this.populateShippingConfirmData = function (args) {
        var order = args.Order;
        var shipment = args.items[0].shipment;
        var consignmentID = args.consignmentID;
        var items = args.items;
        var currencyCode = order.getCurrencyCode();
        var shippingAddress = getAddress(shipment.shippingAddress, order.customerEmail);
        var isInStorePickup = shipment.custom.shipmentType === 'instore';

        return {
            uid: order.etag,
            Language: order.customerLocaleID ? String(order.customerLocaleID).split('_')[0] : 'en',
            FirstName: order.billingAddress.firstName,
            Title: '',
            Country: order.billingAddress.countryCode.displayValue,
            Consignment: {
                Status: 'shipped',
                LinkToTrackingNumber: '',
                ShippingPrice: shipment.adjustedShippingTotalGrossPrice.valueOrNull,
                InStorePickUpFlag: isInStorePickup,
                Currency: order.getCurrencyCode(),
                Total: shipment.adjustedMerchandizeTotalGrossPrice.value,
                DeliveryAddress: isInStorePickup ? shippingAddress.emptyAddress : shippingAddress.address,
                DeliveryMode: shipment.shippingMethod.displayName,
                Tax: shipment.shippingTotalTax.getValueOrNull() || 0,
                Items: getProductItems(items, currencyCode),
                InStorePickupAddress: isInStorePickup ? shippingAddress.address: shippingAddress.emptyAddress
            },
            OrderNumber: order.orderNo,
            LastName: order.billingAddress.lastName,
            ORDER_BILLING_ADDRESS_EMAIL: order.customerEmail,
            trackingNumber: ''
        };
    };

    this.exportCustomerInfo = function (profile) {
        var eventsHelper = require('*/cartridge/scripts/helpers/triggerEventHelper');
        var address;
        var customerArray = {};
        var customerContactList = [];
        var countryValueCodes = JSON.parse(currentSite.getCustomPreferenceValue('emarsysCountryCodes'));
        var genderValueCodes = JSON.parse(currentSite.getCustomPreferenceValue('emarsysGenderCodes'));
        var fieldValueMapping = JSON.parse(currentSite.getCustomPreferenceValue('emarsysSingleChoiceValueMapping'));
        var fieldConfigurationCO = CustomObjectMgr.getCustomObject('EmarsysDBLoadConfig', 'dbloadConfig');
        var fieldConfiguration = JSON.parse(fieldConfigurationCO.custom.mappedFields);
        if (profile.addressBook.preferredAddress !== null) {
            address = profile.addressBook.preferredAddress;
        } else if (profile.addressBook.addresses.length > 0) {
            address = profile.addressBook.addresses[0];
        } else {
            address = {};
        }

        var customerData = function (indexField) {
            var Field = fieldConfiguration[indexField];
            var key = Field.field;
            customerArray[key] = getAttributeValue(address, profile, Field, countryValueCodes, genderValueCodes, fieldValueMapping, this.getValues);
        };

        customerContactList.push(customerArray);
        Object.keys(fieldConfiguration).forEach(customerData, this);
        var request = {
            keyId: '3',
            contacts: customerContactList
        };

        eventsHelper.createAccountIfNotExist(customer.profile.email, request);
    }
}

module.exports = EmarsysHelper;
