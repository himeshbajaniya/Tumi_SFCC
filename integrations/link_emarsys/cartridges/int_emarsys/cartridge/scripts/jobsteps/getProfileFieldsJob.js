'use strict';
/**
* @description The script for retrieving and storing profile fields from Emarsys
* @output ErrorMsg : String
*/
var Site = require('dw/system/Site');
var Status = require('dw/system/Status');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');

var ProfileField = {
    /** @type {dw.system.Log} */
    logger: require('dw/system/Logger').getLogger('ProfileField', 'ProfileField'),
    execute: function () {
        try {
            this.emarsysHelper = new (require('int_emarsys/cartridge/scripts/helpers/emarsysHelper'))();

            this.getProfileFields();
        } catch (err) {
            this.logger.error('[Emarsys GetProfileFieldsJob.js] - ***ProfileField error message: ' + err.message + '\n' + err.stack);

            return new Status(Status.ERROR, 'ERROR');
        }

        return new Status(Status.OK, 'OK');
    },
    /**
     * @description retrieves and stores profile fields from Emarsys
     * @returns {void} create custom object
     */
    getProfileFields: function () {
        var language = Site.getCurrent().getCustomPreferenceValue('emarsysGetProfileFieldsLanguage');
        var UniqueObjectKey = 'profileFields';

        var profileFields = this.emarsysHelper.triggerAPICall('field/translate/' + language, null, 'GET');
        if (profileFields.status !== 'OK') {
            return;
        }

        if (!empty(profileFields) && profileFields.status === 'OK') {
            var result = JSON.parse(profileFields.object);

            result = JSON.stringify(result.data);
            var CheckObject = CustomObjectMgr.getCustomObject('EmarsysProfileFields', UniqueObjectKey);

            if (CheckObject !== null) {
                CustomObjectMgr.remove(CheckObject);
            }
            var Store = CustomObjectMgr.createCustomObject('EmarsysProfileFields', UniqueObjectKey);
            Store.custom.result = result;
        }
    }
};

exports.execute = ProfileField.execute.bind(ProfileField);
