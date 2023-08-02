'use strict';

var File = require('dw/io/File');
var Transaction = require('dw/system/Transaction');
var CSVImport = require('./importCSV.js');
var ImportUtils = require('./ImportUtils.js');

importPackage(dw.system);
importPackage(dw.io);
importPackage(dw.util);
importPackage(dw.crypto);

var OPTIN_IMPORT = require('./optin.json');

var IMPORT_TYPES = {
    "OPTIN_IMPORT" : {
        "definition_data" : "OPTIN_IMPORT",
        "import_method" : "createOptinNode"
    }
};

/**
 * Custom optin import using CSV files 
*/

exports.execute = function(parameters, jobStepExecution) {
	return CSVImport.execute(parameters, jobStepExecution, this); 
};


function createOptinNode(xmlObject, lineObject, parameters, mainCaller) {
    var customer : XML = 
        <customer customer-no={ImportUtils.getDefinedString(lineObject['CustomerId'])}>
        </customer>;
        
	
    var profile : XML = 
    	<profile>
        </profile>
    
    
    var profileCustomAttributes : XML =
    	<custom-attributes>
    	</custom-attributes>;
    	
    	ImportUtils.createCustomAttribute(profileCustomAttributes, "emailPreference", lineObject['EmailPreference']);

	profile["custom-attributes"] = profileCustomAttributes;
    customer.profile = profile;
	
    xmlObject.customers += customer;
            
};

function getXMLHeader() {
	var xmlObject : XML = 
        <?xml version="1.0" encoding="UTF-8"?>
		<customers xmlns="http://www.demandware.com/xml/impex/customer/2006-10-31">
		</customers>;
	
	return xmlObject;
};

