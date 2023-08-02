'use strict';

var File = require('dw/io/File');
var Transaction = require('dw/system/Transaction');
var CSVImport = require('./importXMLCSV.js');
var ImportUtils = require('./ImportUtils.js');

importPackage(dw.system);
importPackage(dw.io);
importPackage(dw.util);
importPackage(dw.crypto);

var CUSTOMER_IMPORT = require('./customerUpdates.json');

var IMPORT_TYPES = {
    "CUSTOMER_IMPORT" : {
        "definition_data" : "CUSTOMER_IMPORT",
        "import_method" : "createCustomerNode"
    }
};


var ATTRIBUTE_MAP = {
	"StoreId" : "favouriteStore",
	"MonogramText" : "monogramText",
	"FontColor" : "fontColor",
	"FontStyle" : "fontStyle"
}

var PROFILE_MAP = {
		"FirstName" : "first-name",
		"LastName" : "last-name"
	}

/**
 * Custom optin import using CSV files 
*/

exports.execute = function(parameters, jobStepExecution) {
	return CSVImport.execute(parameters, jobStepExecution, this); 
};


function createCustomerNode(xmlStream, lineObject, parameters, mainCaller) {

	var attributes = parameters.AttributesToImport.split(",");
	var customer = dw.customer.CustomerMgr.getCustomerByLogin(ImportUtils.getDefinedString(lineObject['CustomerId']));
	var customerNo = "undefined";
	if (customer) {
		customerNo = customer.profile.customerNo;
	}
	
    xmlStream.writeStartElement("customer");
    	xmlStream.writeAttribute("customer-no", customerNo);

    	xmlStream.writeStartElement("profile");
    	
    		for each (var attrib in attributes) {
    			if (PROFILE_MAP[attrib]) {
    				ImportUtils.createXMLElement(xmlStream, PROFILE_MAP[attrib], ImportUtils.getDefinedString(lineObject[attrib]));
    			}
			}
    	
    		xmlStream.writeStartElement("custom-attributes");
    			
    			for each (var attrib in attributes) {
    				if (ATTRIBUTE_MAP[attrib]) {
    					ImportUtils.createCustomXMLAttribute(xmlStream, ATTRIBUTE_MAP[attrib], ImportUtils.getDefinedString(lineObject[attrib]));
    				}
    			}
    			
    		xmlStream.writeEndElement();
		xmlStream.writeEndElement();
	xmlStream.writeEndElement();   	
};


function getXMLStreamWriter(fileWriter) {
	
	var xsw : XMLStreamWriter = new XMLIndentingStreamWriter(fileWriter);
	xsw.writeStartDocument();
	xsw.writeStartElement("customers");
	xsw.writeAttribute("xmlns", "http://www.demandware.com/xml/impex/customer/2006-10-31");

	return xsw;
};

function closeXMLStreamWriter(fileWriter, xsw) {
	xsw.writeEndElement();
	xsw.writeEndDocument();
	xsw.flush();
	xsw.close();
	fileWriter.close();	
};

