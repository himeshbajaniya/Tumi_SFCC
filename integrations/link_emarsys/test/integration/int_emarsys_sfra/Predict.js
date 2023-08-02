var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');

describe('Predict - return cart object ', function () {
    this.timeout(5000);

    var myRequest = {
        url: '',
        method: 'GET',
        rejectUnauthorized: false,
        resolveWithFullResponse: true,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        } 
    };

    myRequest.url = config.baseUrl + '/Predict-ReturnCartObject';
    it('should successfully return cart object', function () {
        return request(myRequest)
            .then(function (response) {
                assert.equal(response.statusCode, 200, 'Expected statusCode to be 200.');
                var bodyAsJson = JSON.parse(response.body);
                assert.deepEqual(bodyAsJson.cartObj, []);
            });
    });
});