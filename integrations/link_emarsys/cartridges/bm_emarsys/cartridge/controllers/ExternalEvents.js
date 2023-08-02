'use strict';

var server = require('server');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var eventsHelper = require('*/cartridge/scripts/helpers/emarsysEventsHelper');
var emarsysHelper = new (require('*/cartridge/scripts/helpers/emarsysHelper'))();
var supportedEventsData = require('*/cartridge/config/supportedEventsData');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.get('Show',
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var customObjectKey = 'StoredEvents';
        var custom = {};
        var responseObj = {};
        var subscription = {};
        var other = {};

        // read specified fields from custom object EmarsysExternalEvents
        try {
            custom = emarsysHelper.readEventsCustomObject(customObjectKey, [
                'newsletterSubscriptionSource',
                'otherSource',
                'newsletterSubscriptionResult',
                'otherResult'
            ]);
        } catch (err) {
            res.render('components/errorPage', {
                message: 'Configuration error:',
                error: err
            });
            return next();
        }
        subscription.sfccNamesList = custom.fields.newsletterSubscriptionSource;
        subscription.eventsMapping = custom.fields.newsletterSubscriptionResult;
        other.sfccNamesList = custom.fields.otherSource;
        other.eventsMapping = custom.fields.otherResult;

        // separate not mapped sfcc events (options for new event name)
        subscription.notMappedEvents = eventsHelper.getNotMappedEvents(
            subscription.sfccNamesList,
            subscription.eventsMapping
        );
        other.notMappedEvents = eventsHelper.getNotMappedEvents(
            other.sfccNamesList,
            other.eventsMapping
        );

        // get all external events description from Emarsys
        responseObj = eventsHelper.makeCallToEmarsys('event', null, 'GET');
        if (responseObj.status === 'ERROR') {
            res.render('components/errorPage', {
                message: Resource.msg('emarsys.request.message', 'errorMessages', null),
                error: new Error(responseObj.message),
                continueUrl: URLUtils.url(
                    'ExternalEvents-Show',
                    'CurrentMenuItemId', 'emarsys_integration',
                    'menuname', 'External Events',
                    'mainmenuname', 'Emarsys Manager'
                ).toString()
            });
            return next();
        }
        var allEmarsysEvents = responseObj.result.data;

        // get Emarsys events descriptions collection (to render emarsys names options)
        subscription.emarsysDescriptions = eventsHelper.getExistentEventsData(
            allEmarsysEvents,
            subscription.sfccNamesList
        );
        other.emarsysDescriptions = eventsHelper.getExistentEventsData(
            allEmarsysEvents,
            other.sfccNamesList
        );

        // get data about all Emarsys test campaigns
        responseObj = eventsHelper.makeCallToEmarsys('email', null, 'GET');
        if (responseObj.status === 'ERROR') {
            responseObj.message = Resource.msg('emarsys.error', 'errorMessages', null) + responseObj.message;
            res.json({ response: responseObj });
            return next();
        }
        var campaignsData = eventsHelper.prepareCampaignData(responseObj.result.data);

        // separate events related campaigns data
        subscription.campaigns = eventsHelper.getEventsRelatedData(
            campaignsData,
            subscription.emarsysDescriptions
        );
        other.campaigns = eventsHelper.getEventsRelatedData(
            campaignsData,
            other.emarsysDescriptions
        );

        subscription.requestBodyExamples = supportedEventsData.requestBodyExamples.subscription;
        other.requestBodyExamples = supportedEventsData.requestBodyExamples.other;

        subscription.formsDescriptions = supportedEventsData.formsDescriptions.subscription;
        other.formsDescriptions = supportedEventsData.formsDescriptions.other;

        res.render('eventsPage', {
            contentTemplate: 'external.events.configurations',
            urls: {
                show: URLUtils.url('ExternalEvents-Show').toString(),
                addEvent: URLUtils.url('ExternalEvents-Add').toString(),
                updateEvent: URLUtils.url('ExternalEvents-Update').toString(),
                triggerEvent: URLUtils.url('ExternalEvents-Trigger').toString(),
                campaignStatus: URLUtils.url('ExternalEvents-CampaignStatus').toString()
            },
            response: {
                status: 'OK',
                other: other,
                subscription: subscription
            }
        });

        return next();
    }
);

