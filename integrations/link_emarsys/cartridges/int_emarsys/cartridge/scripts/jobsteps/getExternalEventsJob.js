'use strict';
/**
* @description The script for retrieving and storing Emarsys external events
* @output ErrorMsg : String
*/
var Status = require('dw/system/Status');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');

var externalEvent = {
    logger: require('dw/system/Logger').getLogger('externalEvent', 'externalEvent'),
    execute: function (args) {
        if (args.isDisabled) {
            return new Status(Status.OK, 'OK', 'The step is disabled. Check configuration settings');
        }

        try {
            this.emarsysHelper = new (require('int_emarsys/cartridge/scripts/helpers/emarsysHelper'))();

            this.getExternalEvents();
        } catch (err) {
            this.logger.error('[Emarsys GetExternalEventsJob.js] - ***externalEvent error message: ' + err.message + '\n' + err.stack);

            return new Status(Status.ERROR, 'ERROR');
        }

        return new Status(Status.OK, 'OK');
    },
    /**
     * @description retrieves and stores Emarsys external events
     * @returns {void} create custom object
     */
    getExternalEvents: function () {
        var UniqueObjectKey = 'StoredEvents';
        var externalEvents = this.emarsysHelper.triggerAPICall('event', null, 'GET');

        if (!empty(externalEvents) && externalEvents.status === 'OK') {
            var result = JSON.parse(externalEvents.object);

            result = JSON.stringify(result.data);
            var customObject = CustomObjectMgr.getCustomObject('EmarsysExternalEvents', UniqueObjectKey);

            if (empty(customObject)) {
                customObject = CustomObjectMgr.createCustomObject('EmarsysExternalEvents', UniqueObjectKey);
            }

            customObject.custom.result = result;
            customObject.custom.id = customObject.custom.name = UniqueObjectKey;
        }
    }
};

exports.execute = externalEvent.execute.bind(externalEvent);
