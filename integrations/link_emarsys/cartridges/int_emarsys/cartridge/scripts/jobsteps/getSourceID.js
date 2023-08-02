'use strict';
/**
 * @description to create a source, get its id and store it in custom sute pref
 * @output ErrorMsg : String
 */
var Site = require('dw/system/Site');
var Status = require('dw/system/Status');

var SourceID = {
    /** @type {dw.system.Log} */
    logger: require('dw/system/Logger').getLogger('SourceID', 'SourceID'),
    execute: function () {
        try {
            this.emarsysHelper = new (require('int_emarsys/cartridge/scripts/helpers/emarsysHelper'))();

            var sourceName = Site.getCurrent().getCustomPreferenceValue('emarsysSourceName');
            var createSource;
            var sourceId;
            var request = {
                name: sourceName
            };
            var getAllSources = this.emarsysHelper.triggerAPICall('source', {}, 'GET');

            if (getAllSources.status === 'OK') {
                // if source exists the id will be returned
                sourceId = this.emarsysHelper.getSourceId(getAllSources, sourceName);
            } else {
                this.logger.error('[Emarsys GetSourceID.js - Get resources error:' + getAllSources.error + '] - ***Emarsys error message: ' + getAllSources.errorMessage);
                return new Status(Status.ERROR, 'ERROR');
            }

            if (!sourceId) {
                // create a source
                createSource = this.emarsysHelper.triggerAPICall('source/create', request, 'POST');

                if (createSource.status === 'OK') {
                    // if source exists the id will be returned
                    getAllSources = this.emarsysHelper.triggerAPICall('source', {}, 'GET');

                    if (getAllSources.status === 'OK') {
                        // if source exists the id will be returned
                        sourceId = this.emarsysHelper.getSourceId(getAllSources, sourceName);
                    } else {
                        this.logger.error('[Emarsys GetSourceID.js - Get sources error:' + getAllSources.error + '] - ***Emarsys error message: ' + getAllSources.errorMessage);
                        return new Status(Status.ERROR, 'ERROR');
                    }
                } else {
                    this.logger.error('[Emarsys GetSourceID.js - Create source error:' + getAllSources.error + '] - ***Emarsys error message: ' + getAllSources.errorMessage);
                    return new Status(Status.ERROR, 'ERROR');
                }
            }

            Site.getCurrent().setCustomPreferenceValue('emarsysSourceID', sourceId);
        } catch (err) {
            this.logger.error('[Emarsys GetSourceID.js] - ***Emarsys get source data error message: ' + err.message + '\n' + err.stack);

            return new Status(Status.ERROR, 'ERROR');
        }

        return new Status(Status.OK, 'OK');
    }
};

exports.execute = SourceID.execute.bind(SourceID);
