'use strict';

var Logger = dw.system.Logger.getLogger('Inventory', 'Helper');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

importPackage(dw.system);
importPackage(dw.util);

function getInventoryLists() {
	var remoteJobService = LocalServiceRegistry.createService('OCAPIDataService', {
		createRequest: function(service:HTTPService, params) {
            	
			var bearerToken = 'Bearer ' + params.token;
            	
            service.setURL(service.getURL() + "/inventory_lists");
            service.addHeader('Content-Type', 'application/json');
            service.addHeader('Authorization', bearerToken);
            service.setRequestMethod('get');
                
            var body = {
            };
                
            return JSON.stringify(body);
		},
            
		parseResponse: function (service, listOutput) {
        	return listOutput.text;
		}
	});
        
	var res = remoteJobService.call({
		"token": getCachedOCAPIToken(),
	});
	
	var invLists = [];
	
	if (res.ok) {
		var lists = JSON.parse(res.object);
		
		for each (var invList in lists.data) {
			invLists.push (
					{
						"id" : invList.id
					});
		}
	}
	
	return invLists;
};


function getCachedOCAPIToken() {
    var cache = dw.system.CacheMgr.getCache("OCAPIToken");
    return cache.get("token", function getDefaultAttempts() {return getToken();});
};


function getToken() {
	var token = null;
	
    var tokenService = LocalServiceRegistry.createService('SFCCTokenService', {
        parseResponse: function (service, listOutput) {
            return listOutput.text;
        }
    });
    
    var formData = {
        'grant_type': 'client_credentials'
    };
    
    var tokenResult = tokenService.call(formData);
    
    if (tokenResult.status === 'OK' && !empty(tokenResult.object)) {
        token = JSON.parse(tokenResult.object).access_token;
        Logger.debug("New OCAPI token is {0}", token);
    }
    
    return token;
};


module.exports = {
		getInventoryLists : getInventoryLists
}
