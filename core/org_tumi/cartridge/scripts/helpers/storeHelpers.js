'use strict';

/**
 * Searches for stores and creates a plain object of the stores returned by the search
 * @param {string} radius - selected radius
 * @param {string} postalCode - postal code for search
 * @param {string} lat - latitude for search by latitude
 * @param {string} long - longitude for search by longitude
 * @param {Object} geolocation - geloaction object with latitude and longitude
 * @param {boolean} showMap - boolean to show map
 * @param {dw.web.URL} url - a relative url
 * @returns {Object} a plain object containing the results of the search
 */
function getStores(radius, postalCode, lat, long, geolocation, showMap, url, products, profile) {
    var StoresModel = require('*/cartridge/models/stores');
    var StoreMgr = require('dw/catalog/StoreMgr');
    var Site = require('dw/system/Site');
    var URLUtils = require('dw/web/URLUtils');
    var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
    var cookieHelpers = require('*/cartridge/scripts/helpers/cookieHelper');
    var siteCountryCode = dw.system.Site.getCurrent().getCustomPreferenceValue("siteCountryCode");

    var currentGeoLocation = cookieHelpers.getCookie('geoLocation');
    if (currentGeoLocation) {
        var latlong = currentGeoLocation.split(',');
        if (latlong.length > 1) {
            geolocation.latitude = parseFloat(latlong[0].split('=')[1]);
            geolocation.longitude = parseFloat(latlong[1].split('=')[1]);
        }
    }

    var distanceUnit = siteCountryCode === 'US' ? 'mi' : 'km';
    var resolvedRadius = radius ? parseInt(radius, 10) : 15;

    var searchKey = {};
    var storeMgrResult = null;
    var location = {};

    if (postalCode && postalCode !== '') {
        // find by postal code
        searchKey = postalCode;
        storeMgrResult = StoreMgr.searchStoresByPostalCode(
            siteCountryCode,
            searchKey,
            distanceUnit,
            resolvedRadius
        );
        searchKey = { postalCode: searchKey };
    } else {
        // find by coordinates (detect location)
        location.lat = lat && long ? parseFloat(lat) : geolocation.latitude;
        location.long = long && lat ? parseFloat(long) : geolocation.longitude;

        storeMgrResult = StoreMgr.searchStoresByCoordinates(location.lat, location.long, distanceUnit, resolvedRadius);
        searchKey = { lat: location.lat, long: location.long };
    }

    var actionUrl = url || URLUtils.url('Stores-FindStores', 'showMap', showMap).toString();
    var apiKey = Site.getCurrent().getCustomPreferenceValue('mapAPI');
    var customerStoreDetails = {
        isAuthenticated : false
    }
    if (profile) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            profile.customerNo
        );
        var custProfile = customer.getProfile();
        if(custProfile) {
            customerStoreDetails.favouriteStore = custProfile.custom.favouriteStore;
        }
        customerStoreDetails.isAuthenticated = true;
    }

    var stores = new StoresModel(storeMgrResult.entrySet(), searchKey, resolvedRadius, actionUrl, apiKey, customerStoreDetails);
    var outOfStockStores = [];
    var storeWithInventory = false;
    if (products) {
        stores.stores = stores.stores.filter(function (store) {
            var storeInventoryListId = store.inventoryListId;
            if (storeInventoryListId) {
                var storeInventory = ProductInventoryMgr.getInventoryList(storeInventoryListId);
                if (storeInventory) {
                    return products.every(function (product) {
                        var inventoryRecord = storeInventory.getRecord(product.id);
                        var isInStock = inventoryRecord && inventoryRecord.ATS.value >= 1;//product.quantity;
                        if (isInStock) {
                            storeWithInventory = true;
                            store.inventory = inventoryRecord.ATS.value;
                            return isInStock;
                        }
                        store.inventory = 'OOS'; // out of stock
                        outOfStockStores.push(store);
                        return isInStock;
                    });
                }
            }
        });
        if (outOfStockStores.length > 0) {
            for ( var i in outOfStockStores ) {
                stores.stores.push(outOfStockStores[i]);
            }
        }
    }
    stores.storeWithInventory = storeWithInventory
    return stores;
}

