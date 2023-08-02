'use strict';

var Logger = dw.system.Logger.getLogger('ReverseLogix', 'Synch');
var CustomerMgr = require('dw/customer/CustomerMgr');
var Transaction = require('dw/system/Transaction');

var RETAINED_FIELDS = [
	"ronumber",
	"rocreateddate",
	"currentstatus",
	"rocomment",
	"currency",
	"Quotationamount",
	"firstName",
	"lastName",
	"email",
	"phone",
	"address1",
	"address2",
	"city",
	"state",
	"Zip",
	"country"
];


function processEntry(jsData) {
	var message = "Data has been updated";
	var success = true;
	try {
    	var email = jsData.email;

    	var customer = CustomerMgr.getCustomerByLogin(email);

    	if (customer == null) {
    		return {
        		success: false,
        		message: "Customer not found for email " + email
        	};
        	
        	next();
        	
        	return;
    	}
    	
    	updateCustomerRL(customer, jsData);
		
	} catch (e) {
		Logger.error(e.message);
		success = false;
		message = "Exception while processing data: " + e.message;
	}
	
	return {
		success: success,
		message: message		
	}
};


function updateCustomerRL(customer, jsData) {
	var existingRL = [];
	var added = false;
	
	if (!empty(customer.profile.custom.reverseLogixRepairs)) {
		existingRL = JSON.parse(customer.profile.custom.reverseLogixRepairs); 
	}
	
	var newRL = [];
	
	for each (var rl in existingRL) {
		if (rl.ronumber == jsData.ronumber) {
			newRL.push(stripRecord(jsData));
			added = true;
		} else {
			newRL.push(rl);
		}
	}
	
	if (!added) {
		newRL.push(stripRecord(jsData));
	}
	
	Transaction.wrap(function () {
		if (newRL.length > 0) {
			customer.profile.custom.reverseLogixRepairs = JSON.stringify(newRL);
		} else {
			customer.profile.custom.reverseLogixRepairs = null;;
		}
	});
};


function stripRecord(jsData) {
	
	var record = {};
	
	for each (var fieldName in RETAINED_FIELDS) {
		record[fieldName] = jsData[fieldName];
	}
	
	return record;
};




module.exports = {
	    processEntry: processEntry
	};
