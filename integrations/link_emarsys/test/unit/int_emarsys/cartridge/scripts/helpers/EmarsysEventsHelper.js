'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var mockPath = '../../../../../mocks/';
var Resource = require(mockPath +'dw/web/Resource');
var CustomObjectMgr = require(mockPath +'dw/object/CustomObjectMgr');
var emarsysService = require(mockPath + 'service/emarsysService');

var cartridgePath = '../../../../../../cartridges/int_emarsys/';

var emarsysEventsHelper = proxyquire(cartridgePath + 'cartridge/scripts/helpers/emarsysEventsHelper.js', {
    'dw/web/Resource': Resource,
    'dw/object/CustomObjectMgr': CustomObjectMgr,
    'int_emarsys/cartridge/scripts/service/emarsysService': emarsysService
});

describe('emarsysEventsHelper Helpers', () => {
    global.empty = function(val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };

    it('Testing method: makeCallToEmarsys #1 (success)', () => {
        var result = emarsysEventsHelper.makeCallToEmarsys('event', null, 'GET');

        assert.deepEqual(result, {
            result: {
                data: [
                    {'id':'12678','name':'SFCC_CANCELLED_ORDER'},
                    {'id':'12601','name':'SFCC_SHARE_A_WISHLIST'},
                    {'id':'12644','name':'SFCC_NEWSLETTER_SUBSCRIPTION_CONFIRMATION'},
                    {'id':'12645','name':'SFCC_NEWSLETTER_SUBSCRIPTION_SUCCESS'},
                    {'id':'5633','name':'single'},
                    {'id':'5634','name':'double'}
                ]
            },
            status: 'OK'
        });
    });
    it('Testing method: makeCallToEmarsys #2 (emarsys error)', () => {
        var result = emarsysEventsHelper.makeCallToEmarsys('validError', null, 'GET');

        assert.deepEqual(result, {
            status: 'ERROR',
            replyCode: 5004,
            replyMessage: 'Event ID: {id} is invalid',
            message: 'Event ID: {id} is invalid' + ' (' +
                Resource.msg('emarsys.reply.code', 'errorMessages', null) +
                5004 + ')'
        });
    });

    it('Testing method: makeCallToEmarsys #3 (unknown error)', () => {
        var result = emarsysEventsHelper.makeCallToEmarsys('unknownError', null, 'GET');

        assert.deepEqual(result, {
            status: 'ERROR',
            responseCode: 400,
            responseMessage: 'Bad request',
            message: 'Bad request' + ' (' +
                Resource.msg('emarsys.response.code', 'errorMessages', null) +
                400 + ')'
        });
    });

    it('Testing method: makeCallToEmarsys #4 (invalid error)', () => {
        var result = emarsysEventsHelper.makeCallToEmarsys('invalidError', null, 'GET');

        assert.deepEqual(result, {
            status: 'ERROR',
            message: Resource.msg('parsing.error', 'errorMessages', null)
        });
    });

    it('Testing method: makeCallToEmarsys #5 (invalid data)', () => {
        var result = emarsysEventsHelper.makeCallToEmarsys('invalidData', null, 'GET');

        assert.deepEqual(result, {
            status: 'ERROR',
            message: Resource.msg('parsing.error', 'errorMessages', null)
        });
    });

   
    it('Testing method: eventNameFormatter', () => {
        var result = emarsysEventsHelper.eventNameFormatter('test');
        assert.equal(result,'SFCC_TEST');
    });

    it('Testing method: getNotMappedEvents', () => {
        var eventsCustomObject = { 
            custom: {
                otherSource: JSON.stringify(['cancelled_order','single','double-optin']),
                otherResult: JSON.stringify([
                    {'emarsysId':'1234','emarsysName':'SFCC_CANCELLED_ORDER','sfccName':'cancelled_order'},
                    {'emarsysId':'1278','emarsysName':'SFCC_DOUBLE_OPTIN','sfccName':'double-optin'}])
            },
            name: 'StoredEvents'
        };
        var sourceList = JSON.parse(eventsCustomObject.custom.otherSource);
        var descriptionsList = JSON.parse(eventsCustomObject.custom.otherResult);
        var result = emarsysEventsHelper.getNotMappedEvents(sourceList, descriptionsList);
        assert.deepEqual(result, ['single']);
    });

    it('Testing method: getExistentEventsData', () => {
        var allEmarsysEvents = [
            {'id':'5633','name':'single'},
            {'id':'5634','name':'double'},
            {'id':'12561','name':'SFCC_FORGOT_PASSWORD_SUBMITTED'},
            {'id':'12563','name':'SFCC_CONTACT_FORM_SUBMITTED'},
            {'id':'12644','name':'SFCC_NEWSLETTER_SUBSCRIPTION_CONFIRMATION'},
            {'id':'12646','name':'SFCC_NEWSLETTER_UNSUBSCRIBE_SUCCESS'}
        ];
        var sfccNames = [
            'cancelled_order',
            'forgot_password_submitted',
            'contact_form_submitted',
            'share_a_wishlist'
        ];

        var result = emarsysEventsHelper.getExistentEventsData(allEmarsysEvents, sfccNames);
        assert.deepEqual(result, [
            {'emarsysId': '', 'emarsysName': 'SFCC_CANCELLED_ORDER'},
            {'emarsysId': '12561', 'emarsysName': 'SFCC_FORGOT_PASSWORD_SUBMITTED'},
            {'emarsysId': '12563', 'emarsysName': 'SFCC_CONTACT_FORM_SUBMITTED'},
            {'emarsysId': '', 'emarsysName': 'SFCC_SHARE_A_WISHLIST'}
        ]);
    });

    it('Testing method: composeObject', () => {
        var args = {
            dataObject: {
                'email': 'test@test.com'
            },
            placeholdersMapping: [{
                'field': 'email',
                'label': 'Email',
                'placeholder': 'external_id',
                'required': true
            }]
        };
        var result = emarsysEventsHelper.composeObject(args);
        assert.deepEqual(result, {'external_id': 'test@test.com'});
    });

    it('Testing method: composeObject #1 empty mapping', () => {
        var args = {
            dataObject: 'test@test.com',
            baseObject: {}
        };
        var result = emarsysEventsHelper.composeObject(args);
        assert.deepEqual(result, {});
    });

    it('Testing method: composeObject #3', () => {
        var args = {
            dataObject: {
                'email': 'test@test.com',
                'customer_email':'test@test.com'
            },
            placeholdersMapping: [{
                'field': 'email',
                'label': 'Email',
                'placeholder': 'external_id',
                'required': true
            },{
                'field': 'customer_email',
                'label': 'Customer email',
                'placeholder': 'data.global.customer_email',
                'required': false
            }]};
        var result = emarsysEventsHelper.composeObject(args);
        assert.deepEqual(result, {
            'external_id': 'test@test.com',
            'data': {
                    'global': {
                        'customer_email': 'test@test.com'
                    }
                }
        });
    });

    it('Testing method: createTestCampaign', () => {
        var event = {
            'sfccName':'cancelled_order',
            'emarsysId':'12678',
            'emarsysName':'SFCC_CANCELLED_ORDER'
        };
        var result = emarsysEventsHelper.createTestCampaign(event, '1111111');
        assert.deepEqual(result, {
            'result': {
                'data': [{
                          'id': '7497056',
                          'name': 'test_event_12561',
                          'status': '1'
                        },
                        {
                          'id': '7497055',
                          'name': 'test_event_12677',
                          'status': '-3'
                        },{
                          'id': '1113',
                          'name': 'emarsysTest3',
                          'status': '3'
                        }]
                
            },
            'status': 'OK'
        });
    });

    it('Testing method: prepareCampaignData', () => {
        var campaignsList = [{
            id: '1111', name: 'emarsysTest1', status:'1'},{
            id: '1112', name: 'emarsysTest2', status:'2'},{
            id: '1113', name: 'emarsysTest3', status:'3'},{  
            id: '1114', name: 'emarsysTest4', status:'4'},{ 
            id: '1115', name: 'emarsysTest5', status:'-3'},{ 
            id: '1116', name: 'emarsysTest6', status:'-6' },{ 
            id: '1117', name: 'emarsysTestInvalid', status:'00'}];
        var result = emarsysEventsHelper.prepareCampaignData(campaignsList);
        assert.deepEqual(result, {
            'emarsysTest1': {
                'id': '1111','name': 'emarsysTest1','status': 'In design' },
            'emarsysTest2': {
                'id': '1112','name': 'emarsysTest2','status': 'Tested'},
            'emarsysTest3': {
                'id': '1113','name': 'emarsysTest3','status': 'Launched' },
            'emarsysTest4': {
                'id': '1114','name': 'emarsysTest4','status': 'Ready to launch'},
            'emarsysTest5': {
                'id': '1115','name': 'emarsysTest5','status': 'Deactivated'},
            'emarsysTest6': {
                'id': '1116','name': 'emarsysTest6','status': 'Aborted'},
            'emarsysTestInvalid': {
                'id': '1117','name': 'emarsysTestInvalid','status': 'Invalid'}
        });
    });

    it('Testing method: getEventsRelatedData', () => {
        var campaignData = {
            'test_event_12561': {
                'id':'7497056',
                'name':'test_event_12561',
                'status':'Deactivated'
            },
            'test_event_12677': {
                'id':'7497055',
                'name':'test_event_12677',
                'status':'In design'
            },
            'emarsysTest3': {
                'id': '1113','name': 'emarsysTest3','status': 'Launched' }
        };
        var emarsysDescriptions = [{
            'emarsysId': '12561',
            'emarsysName':'SFCC_FORGOT_PASSWORD_SUBMITTED'
        },{
            'emarsysId': '12563',
            'emarsysName': 'SFCC_CONTACT_FORM_SUBMITTED'
        }];
        var result = emarsysEventsHelper.getEventsRelatedData(campaignData, emarsysDescriptions);
        assert.deepEqual(result, {   
        '12561': {
            'id': '7497056',
            'name': 'test_event_12561',
            'status': 'Deactivated'
          },
        '12563': {
            'id': '',
            'status': 'not exist'
          }
        });
    });

    it('Testing method: findObjectInList', () => {
        var list = [{
            'emarsysEventName':'SFCC_CONTACT_FORM_SUBMITTED',
            'fieldsData': [{
                'field': 'email',
                'label': 'Email',
                'placeholder': 'external_id',
                'required': true
            }],
            'sfccEventName':'contact_form_submitted',  
        },{
            'emarsysEventName':'SFCC_FORGOT_PASSWORD_SUBMITTED',
            'fieldsData': [{
                'field': 'email',
                'label': 'Email',
                'placeholder': 'external_id',
                'required': true
            }],
            'sfccEventName':'forgot_password_submitted',  
        }];
        var field = 'emarsysEventName';
        var value = 'SFCC_CONTACT_FORM_SUBMITTED';
        var result = emarsysEventsHelper.findObjectInList(list, field, value);
        assert.deepEqual(result, {
            'field': 'emarsysEventName',
            'index': 0,
            'object': {
                'emarsysEventName': 'SFCC_CONTACT_FORM_SUBMITTED',
                'fieldsData': [{
                        'field': 'email',
                        'label': 'Email',
                        'placeholder': 'external_id',
                        'required': true
                }],
                'sfccEventName': 'contact_form_submitted'
            },
            'success': true,
            'value': 'SFCC_CONTACT_FORM_SUBMITTED'
        });
    });

});
