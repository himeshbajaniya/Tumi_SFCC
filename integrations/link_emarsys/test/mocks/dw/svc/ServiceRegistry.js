'use strict';

var ServiceRegistry = {
    'get': function (serviceID) {
        if (serviceID === 'emarsys.api') {
            return {
                authentication: 'BASIC',
                cachingTTL: 0,
                client: null,
                credentialID: 'emarsys.http.cred',
                encoding: 'UTF-8',
                mock: false,
                outFile: null,
                requestData: null,
                requestMethod: 'POST',
                response: null,
                throwOnError: false,
                URL: 'https://{0}/api/v2/',
                addHeader: function () {
                    return true;
                },
                setRequestMethod: function (val) {
                    this.val = val;
                },
                call: function (){
                    return {
                        'error': 0,
                        'errorMessage': null,
                        'mockResult': false,
                        'msg': 'OK',
                        'object':{ 'replyCode': 0, 'replyText': 'OK', 'data': {'errors': [],'result': [{'id': '330110028', 'uid': 'Ee0VtQp8pu', '0': null, '1': 'Test', '2': 'Test', '3': 'test@test.com', '4': null, '5': null, '6': null, '7': null, '8': null, '9': null, '10': 'Street Address', '11': 'City', '12': 'AL', '13': '12345', '14': '185', '15': '2124564343', '16': null, '17': null, '18': null, '19': null, '20': null, '21': null, '22': null, '23': null, '24': null, '25': null, '26': null, '27': null, '28': null, '29': null, '30': null, '31':'1','32':'1','33':'1','34':[],'35': null, '36': null, '37': null, '38': null, '39': null, '40': null, '41': null, '42': null, '43': null, '44': null, '45': null, '46': null, '47': '1', '48': '2017-05-09', '36625': 'a6ad00ac113a19d91', '36626': 'c6b54976e3a21', '45070': null, '47595': null}]}},
                        'ok': true,
                        'status': 'OK',
                        'unavailableReason': null
                    } 
                }
            }
        }
    }
}

module.exports = ServiceRegistry;
