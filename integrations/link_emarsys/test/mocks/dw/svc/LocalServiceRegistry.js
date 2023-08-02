'use strict';

var service = {
    getURL: function() {
        return 'https://suite11.emarsys.net/api/v2/';
    },
    addHeader: function() {
        return '';
    },
    setRequestMethod: function() {
        return '';
    },
    setURL: function(requestUrl) {
        return requestUrl;
    }
};




class LocalServiceRegistry {
    createService(serviceId, configObj) {
        if (serviceId === 'emarsys.api') {
            return {
                call: function(requestBody) {
                    switch(requestBody) {
                        default:
                             return {
                                status: 'OK',
                                object: JSON.stringify({data:[]})
                        }
                    }
                },
                getConfiguration: function() {
                    return function getCredential() {
                        return {
                            getPassword: function() { return '1111'; },
                            getUser: function() { return 'Test'; }
                        }
                    }
                }
            };
        }
    }
}

module.exports = new LocalServiceRegistry;
