'use strict';

var Logger = dw.system.Logger.getLogger('LinkCustomerOrders', 'LinkCustomerOrders');
var Profile = require('dw/customer/Profile');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');

exports.execute = function(parameters, jobStepExecution) {

	var count=0;

    function updateOrder(order: Order)
    {
    	Logger.info("updating order {0}", order.getOrderNo());
    	count++;
		var email = order.getCustomerEmail();  
	    var customer = dw.customer.CustomerMgr.getCustomerByLogin(email);
	    
	    if (customer) {
	        dw.system.Transaction.wrap(function() {
	            order.setCustomer(customer);
	        });
	        
	        Logger.info("Updated order {0}, to customer {1}", order.getOrderNo(), customer.profile.customerNo);
	    } else {
	    	Logger.info("No customer found for order {0}", order.getOrderNo());
	    }
    };	


	if (!empty(parameters.Emails)) {
	
		var emails = parameters.Emails.split(",");

		for each (var email in emails) {
			Logger.info("update orders for email {0}", email);
			dw.order.OrderMgr.processOrders(updateOrder, "customerEmail={0}", email);
		}
	}

	if (!empty(parameters.UpdateAll)) {

		Logger.info("update all orders");
		dw.order.OrderMgr.processOrders(updateOrder, "customerEmail != {0}", "noemail");
	}

	
};
