'use strict';

var Resource = require('dw/web/Resource');

/**
 * @description Make call to Emarsys
 * @param {string} endpoint - API endpoint to make a call at
 * @param {Object} requestBody - request body (for POST or PUT)
 * @param {string} requestMethod - request method
 * @return {Object} - object with response data
 */
function makeCallToEmarsys(endpoint, requestBody, requestMethod) {
    var emarsysService = require('int_emarsys/cartridge/scripts/service/emarsysService');
    var responseBody = {};
    var resultObj = {};

    var response = emarsysService.call(endpoint, requestBody, requestMethod);
    if (empty(response) || response.status === 'ERROR') {
        resultObj = { status: 'ERROR' };
        if (response.errorMessage) {
            try {
                responseBody = JSON.parse(response.errorMessage);
                resultObj.replyCode = responseBody.replyCode;
                resultObj.replyMessage = responseBody.replyText;
                resultObj.message = responseBody.replyText + ' (' +
                    Resource.msg('emarsys.reply.code', 'errorMessages', null) +
                    responseBody.replyCode + ')';
            } catch (err) {
                resultObj.message = Resource.msg('parsing.error', 'errorMessages', null);
            }
        } else {
            resultObj.responseCode = response.error;
            resultObj.responseMessage = response.msg;
            resultObj.message = response.msg + ' (' +
                Resource.msg('emarsys.response.code', 'errorMessages', null) +
                response.error + ')';
        }
        return resultObj;
    }
    try {
        return {
            status: 'OK',
            result: JSON.parse(response.object)
        };
    } catch (err) {
        return {
            status: 'ERROR',
            message: Resource.msg('parsing.error', 'errorMessages', null)
        };
    }
}

/**
 * Event name formatter for Emarsys side
 * @param {string} sfccName - BM side event name
 * @return {string} - Emarsys side event name
 */
function eventNameFormatter(sfccName) {
    var formattedName = '';
    formattedName = sfccName.replace(/[-\s]+/g, '_');
    formattedName = formattedName.replace(/([a-z])([A-Z])/g, '$1_$2');
    return 'SFCC_' + formattedName.toUpperCase();
}

/**
 * Gets list of not mapped sfcc events
 * @param {Array} namesList - sfcc event names list
 * @param {Array} descriptionsList - mapped sfcc events descriptions
 * @return {Array} - not mapped events list
 */
function getNotMappedEvents(namesList, descriptionsList) {
    var notMappedEvents = namesList.filter(function (sfccName) {
        return this.every(function (eventObject) {
            return eventObject.sfccName !== this.sfccName;
        }, { sfccName: sfccName });
    }, descriptionsList);

    return notMappedEvents;
}

/**
 * Create descriptions collection for used Emarsys events
 * @param {Array} allEmarsysEvents - description list from Emarsys
 * @param {Array} sfccNames - sfcc event names list
 * @return {Array} - all allowed Emarsys events descriptions
 */
function getExistentEventsData(allEmarsysEvents, sfccNames) {
    var allowedEmarsysDescriptions = sfccNames.map(function (sfccName) {
        var event = {
            emarsysId: '',
            emarsysName: eventNameFormatter(sfccName)
        };

        this.allEmarsysEvents.some(function (descriptionObj) {
            var isAppropriate = this.event.emarsysName === descriptionObj.name;
            if (isAppropriate) {
                this.event.emarsysId = descriptionObj.id;
            }
            return isAppropriate;
        }, { event: event });

        return event;
    }, {
        allEmarsysEvents: allEmarsysEvents
    });

    return allowedEmarsysDescriptions;
}

/**
 * Set data into the object according to the fields mapping
 * @param {Object} args - object with function arguments
 * @return {Object} - created object
 */
