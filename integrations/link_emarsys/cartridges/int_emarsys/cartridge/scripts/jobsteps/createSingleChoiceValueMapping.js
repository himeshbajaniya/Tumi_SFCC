'use strict';
/**
* Create Single Choice Value Mapping
*/
var currentSite = require('dw/system/Site').getCurrent();
var Status = require('dw/system/Status');

var choiceValueMap = {
    /** @type {dw.system.Log} */
    logger: require('dw/system/Logger').getLogger('choiceValueMap', 'choiceValueMap'),
    /**
     * @description start CreateSingleChoiceValueMapping
     * @returns {dw.system.Status} - return status 'Ok' or 'Error'
     */
    execute: function () {
        try {
            this.emarsysHelper = new (require('int_emarsys/cartridge/scripts/helpers/emarsysHelper'))();

            this.createSingleChoiceValueMapping();
        } catch (err) {
            this.logger.error('[Emarsys CreateSingleChoiceValueMapping.js] - ***Emarsys choiceValueMap error message: ' + err.message + '\n' + err.stack);

            return new Status(Status.ERROR, 'ERROR');
        }

        return new Status(Status.OK, 'OK');
    },
    /**
     * @description Create Single Choice Value Mapping
     * @returns {void}
     */
    createSingleChoiceValueMapping: function () {
        var fieldMapping = {};
        var availableFields;
        var response = this.emarsysHelper.triggerAPICall('field', {}, 'GET');

        if (response.status === 'OK') {
            availableFields = JSON.parse(response.object);

            Object.keys(availableFields.data).forEach(function (keyField) {
                var field = availableFields.data[keyField];
                if (field.application_type === 'singlechoice' || (field.application_type === 'special' && field.name === 'Opt-In')) {
                    response = this.emarsysHelper.triggerAPICall('field/' + field.id + '/choice', {}, 'GET');
                    if (response.status === 'OK') {
                        var fieldObject = JSON.parse(response.object);
                        var filedChoiceMapping = [];

                        Object.keys(fieldObject.data).forEach(function (keyFieldChoice) {
                            var fieldChoice = fieldObject.data[keyFieldChoice];
                            filedChoiceMapping.push({
                                value: fieldChoice.id,
                                choice: fieldChoice.choice
                            });
                        }, this);

                        fieldMapping[field.id] = filedChoiceMapping;
                    }
                }
            }, this);

            currentSite.setCustomPreferenceValue('emarsysSingleChoiceValueMapping', JSON.stringify(fieldMapping));
        }
    }
};

exports.execute = choiceValueMap.execute.bind(choiceValueMap);
