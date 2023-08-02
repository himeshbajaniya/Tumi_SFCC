'use strict';

var server = require('server');
var Logger = dw.system.Logger.getLogger('ReverseLogix', 'Synch');
var reverseLogixHelpers = require('~/cartridge/scripts/helpers/reverseLogixHelpers'); 

importPackage(dw.system);
importPackage(dw.util);
importPackage(dw.catalog);

/**
 * Reverse Logix Updates
 */
server.post('Synch', function (req, res, next) {
	var errors = [];
	var authorization = request.getHttpHeaders().get("authorization");
	var reverseLogixAuthorization = Site.getCurrent().getCustomPreferenceValue('reverseLogixAuthorization');
	
	if (!(authorization == reverseLogixAuthorization )) {
    	res.json({
    		success: false,
    		message: ["Denied"]
    	});
    	
    	next();
    	
    	return;
	}
	
	try {
    	
    	var doc = request.httpParameterMap.requestBodyAsString;
    	var jsData = JSON.parse(doc);
    	
    	var response = reverseLogixHelpers.processEntry(jsData);
    	
    	res.json({
    		success: response.success,
    		message: [response.message]
    	});
    	
    	next();
    	
    	return;
    	
    } catch (e) {
        Logger.error(e.message);
        Logger.error(e.stack);

        errors.push({
        	"error" : e.message
		});
        
    }

    if (errors.length == 0) {
    	res.json({
    		success: true,
    		message: ["Success"]
    	});
    } else {
    	res.json({
    		success: false,
    		message: errors
    	});    	
    }
    
    next();
});

module.exports = server.exports();