/**
 * @description Add new Emarsys external event (does not support none mapping option)
 */
server.post('Add',
    server.middleware.https,
    function (req, res, next) {
        var event = {
            type: request.httpParameterMap.type.value,
            emarsysId: request.httpParameterMap.emarsysId.value || '',
            emarsysName: request.httpParameterMap.emarsysName.value || '',
            sfccName: request.httpParameterMap.sfccName.value,
            campaignId: request.httpParameterMap.campaignId.value || '',
            campaignStatus: request.httpParameterMap.campaignStatus.value
        };
        var customObjectKey = 'StoredEvents';
        var custom = {};
        var responseObj = {};

        // read events descriptions list from custom object
        var fieldId = (event.type === 'subscription') ? 'newsletterSubscriptionResult' : 'otherResult';
        try {
            custom = emarsysHelper.readEventsCustomObject(customObjectKey, [fieldId, 'campaignsCategory']);
        } catch (err) {
            res.render('components/events/addEvent', {
                response: {
                    status: 'ERROR',
                    message: err.errorText
                }
            });
            return next();
        }

        var eventsDescriptionList = custom.fields[fieldId];
        if (empty(event.emarsysName) || empty(event.emarsysId)) {
            event.emarsysStatus = 'new';

            // send request to create event with specified name
            responseObj = eventsHelper.makeCallToEmarsys('event', { name: event.emarsysName }, 'POST');
            if (responseObj.status === 'ERROR') {
                responseObj.message = Resource.msg('emarsys.error', 'errorMessages', null) + responseObj.message;
                res.render('components/events/addEvent', { response: responseObj });
                return next();
            }
            event.emarsysId = responseObj.result.data.id;
            event.emarsysName = responseObj.result.data.name;
        } else {
            event.emarsysStatus = 'specified';
        }

        // create campaign if it doesn't exist
        if (empty(event.campaignId)) {
            responseObj = eventsHelper.createTestCampaign(event, custom.fields.campaignsCategory);
            if (responseObj.status === 'ERROR') {
                responseObj.message = Resource.msg('emarsys.error', 'errorMessages', null) + responseObj.message;
                res.render('components/events/addEvent', { response: responseObj });
                return next();
            }
            event.campaignId = responseObj.result.data.id;
        }

        // get data about campaign, related to the event
        responseObj = eventsHelper.makeCallToEmarsys('email/' + event.campaignId, null, 'GET');
        if (responseObj.status === 'ERROR') {
            responseObj.message = Resource.msg('emarsys.error', 'errorMessages', null) + responseObj.message;
            res.render('components/events/addEvent', { response: responseObj });
            return next();
        }
        var campaignData = eventsHelper.prepareCampaignData([responseObj.result.data]);
        campaignData[event.emarsysId] = campaignData['test_event_' + event.emarsysId];

        // prepare description object for the event
        var descriptionObject = {
            sfccName: event.sfccName,
            emarsysId: event.emarsysId,
            emarsysName: event.emarsysName,
            campaignId: event.campaignId
        };

        // get event description index (to prevent names duplication)
        event.descriptionIndex = eventsHelper.findObjectInList(eventsDescriptionList, 'sfccName', event.sfccName).index;

        // add or update external event description
        if (event.descriptionIndex) {
            eventsDescriptionList.splice(event.descriptionIndex, 1, descriptionObject);
        } else {
            eventsDescriptionList.push(descriptionObject);
        }

        // store events description list to custom object field
        Transaction.wrap(function () {
            custom.object.custom[fieldId] = JSON.stringify(eventsDescriptionList);
        });

        var formsDescription = eventsHelper.findObjectInList(
            supportedEventsData.formsDescriptions[event.type],
            'emarsysEventName',
            event.emarsysName
        ).object;
        var requestBodyExample = supportedEventsData.requestBodyExamples[event.type][event.emarsysName];

        res.render('components/events/addEvent', {
            response: {
                event: event,
                eventType: event.type,
                campaigns: campaignData,
                formsDescriptions: formsDescription ? [formsDescription] : null,
                requestBodyExample: requestBodyExample || null
            }
        });
        return next();
    }
);

