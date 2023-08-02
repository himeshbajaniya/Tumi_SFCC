'use strict';
/**
* @description The script for retrieving and storing Emarsys external events
* @output ErrorMsg : String
*/
var Status = require('dw/system/Status');

var externalEvent = {
    emarsysHelper: new (require('int_emarsys/cartridge/scripts/helpers/emarsysHelper'))(),
    eventsHelper: require('int_emarsys/cartridge/scripts/helpers/emarsysEventsHelper'),
    logger: require('dw/system/Logger').getLogger('externalEvent', 'externalEvent'),
    execute: function (params) {
        try {
            var customObjectKey = params.customObjectKey || 'StoredEvents';
            var custom = {};

            // read specified fields from custom object EmarsysExternalEvents
            custom = this.emarsysHelper.readEventsCustomObject(customObjectKey, [
                'newsletterSubscriptionSource',
                'otherSource',
                'campaignsCategory'
            ]);

            var subscriptionNames = this.filterDuplications(custom.fields.newsletterSubscriptionSource);
            var otherNames = this.filterDuplications(custom.fields.otherSource);
            this.campaignsCategory = custom.fields.campaignsCategory;

            this.eventsDescriptionList = this.getEventsDescription();
            this.campaignsData = this.getCampaignsData();

            /* Commenting below 2 line of code, as it creates new events in Emarsys with New Template ID which is not required.
            As per our Approach, Emarsys will have their predefined events at their end with a template ID. We will use that only. */

            // custom.object.custom.newsletterSubscriptionResult = this.createEvents(subscriptionNames);
            // custom.object.custom.otherResult = this.createEvents(otherNames);

            // instead of creating new events, we will just fetch those events which is already present in Emarsys. A new function fetchEventDetailsFromEmarsys() created to fetch event details.
            custom.object.custom.newsletterSubscriptionResult = this.fetchEventDetailsFromEmarsys(subscriptionNames);
            custom.object.custom.otherResult = this.fetchEventDetailsFromEmarsys(otherNames);
        } catch (err) {
            this.logger.error('[Emarsys CreateExternalEvents.js] - ' + err.message + '\n' + err.stack);
            return new Status(Status.ERROR, 'ERROR');
        }

        this.logger.info('externalEvent: All events were succesfully created');
        return new Status(Status.OK, 'OK');
    },
    /**
     * Filter names duplications
     * @param {Array} list - sfcc events names list
     * @return {Array} - list of names without duplications
     */
    filterDuplications: function (list) {
        var valuesCollection = this.emarsysHelper.getValuesCollection(list);
        var valuesList = Object.keys(valuesCollection);
        return valuesList;
    },
    /**
     * @description get description of all Emarsys external events
     * @return {Array} list of objects with external events description
     */
    getEventsDescription: function () {
        // get events description list
        var response = this.eventsHelper.makeCallToEmarsys('event', null, 'GET');
        if (response.status === 'ERROR') {
            throw new Error('***Emarsys get events error: ' + response.message);
        }
        return response.result.data;
    },
    /**
     * @description get description of all Emarsys email campaigns
     * @return {Object} campaigns descriptions collection (by campaign name)
     */
    getCampaignsData: function () {
        // get campaigns
        var responseObj = this.eventsHelper.makeCallToEmarsys('email', null, 'GET');
        if (responseObj.status === 'ERROR') {
            throw new Error('***Emarsys get campaigns error: ' + responseObj.message);
        }
        return this.eventsHelper.prepareCampaignData(responseObj.result.data);
    },
    /**
     * Create events and prepare their description
     * @param {Array} namesList - list of event names
     * @return {string} - created events description
     */
    createEvents: function (namesList) {
        var descriptionsList = namesList.map(function (eventName) {
            var formattedName = this.eventsHelper.eventNameFormatter(eventName);
            var emarsysDescription = this.queryEventDescription(formattedName);
            if (!emarsysDescription) {
                emarsysDescription = this.createExternalEvent(formattedName);
            }
            var eventDescription = {
                sfccName: eventName,
                emarsysId: emarsysDescription.id,
                emarsysName: emarsysDescription.name
            };
            eventDescription.campaignId = this.getCampaignId(eventDescription);
            return eventDescription;
        }, this);

        return JSON.stringify(descriptionsList);
    },
    /**
     * @description get description for external event with specified name
     * @param {string} eventName - the name of the event
     * @return {Object} event description
     */
    queryEventDescription: function (eventName) {
        var results = this.eventsDescriptionList.filter(function (eventDescription) {
            return eventDescription.name === this.eventName;
        }, { eventName: eventName });

        return results[0];
    },
    /**
     * @description creates Emarsys external event
     * @param {string} eventName - the name of the event which should be created on emarsys
     * @return {Object} created event description
     */
    createExternalEvent: function (eventName) {
        var eventDescription = {};

        // send request to create event with specified name
        var response = this.eventsHelper.makeCallToEmarsys('event', { name: eventName }, 'POST');
        if (response.status === 'ERROR') {
            throw new Error('***Emarsys create event error: ' + response.message);
        }
        eventDescription = response.result.data;
        this.eventsDescriptionList.push(eventDescription);

        return eventDescription;
    },
    /**
     * Fetch events and prepare their description
     * @param {Array} namesList - list of event names
     * @return {string} - created events description
     */
    fetchEventDetailsFromEmarsys: function (namesList) {
        var descriptionsList = [];
        namesList.map(function (eventName) {
            var emarsysDescription = this.queryEventDescription(eventName);
            if (emarsysDescription)  {
                var eventDescription = {
                        sfccName: eventName,
                        emarsysId: emarsysDescription.id,
                        emarsysName: emarsysDescription.name
                    };
                    eventDescription.campaignId = this.getCampaignId(eventDescription);
                    descriptionsList.push(eventDescription);
            }
        }, this);

        return JSON.stringify(descriptionsList);
    },
    /**
     * @description creates test campaign for Emarsys external event
     * @param {string} event - the name of the event which should be created on emarsys
     * @return {Object} created event description
     */
    getCampaignId: function (event) {
        var campaignId = '';

        var campaignName = 'test_event_' + event.emarsysId;
        campaignId = this.campaignsData[campaignName] && this.campaignsData[campaignName].id;

        if (!campaignId) {
            // send request to create test campaign
            var response = this.eventsHelper.createTestCampaign(event, this.campaignsCategory);
            if (response.status === 'ERROR') {
                throw new Error('***Emarsys create campaign error: ' + response.message);
            }
            this.campaignsData[campaignName] = response.result.data;
            campaignId = response.result.data.id;
        }
        return campaignId;
    }
};

exports.execute = externalEvent.execute.bind(externalEvent);
