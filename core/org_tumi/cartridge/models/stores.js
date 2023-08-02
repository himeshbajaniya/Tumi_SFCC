'use strict';

var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
var StoreModel = require('*/cartridge/models/store');

/**
 * Creates an array of objects containing store information
 * @param {dw.util.Set} storesObject - a set of <dw.catalog.Store> objects
 * @returns {Array} an array of objects that contains store information
 */
function createStoresObject(storesObject) {
    return Object.keys(storesObject).map(function (key) {
        var store = storesObject[key];
        if (store) {
            var storeModel = new StoreModel(store.key, store.value);
            return storeModel;
        }
    });
}

/**
 * Creates an array of objects containing the coordinates of the store's returned by the search
 * @param {dw.util.Set} storesObject - a set of <dw.catalog.Store> objects
 * @returns {Array} an array of coordinates objects with store info
 */
function createGeoLocationObject(storesObject) {
    var context;
    var template = 'storeLocator/storeInfoWindow';
    return Object.keys(storesObject).map(function (key) {
        var store = storesObject[key];
        var storeModel = new StoreModel(store.key, store.value);
        context = { store: storeModel };
        return {
            name: storeModel.name,
            latitude: storeModel.latitude,
            longitude: storeModel.longitude,
            infoWindowHtml: renderTemplateHelper.getRenderedHtml(context, template),
            storeType : storeModel.storeType
        };
    });
}

/**  
 * If there is an api key creates the url to include the google maps api else returns null
 * @param {string} apiKey - the api key or null
 * @returns {string|Null} return the api
 */
function getGoogleMapsApi(apiKey) {
    var googleMapsApi;
    if (apiKey) {
        googleMapsApi = 'https://maps.googleapis.com/maps/api/js?key=' + apiKey +'&sensor=false';
    } else {
        googleMapsApi = null;
    }

    return googleMapsApi;
}

/**
 * Adding the store inventory list to an existing list of current stores.
 * @param {Array} currentStores - an array of objects that contains store information
 * @param {dw.util.Set} apiStores - a set of <dw.catalog.Store> objects
 * @returns {currentStores} an array of objects that contains store information
 */
 function addInventroyList(currentStores, apiStores) {
    Object.keys(apiStores).forEach(function (index) {
        var apiStore = apiStores[index].key;
        currentStores.forEach(function (store) {
            if (apiStore.ID === store.ID) {
                if (apiStore.inventoryListID ||
                    (apiStore.custom && apiStore.custom.inventoryListId)) {
                    store.inventoryListId = apiStore.inventoryListID ||   // eslint-disable-line
                                            apiStore.custom.inventoryListId;
                }
            }
        });
    });
    return currentStores;
}

/**
 * Searches for stores and check for the inventory for given product
 * @param {object} stores store object
 */
function orderStoreByType(stores) {
    var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
    var outletStore = [];
    var dealerStore = [];
    stores = stores.filter(function (store) {
        store.storetiming = storeHelpers.storeHours(store.storeHours);
        if(!store.storeType) {
            store.storeType = 'dealer';
        }
        switch (store.storeType.toLowerCase()) {
            case 'outlet':
                outletStore.push(store);
                break;
            case 'dealer':
                dealerStore.push(store)
                break;
            case 'retail':
                return true;
                break;
        }
    });
    if(outletStore.length > 0) {
        for ( var i in outletStore ) {
            stores.push(outletStore[i]);
        }
    }
    if(dealerStore.length > 0) {
        for ( var i in dealerStore ) {
            stores.push(dealerStore[i]);
        }
    }

    return stores;
}

/**
 * @constructor
 * @classdesc The stores model
 * @param {dw.util.Set} storesResultsObject - a set of <dw.catalog.Store> objects
 * @param {Object} searchKey - what the user searched by (location or postal code)
 * @param {number} searchRadius - the radius used in the search
 * @param {dw.web.URL} actionUrl - a relative url
 * @param {string} apiKey - the google maps api key that is set in site preferences
 */
function stores(storesResultsObject, searchKey, searchRadius, actionUrl, apiKey, customerStoreDetails) {
    this.stores = createStoresObject(storesResultsObject);
    this.stores = addInventroyList(this.stores, storesResultsObject);
    this.stores = orderStoreByType(this.stores);
    this.searchKey = searchKey;
    this.radius = searchRadius;
    this.actionUrl = actionUrl;
    this.googleMapsApi = getGoogleMapsApi(apiKey);
    this.storesResultsHtml = this.stores ? storeHelpers.createStoresResultsHtml(this.stores, customerStoreDetails) : null;
    this.locations = JSON.stringify(createGeoLocationObject(storesResultsObject));
}

module.exports = stores;
