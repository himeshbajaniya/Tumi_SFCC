'use strict';

importPackage(dw.system);
importPackage(dw.io);
importPackage(dw.util);
importPackage(dw.crypto);

var File = require('dw/io/File');
var Transaction = require('dw/system/Transaction');
var CSVImport = require('./importXMLCSV.js');
var ImportUtils = require('./ImportUtils.js');


var CUSTOMER_IMPORT = require('./customer.json');

var IMPORT_TYPES = {
    "CUSTOMER_IMPORT" : {
        "definition_data" : "CUSTOMER_IMPORT",
        "import_method" : "createCustomerNode"
    }
};

var ADDRESS_MAP = {
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

var SEED = 0;

/**
 * Custom catalog import using CSV files 
*/

exports.execute = function(parameters, jobStepExecution) {
	
	var maxAddresses = parameters.MaxAddresses;
	
	SEED = parameters.STARTING_SEED;
	
	for (var i=1; i <= maxAddresses; i++) {
		var addr = {};
		for each (var key in Object.keys(this.ADDRESS_MAP)) {
			this.CUSTOMER_IMPORT[key.replace("#", i)] = {
				    "property":  this.ADDRESS_MAP[key].replace("#", i),
				    "required": false
				  };
		}
	}
	
	return CSVImport.execute(parameters, jobStepExecution, this);
};


function createCustomerNode(xmlStream, lineObject, parameters, mainCaller) {
    var encryptRandomPassword = parameters.EncryptRandomPassword;
    var enabled = true;
	if (lineObject['AccountDeactivationDate'] != null && lineObject['AccountDeactivationDate'] != '') {
    	enabled = false;
	}
    
	var customer = dw.customer.CustomerMgr.getCustomerByLogin(ImportUtils.getDefinedString(lineObject['Email']));
	
	var found = false;
	var customerNo = "";
	var existingCustomer = false;
	
	if (customer) {
		customerNo = customer.profile.customerNo;
		existingCustomer = true;
	}
	
	while (empty(customerNo)) {
		var numb = nextSeed();;

		customerNo = "h" + numb;
		
		var customer = dw.customer.CustomerMgr.getCustomerByCustomerNumber(customerNo);
		
		if (customer != null) {
			customerNo = null;
		}
	}
	
    xmlStream.writeStartElement("customer");
    	xmlStream.writeAttribute("customer-no", customerNo);
        
	    xmlStream.writeStartElement("credentials");
	    
	    	ImportUtils.createXMLElement(xmlStream, "login", ImportUtils.getDefinedString(lineObject['Email']));

	    	if (!existingCustomer) {
	    		xmlStream.writeStartElement("password");
	    			xmlStream.writeAttribute("encrypted", encryptRandomPassword);
	    			xmlStream.writeCharacters(getRandomPassword(lineObject['FirstName'], lineObject['LirstName']));
	    			xmlStream.writeEndElement();
	    	}
	    	
	    	ImportUtils.createXMLElement(xmlStream, "enabled-flag", enabled);
		xmlStream.writeEndElement();
	
	
	
		mainCaller.debug("first " +lineObject['FirstName'] + "..", 0);
		mainCaller.debug("first " +ImportUtils.getDefinedString(lineObject['FirstName']) + "..", 0);
		mainCaller.debug("last  " +lineObject['LastName'] + "..", 0);
		mainCaller.debug("email " +lineObject['Email'] + "..", 0);
    	mainCaller.debug(".." +lineObject['CreationDate'] + "..", 0);

    
    	xmlStream.writeStartElement("profile");
    		ImportUtils.createXMLElement(xmlStream, "first-name", ImportUtils.getDefinedString(lineObject['FirstName']));
    		ImportUtils.createXMLElement(xmlStream, "last-name", ImportUtils.getDefinedString(lineObject['LastName']));
    		ImportUtils.createXMLElement(xmlStream, "email", ImportUtils.getDefinedString(lineObject['Email']));
    		ImportUtils.createXMLElement(xmlStream, "creation-date", ImportUtils.getDateString(lineObject['CreationDate'], false));
    		
    		if (!empty(parameters.PreferredLocale)) {
    			ImportUtils.createXMLElement(xmlStream, "preferred-locale", parameters.PreferredLocale);
    		}
    		
    		xmlStream.writeStartElement("custom-attributes");
			    ImportUtils.createCustomXMLAttribute(xmlStream, "monogramText", ImportUtils.getDefinedString(lineObject['MonogramText']));
    			ImportUtils.createCustomXMLAttribute(xmlStream, "monogramCreationDate", ImportUtils.getDateString(lineObject['MonogramAddedDate']));
    			ImportUtils.createCustomXMLAttribute(xmlStream, "optInSMS", lineObject['SMSPreference']);
    			ImportUtils.createCustomXMLAttribute(xmlStream, "optInEmail", lineObject['EmailPreference']);
    			ImportUtils.createCustomXMLAttribute(xmlStream, "fontColor", ImportUtils.getDefinedString(lineObject['FontColor']));
    			ImportUtils.createCustomXMLAttribute(xmlStream, "fontStyle", ImportUtils.getDefinedString(lineObject['FontStyle']));
    			ImportUtils.createCustomXMLAttribute(xmlStream, "socialUserId", ImportUtils.getDefinedString(lineObject['SocialUserId']));
    			ImportUtils.createCustomXMLAttribute(xmlStream, "isMigrated", true);
    		xmlStream.writeEndElement();
    	xmlStream.writeEndElement();
    
    

	
        var i = 1;
        xmlStream.writeStartElement("addresses");
	        
	    while (i <= 30) {
            
	    	var noAddress = empty(lineObject['Address1_' + i]) && empty(lineObject['Address2_' + i]) && empty(lineObject['City' + i]) && empty(lineObject['PostalCode' + i]) && empty(lineObject['FirstName' + i]) && empty(lineObject['LastName' + i]);
            	
		    if (!noAddress) {
		    	var preferredAddress = false;
		        
		    	if (lineObject['IsDefaultAddress' + i] != null && lineObject['IsDefaultAddress' + i] != '') {
		        	preferredAddress = lineObject['IsDefaultAddress' + i];
		        }
				
		        var newAddressId = ImportUtils.getLineAddressId(ImportUtils.getDefinedString(lineObject["FirstName" + i]), ImportUtils.getDefinedString(lineObject["LastName" + i]), ImportUtils.getDefinedString(lineObject["City" + i]), i);
            	
		        xmlStream.writeStartElement("address");
		        	xmlStream.writeAttribute("address-id", newAddressId);
		        	xmlStream.writeAttribute("preferred", preferredAddress);
		        	
		        	ImportUtils.createXMLElement(xmlStream, "salutation", ImportUtils.getDefinedString(lineObject["Salutation" + i]));
            		ImportUtils.createXMLElement(xmlStream, "first-name", ImportUtils.getDefinedString(lineObject["FirstName" + i]));
            		ImportUtils.createXMLElement(xmlStream, "last-name", ImportUtils.getDefinedString(lineObject["LastName" + i]));
            		ImportUtils.createXMLElement(xmlStream, "company-name", ImportUtils.getDefinedString(lineObject["CompanyName" + i]));
            		ImportUtils.createXMLElement(xmlStream, "address1", ImportUtils.getDefinedString(lineObject["Address1_" + i]));
            		ImportUtils.createXMLElement(xmlStream, "address2", ImportUtils.getDefinedString(lineObject["Address2_" + i]));
            		ImportUtils.createXMLElement(xmlStream, "postbox", ImportUtils.getDefinedString(lineObject["PostBox" + i]));
            		ImportUtils.createXMLElement(xmlStream, "city", ImportUtils.getDefinedString(lineObject["City" + i]));
            		ImportUtils.createXMLElement(xmlStream, "postal-code", ImportUtils.getDefinedString(lineObject["PostalCode" + i], 10));
            		ImportUtils.createXMLElement(xmlStream, "state-code", ImportUtils.getDefinedString(lineObject["StateCode" + i]));
            		ImportUtils.createXMLElement(xmlStream, "country-code", ImportUtils.getDefinedString(lineObject["CountryCode" + i]));
            		ImportUtils.createXMLElement(xmlStream, "phone", ImportUtils.getDefinedString(lineObject["Phone" + i]));
            		
            	xmlStream.writeEndElement();
		    }
		    
            i += 1;
	        
	    }

        xmlStream.writeEndElement();

    xmlStream.writeEndElement();
            
};


function getRandomPassword(firstNAme, lastName) {

	var sc = new dw.crypto.SecureRandom();
	
    var encodeChars = function (bytes) {
        var buf = new String();
        for (var i = 0; i < bytes.length; i++) {
            var num = getInt(bytes.byteAt(i));
            buf += ((num & 0xf0) >> 4).toString(16);
            buf += (num & 0x0f).toString(16);
        }
        return buf;
    }
    
    var getInt = function getInt(b) {
        if (b < 0) b = 127 - b;
        return b;
    }
    
    var hashedStr = "!Pas1" + encodeChars(sc.nextBytes(16));    
    
    
    return hashedStr;
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

function nextSeed() {
	var seed = ("" + ++SEED).padStart(10, '0');
	return seed;
}