/**
 * Searches for stores and check for the inventory for given product
 * @param {Object} store - store object
 * @returns {Object} a plain object containing the store timings
 */
function storeHours(storeTimeDetails) {
    try {
        var storetiming = [];
        if (storeTimeDetails) {
            var storeTime = storeTimeDetails.split(',');
            for (var i = 0; i < storeTime.length; i++) {
                var timing = { 
                    day: '',
                    time: ''
                }
                var timeSplit = storeTime[i].split(' ');
                if(timeSplit.length > 0) {
                    timing.day = timeSplit[0];
                    if(timeSplit[1] && timeSplit[1].toLowerCase() == 'closed'){
                        timing.time = 'closed';
                    } else {
                        var hours = timeSplit[1].split('-');
                        if(hours.length > 0) {
                            timing.time = SetHoursTime(hours[0].split(':')[0]) + ' - ' + SetHoursTime(hours[1].split(':')[0]);
                        }
                    }
                }
                storetiming.push(timing);
            }
        }
    } catch (error) {}
    
    return storetiming;
}

/**
 * Searches for stores and check for the inventory for given product
 * @param {string} time hours
 * @returns {string} hours string
 */
function SetHoursTime(time) {
    if (time - 12 >= 0) {
        time += ':00 PM';
    } else {
        time += ':00 AM';
    }
    return time;
}

/**
 * Searches for stores and check for the inventory for given product
 * @param {Object} geolocation - geloaction object with latitude and longitude
 * * @param {string} product - product id
 */
 function getStoresInventoryForProduct(latitude, longitude, product) {
    var StoresModel = require('*/cartridge/models/stores');
    var StoreMgr = require('dw/catalog/StoreMgr');
    var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
    var getCurrent = dw.system.Site.getCurrent();
    var siteCountryCode = getCurrent.getCustomPreferenceValue("siteCountryCode");
    var radius = getCurrent.getCustomPreferenceValue('storeLookupMaxDistance');
    var distanceUnit = siteCountryCode === 'US' ? 'mi' : 'km';
    var resolvedRadius = radius ? parseInt(radius, 10) : 50;

    var storeMgrResult = StoreMgr.searchStoresByCoordinates(Number(latitude), Number(longitude), distanceUnit, resolvedRadius);
    var stores = new StoresModel(storeMgrResult.entrySet(), '', resolvedRadius, '', '');
    var storeWithInventory = false;
    if (product) {
        stores.stores.forEach(function (store) {
            var storeInventoryListId = store.inventoryListId;
            if (storeInventoryListId) {
                var storeInventory = ProductInventoryMgr.getInventoryList(storeInventoryListId);
                if (storeInventory) {
                    var inventoryRecord = storeInventory.getRecord(product);
                    var isInStock = inventoryRecord && inventoryRecord.ATS.value >= 1; //product.quantity;
                    if (isInStock) {
                        storeWithInventory = true;
                        return;
                    }
                }
            }
        });
    }
    return storeWithInventory;
}

/**
 * create the stores results html
 * @param {Array} storesInfo - an array of objects that contains store information
 * * @param {object} createStoresResultsHtml - customer store info
 * @returns {string} The rendered HTML
 */
function createStoresResultsHtml(storesInfo , customerStoreDetails) {
    var HashMap = require('dw/util/HashMap');
    var Template = require('dw/util/Template');

    var context = new HashMap();
    var object = { stores: { stores: storesInfo} };
    
    if(customerStoreDetails) {
        object.stores.isAuthenticated = customerStoreDetails.isAuthenticated;
        object.stores.favouriteStore = customerStoreDetails.favouriteStore ? customerStoreDetails.favouriteStore : null;
    }

    Object.keys(object).forEach(function (key) {
        context.put(key, object[key]);
    });

    var template = new Template('storeLocator/storeLocatorResults');
    return template.render(context).text;
}

module.exports = exports = {
    createStoresResultsHtml: createStoresResultsHtml,
    getStores: getStores,
    getStoresInventoryForProduct: getStoresInventoryForProduct,
    storeHours: storeHours
};