/**
 * @description Update new Emarsys external event
 */
server.post('Update',
    server.middleware.https,
    function (req, res, next) {
        var event = {
            type: request.httpParameterMap.type.value,
            sfccName: request.httpParameterMap.sfccName.value,
            emarsysId: request.httpParameterMap.emarsysId.value || '',
            emarsysName: request.httpParameterMap.emarsysName.value || '',
            campaignId: request.httpParameterMap.campaignId.value || '',
            campaignStatus: request.httpParameterMap.campaignStatus.value
        };
        var customObjectKey = 'StoredEvents';
        var custom = {};
        var responseObj = {};
        var campaignData = null;

        // read events descriptions list from custom object
        var fieldId = (event.type === 'subscription') ? 'newsletterSubscriptionResult' : 'otherResult';
        try {
            custom = emarsysHelper.readEventsCustomObject(customObjectKey, [fieldId, 'campaignsCategory']);
        } catch (err) {
            res.json({
                response: {
                    status: 'ERROR',
                    message: err.errorText
                }
            });
            return next();
        }
        var eventsDescriptionList = custom.fields[fieldId];

        if (!empty(event.emarsysName)) {   // do not do this for "none" mapping
            if (empty(event.emarsysId)) {
                event.emarsysStatus = 'new';

                // send request to create event with specified name
                responseObj = eventsHelper.makeCallToEmarsys('event', { name: event.emarsysName }, 'POST');
                if (responseObj.status === 'ERROR') {
                    responseObj.message = Resource.msg('emarsys.error', 'errorMessages', null) + responseObj.message;
                    res.json({ response: responseObj });
                    return next();
                }
                event.emarsysId = responseObj.result.data.id;
                event.emarsysName = responseObj.result.data.name;
            } else {
                event.emarsysStatus = 'specified';
            }

            // create campaign if it doesn't exist
            if (empty(event.campaignId)) {
                responseObj = eventsHelper.createTestCampaign(event, custom.fields.campaignsCategory);
                if (responseObj.status === 'ERROR') {
                    responseObj.message = Resource.msg('emarsys.error', 'errorMessages', null) + responseObj.message;
                    res.json({ response: responseObj });
                    return next();
                }
                event.campaignId = responseObj.result.data.id;
            }

            // get data about campaign, related to the event
            responseObj = eventsHelper.makeCallToEmarsys('email/' + event.campaignId, null, 'GET');
            if (responseObj.status === 'ERROR') {
                responseObj.message = Resource.msg('emarsys.error', 'errorMessages', null) + responseObj.message;
                res.json({ response: responseObj });
                return next();
            }
            campaignData = eventsHelper.prepareCampaignData([responseObj.result.data]);
            campaignData[event.emarsysId] = campaignData['test_event_' + event.emarsysId];
        }

        // get event description index
        event.descriptionIndex = eventsHelper.findObjectInList(
            eventsDescriptionList,
            'sfccName',
            event.sfccName
        ).index || eventsDescriptionList.length;

        // prepare description object for the event
        var descriptionObject = {
            sfccName: event.sfccName,
            emarsysId: event.emarsysId,
            emarsysName: event.emarsysName,
            campaignId: event.campaignId
        };

        // update external event description in the list
        eventsDescriptionList.splice(event.descriptionIndex, 1, descriptionObject);

        // store events description list to custom object field
        Transaction.wrap(function () {
            custom.object.custom[fieldId] = JSON.stringify(eventsDescriptionList);
        });

        res.json({
            response: {
                status: 'OK',
                result: {
                    event: event,
                    campaigns: campaignData
                }
            }
        });
        return next();
    }
);