function composeObject(args) {
    var data = args.dataObject;               // {Array} object with data to set according to passed mapping
    var mapping = args.placeholdersMapping;   // {Array} array with data fields mapping
    var baseObject = args.baseObject;         // {Object} object with initial data (optional)
    var assign = args.assignFunc;             // {Function} function to make a copy of baseObject
    var mappingKeys = {                       // fields mapping properties
        name: args.fieldKey || 'field',
        placeholder: args.placeholderKey || 'placeholder'
    };

    var finalObj = {};
    if (!mapping || !mapping.length) {
        return baseObject;
    }
    if (baseObject != null && assign != null) {
        finalObj = assign({}, baseObject);
    }
    mapping.forEach(function (fieldObj) {
        var fieldName = fieldObj[this.nameKey];
        var fieldPlaceholder = fieldObj[this.placeholderKey];
        var pathList = fieldPlaceholder.replace(/(\[\d+\])/g, '.$1.').split(/\./);
        var currPosition = this.finalObj;
        var isArray = false;
        var key = '';

        // prepare structure for target property
        for (var i = 1; i < pathList.length; i++) {
            isArray = /^\[\d+\]$/.test(pathList[i - 1]);
            key = isArray ? pathList[i - 1].match(/\d+/)[0] : pathList[i - 1];

            if (currPosition[key] == null || typeof currPosition[key] !== 'object') {
                isArray = /^\[\d+\]$/.test(pathList[i]);
                currPosition[key] = isArray ? [] : {};
            }

            currPosition = currPosition[key];
        }

        // set value to the target property
        var lastIndex = pathList.length - 1;
        isArray = /^\[\d+\]$/.test(pathList[lastIndex]);
        key = isArray ? pathList[lastIndex].match(/\d+/)[0] : pathList[lastIndex];

        currPosition[key] = this.data[fieldName];
    }, {
        finalObj: finalObj,
        data: data,
        nameKey: mappingKeys.name,
        placeholderKey: mappingKeys.placeholder
    });
    return finalObj;
}

/**
 * Create email campaign to test external event
 * @param {Object} event - external event description object
 * @param {string} campaignsCategory - test campaign category identifier
 * @return {Object} - emarsys respond object
 */
function createTestCampaign(event, campaignsCategory) {
    var createCampaignBody = {
        name: 'test_event_' + event.emarsysId,
        language: 'en',
        fromemail: 'testing@emarsys.com',
        fromname: 'emarsys',
        subject: 'external events testing',
        email_category: campaignsCategory,
        external_event_id: event.emarsysId,
        text_source: 'Event ' + event.emarsysName + ' was triggered successfully'
    };
    // send request to create campaign
    return makeCallToEmarsys('email', createCampaignBody, 'POST');
}

/**
 * Separate useful data of all Emarsys campaigns
 * @param {Array} campaignsList - array with Emarsys campaigns descriptions
 * @return {Object} - campaigns data
 */
function prepareCampaignData(campaignsList) {
    var campaignsData = {};
    campaignsList.forEach(function (campaign) {
        var campaignData = {
            id: campaign.id,
            name: campaign.name
        };
        switch (campaign.status) {
            case '1':
                campaignData.status = 'In design';
                break;
            case '2':
                campaignData.status = 'Tested';
                break;
            case '3':
                campaignData.status = 'Launched';
                break;
            case '4':
                campaignData.status = 'Ready to launch';
                break;
            case '-3':
                campaignData.status = 'Deactivated';
                break;
            case '-6':
                campaignData.status = 'Aborted';
                break;
            default:
                campaignData.status = 'Invalid';
        }
        this.campaignsData[campaign.name] = campaignData;
    }, { campaignsData: campaignsData });
    return campaignsData;
}

/**
 * Separate events related campaigns data
 * @param {Object} campaignsData - all Emarsys campaigns data
 * @param {Array} emarsysDescriptions - allowed Emarsys events descriptions
 * @return {Object} - events related campaigns data
 */
function getEventsRelatedData(campaignsData, emarsysDescriptions) {
    var separatedCampaigns = {};

    emarsysDescriptions.forEach(function (event) {
        var campaignData = this.campaignsData['test_event_' + event.emarsysId];
        if (event.emarsysId) {
            this.separatedCampaigns[event.emarsysId] = campaignData || { id: '', status: 'not exist' };
        }
    }, {
        campaignsData: campaignsData,
        separatedCampaigns: separatedCampaigns
    });

    return separatedCampaigns;
}

/**
 * Look for the first object with specified key-value pair
 * @param {Array} list - list of objects
 * @param {string} field - key field
 * @param {*} value - any value of simple type
 * @return {Object} - found object data
 */
function findObjectInList(list, field, value) {
    var context = {
        field: field,
        value: value
    };

    context.success = list.some(function (obj, i) {
        var isTarget = obj[this.field] === this.value;
        if (isTarget) {
            this.object = obj;
            this.index = i;
        }
        return isTarget;
    }, context);

    return context;
}

module.exports = {
    makeCallToEmarsys: makeCallToEmarsys,
    getNotMappedEvents: getNotMappedEvents,
    getExistentEventsData: getExistentEventsData,
    eventNameFormatter: eventNameFormatter,
    composeObject: composeObject,
    createTestCampaign: createTestCampaign,
    prepareCampaignData: prepareCampaignData,
    getEventsRelatedData: getEventsRelatedData,
    findObjectInList: findObjectInList
};
