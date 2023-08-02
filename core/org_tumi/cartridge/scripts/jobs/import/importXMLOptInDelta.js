'use strict';

var File = require('dw/io/File');
var Transaction = require('dw/system/Transaction');
var CSVImport = require('./importXMLCSV.js');
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


function createOptinNode(xmlStream, lineObject, parameters, mainCaller) {

    xmlStream.writeStartElement("customer");
    	xmlStream.writeAttribute("customer-no", ImportUtils.getDefinedString(lineObject['CustomerId']));

    	xmlStream.writeStartElement("profile");
    		xmlStream.writeStartElement("custom-attributes");
    			ImportUtils.createCustomXMLAttribute(xmlStream, "emailPreference", lineObject['EmailPreference']);
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