/**
 * @description Trigger specified Emarsys external event
 */
server.post('Trigger',
    server.middleware.https,
    csrfProtection.validateRequest,
    function (req, res, next) {
        var event = {
            type: request.httpParameterMap.type.value,
            sfccName: request.httpParameterMap.sfccName.value,
            emarsysId: request.httpParameterMap.emarsysId.value,
            emarsysName: request.httpParameterMap.emarsysName.value
        };

        if (empty(event.emarsysId)) {
            res.json({
                response: {
                    status: 'Error',
                    message: Resource.msg('server.error', 'errorMessages', null)
                }
            });
            return next();
        }

        var formData = JSON.parse(request.httpParameterMap.formData.value);
        var userEmail = formData.email;

        var source = Site.getCurrent().getCustomPreferenceValue('emarsysSourceID');
        var fields = emarsysHelper.prepareFieldsDescriptions();

        var formDescription = eventsHelper.findObjectInList(
            supportedEventsData.formsDescriptions[event.type],
            'emarsysEventName',
            event.emarsysName
        ).object;
        var fieldsData = formDescription && formDescription.fieldsData;

        if (empty(fieldsData)) {
            res.json({
                response: {
                    status: 'Error',
                    message: Resource.msg('server.error', 'errorMessages', null)
                }
            });
            return next();
        }

        var responseObj = {};
        var updateContactBody = {
            source_id: source,   // '89648'
            key_id: fields.email.id   // 3
        };
        updateContactBody[fields.email.id] = userEmail;
        updateContactBody[fields.do_not_track_me.id] = fields.do_not_track_me.options.on;

        // send request to create contact or update contact data
        responseObj = eventsHelper.makeCallToEmarsys('contact/?create_if_not_exists=1', updateContactBody, 'PUT');
        if (responseObj.status === 'ERROR') {
            responseObj.message = Resource.msg('emarsys.error', 'errorMessages', null) + responseObj.message;
            res.json({ response: responseObj });
            return next();
        }

        var triggerUrl = 'event/' + event.emarsysId + '/trigger';
        var triggerBody = eventsHelper.composeObject({        /* data from the trigger event dialog form */
            dataObject: formData,
            placeholdersMapping: fieldsData
        });
        triggerBody.key_id = fields.email.id;   // 3
        triggerBody.external_id = userEmail;
        triggerBody.source_id = source;   // '89648'

        // send request to trigger event with specified id
        responseObj = eventsHelper.makeCallToEmarsys(triggerUrl, triggerBody, 'POST');
        if (responseObj.status === 'ERROR') {
            responseObj.message = Resource.msg('emarsys.error', 'errorMessages', null) + responseObj.message;
            res.json({ response: responseObj });
            return next();
        }

        res.json({
            response: {
                status: 'OK'
            }
        });
        return next();
    }
);

server.post('CampaignStatus',
    server.middleware.https,
    function (req, res, next) {
        var eventType = request.httpParameterMap.type.value;
        var emarsysDescriptions = JSON.parse(request.httpParameterMap.descriptions.value);
        var responseObj = {};

        // send request to get status of all campaigns from Emarsys
        responseObj = eventsHelper.makeCallToEmarsys('email', null, 'GET');
        if (responseObj.status === 'ERROR') {
            responseObj.message = Resource.msg('emarsys.error', 'errorMessages', null) + responseObj.message;
            res.json({ response: responseObj });
            return next();
        }
        var campaignsData = eventsHelper.prepareCampaignData(responseObj.result.data);

        // separate events related campaigns data
        var campaignsCollection = eventsHelper.getEventsRelatedData(
            campaignsData,
            emarsysDescriptions
        );

        res.json({
            response: {
                status: 'OK',
                campaigns: campaignsCollection,
                eventType: eventType
            }
        });

        return next();
    }
);

module.exports = server.exports();
