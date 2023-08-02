'use strict';

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var emarsysHelper = new (require('int_emarsys/cartridge/scripts/helpers/emarsysHelper'))();
var currentSite = require('dw/system/Site').getCurrent();

/**
 * @description constructor, main function
 */
function BMEmarsysHelper() {
    /**
     * @param {string} type it is type custom object
     * @returns {array} array with custom objects
     */
    this.getAllCustomObjectByType = function (type) {
        return CustomObjectMgr.getAllCustomObjects(type).asList().toArray();
    };

    /**
     * Get result field of EmarsysExternalEvents custom object
     * @param {string} customObjectKey - custom object key
     * @param {string} resultField - key of result field to read
     * @param {boolean} isRequired - is this data required for page rendering
     * @return {Array} - list of events descriptions
     */
    this.getExternalEvents = function (customObjectKey, resultField, isRequired) {
        var eventsData = emarsysHelper.readEventsCustomObject(customObjectKey, [resultField]).fields[resultField];
        if (eventsData && eventsData.length) {
            return eventsData.map(function (event) {
                return {
                    id: event.emarsysId,
                    name: event.sfccName
                };
            });
        } else if (isRequired) {
            throw new Error('Invalid field "' + resultField + '" of EmarsysExternalEvents custom object');
        }
        return null;
    };

    /**
     * Get site custom preference, parse the string and return result
     * @param {string} name - preference name
     * @return {Array} - custom preference copy
     */
    this.parseCustomPrefValue = function (name) {
        var preference = currentSite.getCustomPreferenceValue(name);

        try {
            return JSON.parse(preference);
        } catch (err) {
            throw new Error('Invalid value of site custom preference "' + name + '"');
        }
    };

    /**
     * Get site custom preference and return copy of it
     * @param {string} name - preference name
     * @return {Array} - custom preference copy
     */
    this.copyCustomPrefValue = function (name) {
        var preference = currentSite.getCustomPreferenceValue(name);

        try {
            return Array.prototype.slice.call(preference);
        } catch (err) {
            throw new Error('Invalid value of site custom preference "' + name + '"');
        }
    };

    /**
     * @description create current objec for nav-tab menu
     * @param {string} objectType - type custom object
     * @param {string} namePropertyKey - name property in custom object
     * @param {boolean} isLabel - if property use for label in options, isLabel true
     * @returns {Object} new object for nav-tab
     */
    this.getTabsAttr = function (objectType, namePropertyKey, isLabel) {
        var customObjects = this.getAllCustomObjectByType(objectType);

        return customObjects.map(function (customObj) {
            var objectData = {
                id: customObj.custom[namePropertyKey]
            };
            if (isLabel) {
                objectData.label = objectData.id[0].toUpperCase() + objectData.id.slice(1);
            }
            return objectData;
        });
    };

    /**
     * Get data from all custom objects of specified type
     * @param {string} type - custom object type
     * @return {Array} - list of data from read custom objects
     */
    this.getStoredConfigurations = function (type) {
        var customObjects = this.getAllCustomObjectByType(type);

        if (customObjects && customObjects.length) {
            return customObjects.map(function (customObj) {
                return customObj.custom;
            });
        }
        throw new Error('There are no custom objects of type ' + type);
    };

    /**
     * Gets data from custom object fields
     * @param {Object} args - custom object details
     * @return {Object} - collected data
     */
    this.parseCustomObjects = function (args) {
        var objectType = args.objectType;              // {string} custom object type
        var objectKey = args.objectKey;                // {string} custom object key
        var contentKey = args.contentFieldKey;         // {string} key of custom object content field
        var additionalKey = args.additionalFieldKey;   // {string} key of custom object additional field

        // get custom objects
        var customObjects = [];
        if (objectKey) {
            customObjects.push(CustomObjectMgr.getCustomObject(objectType, objectKey));
        } else {
            customObjects = this.getAllCustomObjectByType(objectType);
        }
        if (empty(customObjects[0])) {
            throw new Error('Custom object ' + objectType + ' with id "' + objectKey + '" does not exist');
        }

        // prepare objects data
        return customObjects.map(function (customObj) {
            var objectData = {
                contentID: customObj.custom[contentKey],
                additionalParam: additionalKey ? customObj.custom[additionalKey] : false
            };

            try {
                objectData.mappedFields = JSON.parse(customObj.custom.mappedFields);
                objectData.fieldsLength = objectData.mappedFields ? objectData.mappedFields.length : 0;
            } catch (err) {
                throw new Error('Invalid field "mappedFields" of custom object ' + objectType);
            }

            return objectData;
        });
    };
}

module.exports = new BMEmarsysHelper();
