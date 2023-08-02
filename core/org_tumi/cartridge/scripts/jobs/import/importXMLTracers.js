'use strict';

importPackage(dw.system);
importPackage(dw.io);
importPackage(dw.util);
importPackage(dw.crypto);

var File = require('dw/io/File');
var Transaction = require('dw/system/Transaction');
var CSVImport = require('./importXMLCSV.js');
var ImportUtils = require('./ImportUtils.js');


var TRACER_IMPORT = require('./tracer.json');

var IMPORT_TYPES = {
    "TRACER_IMPORT" : {
        "definition_data" : "TRACER_IMPORT",
        "import_method" : "createTracerNode"
    }
};

var TRACER_MAP = {
		"tracer_Number-#" : "TracerNumber#",
		"email#" : "Email#",
		"tracer_Reg_Date-#" : "TracerDate#",
		"addressline1_#" : "Address1_#",
		"addressline2_#" : "Address2_#",
		"city#" : "City#",
		"companyName#" : "CompanyName#",
		"countryCode#" : "CountryCode#",
		"firstName#" : "FirstName#",
		"LastName#" : "LastName#",
		"phone#" : "Phone#",
		"postBox#" : "PostBox#",
		"postalCode#" : "PostalCode#",
		"salutation#" : "Salutation#",
		"stateCode#" : "StateCode#",
		"lastModified#" : "LastModified#",
		"creationDate#" : "CreationDate#",
		"isDefaultAddress#" : "IsDefaultAddress#"
	};

/**
 * Custom tracer import using CSV files 
*/

exports.execute = function(parameters, jobStepExecution) {
	var maxTracers = parameters.MaxTracers;
	
	for (var i=1; i <= maxTracers; i++) {
		var addr = {};
		for each (var key in Object.keys(this.TRACER_MAP)) {
			this.TRACER_IMPORT[key.replace("#", i)] = {
				    "property":  this.TRACER_MAP[key].replace("#", i),
				    "required": false
				  };
		}
	}
	
	return CSVImport.execute(parameters, jobStepExecution, this); 
};


function createTracerNode(xmlStream, lineObject, parameters, mainCaller) {
	var tracerRegistrationData = [];
	var maxTracers = parameters.MaxTracers;
	for (var i=1; i <= maxTracers; i++) {
		if (!empty(ImportUtils.getDefinedString(lineObject['TracerNumber' + i]))) {
			var tracerEntry = {};
			
			tracerEntry.tracerId = ImportUtils.getDefinedString(lineObject['TracerNumber' + i]);
			tracerEntry.email = ImportUtils.getDefinedString(lineObject['Email' + i]);
			tracerEntry.phone = ImportUtils.getDefinedString(lineObject['Phone' + i]);
			tracerEntry.registerDate = ImportUtils.getDateString(lineObject['TracerDate' + i]);
			tracerEntry.address1 = ImportUtils.getDefinedString(lineObject['Address1_' + i]);
			tracerEntry.address2 = ImportUtils.getDefinedString(lineObject['Address2_' + i]);
			tracerEntry.postalCode = ImportUtils.getDefinedString(lineObject['PostalCode' + i]);
			tracerEntry.city = ImportUtils.getDefinedString(lineObject['City' + i]);
			tracerEntry.state = ImportUtils.getDefinedString(lineObject['StateCode' + i]);
			tracerEntry.country = ImportUtils.getDefinedString(lineObject['CountryCode' + i]);
			
			tracerRegistrationData.push(tracerEntry);
		}
	}	

	var customer = dw.customer.CustomerMgr.getCustomerByLogin(ImportUtils.getDefinedString(lineObject['CustomerId']));
	var customerNo = "undefined";
	if (customer) {
		customerNo = customer.profile.customerNo;
	}

    xmlStream.writeStartElement("customer");
    	xmlStream.writeAttribute("customer-no", customerNo);
    	xmlStream.writeStartElement("profile");
    		xmlStream.writeStartElement("custom-attributes");
			    ImportUtils.createCustomXMLAttribute(xmlStream, "tracerRegistrationData", JSON.stringify(tracerRegistrationData));
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
}
