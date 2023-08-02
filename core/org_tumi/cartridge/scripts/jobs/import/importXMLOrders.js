'use strict';

var File = require('dw/io/File');
var Transaction = require('dw/system/Transaction');
var CSVImport = require('./importXMLCSV.js');
var ImportUtils = require('./ImportUtils.js');
var Logger = require('dw/system/Logger');

importPackage(dw.system);
importPackage(dw.io);
importPackage(dw.util);
importPackage(dw.crypto);
importPackage(dw.catalog);

var ORDER_IMPORT = require('./order.json');
var IMPORT_TYPES = {
    "ORDER_IMPORT" : {
        "definition_data" : "ORDER_IMPORT",
        "import_method" : "createOrderNode"
    }
};

var SHIP_STATUS = {
		"CANCELLED" : "CANCELLED",
		"MANIFESTED" : "MANIFESTED",
		"PERSONALIZING" : "PERSONALIZING",
		"READY_FOR_PICKUP" : "READY_FOR_PICKUP",
		"READY_TO_CAPTURE" : "READY_TO_CAPTURE",
		"REGISTERED" : "REGISTERED",
		"REPAIR_PROCESSING" : "REPAIR_PROCESSING",
		"REPAIR_RECEIVED" : "REPAIR_RECEIVED",
		"REPAIR_REQUESTED" : "REPAIR_REQUESTED",
		"REPAIR_SHIPPED" : "REPAIR_SHIPPED",
		"RESHIPPED" : "RESHIPPED",
		"RESUME" : "RESUME",
		"RETURN_RECEIVED" : "RETURN_RECEIVED",
		"SENT_FOR_FULFILLMENT" : "SENT_FOR_FULFILLMENT",
		"SHIPPED" : "SHIPPED",
		"WAITING_FOR_WAREHOUSE" : "WAITING_FOR_WAREHOUSE"
	};

var monogramFields = ["productCode","productType","quantity","vasField4","vasField1","vasField2","vasField3","productName","basePrice","totalPrice","sumTaxValues","vasField5"];
var monogramHybrisFields = ["productCode","productType","quantity","size","monogramText","fontColor","fontstyle","productName","basePrice","totalPrice","sumTaxValues","gridColor"];

var SHIP_US_MAP = {
	"bopis" : "pickup",
	"carryout" : "pickup",
	"standard-ground-net" : "standard-ground-net",
	"second-day-net" : "second-day-net",
	"overnight-net" : "overnight-net",
	"standard-international-shipping-net" : "standard-ground-net",
	"ups-standard-net" : "standard-ground-net",
	"ups-express-net" : "standard-ground-net",
	"pickup" : "pickup",
	"standard-ground-free" : "standard-ground-net",
	"standard-shipping" : "standard-ground-net",
	"standard-net" : "standard-ground-net"
};

var SHIP_CA_MAP = {
		"standard-ground-net" : "standard-international-shipping-net",
		"standard-international-shipping-net" : "standard-international-shipping-net",
		"pickup" : "standard-international-shipping-net",
		"standard-ground-free" : "standard-international-shipping-net"
};

var LINEITEMS_MAP = {
		"Entry code - #" : "EntryCode#",
		"Entry_Status -#" : "EntryStatus#",
		"storeID-#" : "StoreId#",
		"isGiftboxEnabled - #" : "GiftBox#",
		"Consignment code - #" : "ConsignmentCode#",
		"Product ID - #" : "ProductId#",
		"monogram_pli-#-1" : "Monogram#-1",
		"monogram_pli-#-2" : "Monogram#-2",
		"Product name - #" : "ProductName#",
		"Product quantity - #" : "ProductQuantity#",
		"Product price - #" : "ProductPrice#",
		"Sale price - #" : "SalePrice#"
	};



/**
 * Custom optin import using CSV files 
*/

exports.execute = function(parameters, jobStepExecution) {

	var maxProducts = parameters.MaxProducts;
	
	for (var i=1; i <= maxProducts; i++) {
		var addr = {};
		for each (var key in Object.keys(this.LINEITEMS_MAP)) {
			this.ORDER_IMPORT[key.replace("#", i)] = {
				    "property":  this.LINEITEMS_MAP[key].replace("#", i),
				    "required": false
				  };
		}
	}
	
	return CSVImport.execute(parameters, jobStepExecution, this); 
};


function createOrderNode(xmlStream, lineObject, parameters, mainCaller) {
	var currency = parameters.Currency;
	var locale = parameters.Locale;
	
	mainCaller.debug("Import order " + lineObject['OrderNo'], 0);
	
    xmlStream.writeStartElement("order");
    	xmlStream.writeAttribute("order-no", ImportUtils.getDefinedString(lineObject['OrderNo']));
    	
    	ImportUtils.createXMLElement(xmlStream, "order-date", ImportUtils.getDateString(lineObject['CreationDate'], false));
    	ImportUtils.createXMLElement(xmlStream, "original-order-no", ImportUtils.getDefinedString(lineObject['OrderNo']));
    	
    	if (empty(currency) || "USD".equals(currency)) {
    		ImportUtils.createXMLElement(xmlStream, "currency", "USD");
    		ImportUtils.createXMLElement(xmlStream, "customer-locale", "en_US");
    	} else {
    		ImportUtils.createXMLElement(xmlStream, "currency", currency);
    		ImportUtils.createXMLElement(xmlStream, "customer-locale", locale);
    	}
    	ImportUtils.createXMLElement(xmlStream, "taxation", "net");
    	ImportUtils.createXMLElement(xmlStream, "invoice-no", ImportUtils.getDefinedString(lineObject['OrderNo']));

		var customer = dw.customer.CustomerMgr.getCustomerByLogin(ImportUtils.getDefinedString(lineObject['CustomerEmail']));
		var customerNo = null;
		if (customer) {
			customerNo = customer.profile.customerNo;
		}
    	
    	xmlStream.writeStartElement("customer");
    		if (customerNo != null) {
    			ImportUtils.createXMLElement(xmlStream, "customer-no", customerNo);
    		}
    		
    		ImportUtils.createXMLElement(xmlStream, "customer-name", ImportUtils.getDefinedString(lineObject['CustomerFirstName']) + " " + ImportUtils.getDefinedString(lineObject['CustomerLastName']));
    		ImportUtils.createXMLElement(xmlStream, "customer-email", ImportUtils.getDefinedString(lineObject['CustomerEmail']));
    		
    		xmlStream.writeStartElement("billing-address");
    			ImportUtils.createXMLElement(xmlStream, "first-name", ImportUtils.getDefinedString(lineObject['BillingFirstName']));
    			ImportUtils.createXMLElement(xmlStream, "last-name", ImportUtils.getDefinedString(lineObject['BillingLastName']));
    			ImportUtils.createXMLElement(xmlStream, "address1", ImportUtils.getDefinedString(lineObject['BillingAddress1']));
    			ImportUtils.createXMLElement(xmlStream, "address2", ImportUtils.getDefinedString(lineObject['BillingAddress2']));
    			ImportUtils.createXMLElement(xmlStream, "city", ImportUtils.getDefinedString(lineObject['BillingCity']));
    			ImportUtils.createXMLElement(xmlStream, "postal-code", ImportUtils.getDefinedString(lineObject['BillingPostalCode']));
    			ImportUtils.createXMLElement(xmlStream, "state-code", ImportUtils.getDefinedString(lineObject['BillingProvince']));
    			ImportUtils.createXMLElement(xmlStream, "country-code", ImportUtils.getDefinedString(lineObject['BillingCountry']));
    			ImportUtils.createXMLElement(xmlStream, "phone", ImportUtils.getDefinedString(lineObject['BillingPhone']));
    		xmlStream.writeEndElement();
    		
    	xmlStream.writeEndElement();
    	
    	var shipingStatus = "SHIPPED";
    	xmlStream.writeStartElement("status");
    	
    		if ("COMPLETED" == ImportUtils.getDefinedString(lineObject["OrderStatus"])) {
	    		ImportUtils.createXMLElement(xmlStream, "order-status", "COMPLETED");
    		} else if ("SENT_FOR_FULFILLMENT" == ImportUtils.getDefinedString(lineObject["OrderStatus"])) {
	    		ImportUtils.createXMLElement(xmlStream, "order-status", "NEW");
	    		shipingStatus = "NOT_SHIPPED";
    		} else {
    			ImportUtils.createXMLElement(xmlStream, "order-status", "CANCELLED");
    		}
    		
    		ImportUtils.createXMLElement(xmlStream, "shipping-status", shipingStatus);
    		ImportUtils.createXMLElement(xmlStream, "confirmation-status", "CONFIRMED");
    		ImportUtils.createXMLElement(xmlStream, "payment-status", "PAID");
    	xmlStream.writeEndElement();
    	
    	ImportUtils.createXMLElement(xmlStream, "current-order-no", ImportUtils.getDefinedString(lineObject['OrderNo']));
    	
    	var shipments = new HashMap();
    	
        if (lineObject["ProductId1"]) {
            var i = 1;
            xmlStream.writeStartElement("product-lineitems");
    	        
    	        while (lineObject["ProductId" + i]) {
                	
                	xmlStream.writeStartElement("product-lineitem");
                		var price = 0;
                		var netPrice = 0;
                		var salePrice = 0;
                		var discount = 0;
                		var taxBasisPrice = 0;
                		var zero = 0;
                		try {
                			price = new Number(ImportUtils.getDefinedString(lineObject["ProductPrice" + i]));
                			salePrice = new Number(ImportUtils.getDefinedString(lineObject["SalePrice" + i]));
                			var qty = new Number(ImportUtils.getDefinedString(lineObject["ProductQuantity" + i]));
                			discount = (price - salePrice) * qty; 
                			netPrice = price * qty;
                			taxBasisPrice = salePrice * qty;
                		} catch (e) {
                			mainCaller.error(e);
                		}
                	
                		ImportUtils.createXMLElement(xmlStream, "net-price", netPrice.toFixed(2));
                		ImportUtils.createXMLElement(xmlStream, "tax", "0.0");
                		ImportUtils.createXMLElement(xmlStream, "gross-price", netPrice.toFixed(2));
                		ImportUtils.createXMLElement(xmlStream, "base-price", ImportUtils.getDefinedString(lineObject["ProductPrice" + i]));
                		ImportUtils.createXMLElement(xmlStream, "lineitem-text", ImportUtils.getDefinedString(lineObject["ProductName" + i]));
                		ImportUtils.createXMLElement(xmlStream, "tax-basis", taxBasisPrice.toFixed(2));
                		ImportUtils.createXMLElement(xmlStream, "position", i);
                		ImportUtils.createXMLElement(xmlStream, "product-id", ImportUtils.getDefinedString(lineObject["ProductId" + i]));
                		ImportUtils.createXMLElement(xmlStream, "product-name", ImportUtils.getDefinedString(lineObject["ProductName" + i]));
                		
                		xmlStream.writeStartElement("quantity");
                			xmlStream.writeAttribute("unit", "");
                			xmlStream.writeCharacters(ImportUtils.getDefinedString(lineObject["ProductQuantity" + i]));
                		xmlStream.writeEndElement();
                		
                		ImportUtils.createXMLElement(xmlStream, "tax-rate", "0.0");
                		
                		
                		var shipId = updateShipment(shipments, lineObject, i);
                		
                		ImportUtils.createXMLElement(xmlStream, "shipment-id", shipId);
                		
                		
                		xmlStream.writeStartElement("custom-attributes");
                			ImportUtils.createCustomXMLAttribute(xmlStream, "consignmentID", ImportUtils.getDefinedString(lineObject['ConsignmentCode' + i]));
                			ImportUtils.createCustomXMLAttribute(xmlStream, "entryCode", ImportUtils.getDefinedString(lineObject['EntryCode' + i]));
                			
                			
                			// Ship status
                			var shipStatus = SHIP_STATUS[ImportUtils.getDefinedString(lineObject['EntryStatus' + i])];
                			if (!empty(shipStatus)) {
                				ImportUtils.createCustomXMLAttribute(xmlStream, "shippingstatus", shipStatus);
                			}
                			
                			var giftBoxEnableLineitem = "TRUE".equals(ImportUtils.getDefinedString(lineObject['GiftBox' + i]));
                			if (giftBoxEnableLineitem) {
                				ImportUtils.createCustomXMLAttribute(xmlStream, "giftBoxEnableLineitem", giftBoxEnableLineitem);
                			}
                				
                			//Monogramming
                			var monogram1 = ImportUtils.getDefinedString(lineObject['Monogram' + i + '-1']);
                			var monogram2 = ImportUtils.getDefinedString(lineObject['Monogram' + i + '-2']);
                			addMonogram([monogram1, monogram2], xmlStream);
                			
                		xmlStream.writeEndElement();
                		
                		// discount
                		if (discount > 0) {
                			xmlStream.writeStartElement("price-adjustments");
                				xmlStream.writeStartElement("price-adjustment");
                					ImportUtils.createXMLElement(xmlStream, "net-price", discount.toFixed(2));
                					ImportUtils.createXMLElement(xmlStream, "tax", zero.toFixed(2));
                					ImportUtils.createXMLElement(xmlStream, "gross-price", discount.toFixed(2));
                					ImportUtils.createXMLElement(xmlStream, "base-price", discount.toFixed(2));
                					ImportUtils.createXMLElement(xmlStream, "lineitem-text", "Discount");
                					ImportUtils.createXMLElement(xmlStream, "tax-basis", zero.toFixed(2));
                					ImportUtils.createXMLElement(xmlStream, "promotion-id", "Import");
                				xmlStream.writeEndElement();
                			xmlStream.writeEndElement();
                		}
                		
                	xmlStream.writeEndElement();
                	
                	i += 1;
            	}

            xmlStream.writeEndElement();
        }
        
        xmlStream.writeStartElement("shipping-lineitems");
        
        	for each (var shipmentId in shipments.keySet()) {
        		xmlStream.writeStartElement("shipping-lineitem");
        			if (shipmentId == "MYSHIP") {
        				ImportUtils.createXMLElement(xmlStream, "net-price", ImportUtils.getDefinedString(lineObject['ShippingFee']));
        			} else {
        				ImportUtils.createXMLElement(xmlStream, "net-price", "0.0");
        			}
        			
        			ImportUtils.createXMLElement(xmlStream, "tax", "0.0");
        			if (shipmentId == "MYSHIP") {
        				ImportUtils.createXMLElement(xmlStream, "gross-price", ImportUtils.getDefinedString(lineObject['ShippingFee']));
        				ImportUtils.createXMLElement(xmlStream, "base-price", ImportUtils.getDefinedString(lineObject['ShippingFee']));
        			} else {
        				ImportUtils.createXMLElement(xmlStream, "gross-price", "0.0");
        				ImportUtils.createXMLElement(xmlStream, "base-price", "0.0");        				
        			}
        			
        			ImportUtils.createXMLElement(xmlStream, "lineitem-text", "Shipping");
        			ImportUtils.createXMLElement(xmlStream, "tax-basis", "0.0");
        			ImportUtils.createXMLElement(xmlStream, "item-id", "STANDARD_SHIPPING");
        			ImportUtils.createXMLElement(xmlStream, "shipment-id", shipmentId);
        			ImportUtils.createXMLElement(xmlStream, "tax-rate", "0.0");
        		xmlStream.writeEndElement();
        	}
        xmlStream.writeEndElement();
    	
        xmlStream.writeStartElement("shipments");
        	
        	for each (var shipmentId in shipments.keySet()) {
        		var orderTotal = 0;
        		var orderTax = 0;
        		var orderSubtotal = 0;
        		var shipTotal = 0;
        		var merchTotal = 0;
        		var firstName, lastName, address1, address2, city, postalCode, stateCode, countryCode, phone, storeId;
        		var shippingMethodId = "pickup";
        		
        		if (shipmentId == "MYSHIP") {
            		try {
            			firstName = ImportUtils.getDefinedString(lineObject['ShippingFirstName']);
            			lastName = ImportUtils.getDefinedString(lineObject['ShippingLastName']);
            			address1 = ImportUtils.getDefinedString(lineObject['ShippingAddress1']);
            			address2 = ImportUtils.getDefinedString(lineObject['ShippingAddress2']);
            			city = ImportUtils.getDefinedString(lineObject['ShippingCity']);
            			postalCode = ImportUtils.getDefinedString(lineObject['ShippingPostalCode']);
            			stateCode = ImportUtils.getDefinedString(lineObject['ShippingProvince']);
            			countryCode = ImportUtils.getDefinedString(lineObject['BillingCountry']);
            			phone = ImportUtils.getDefinedString(lineObject['ShippingPhone']);        			
            			storeId = "";
            			shippingMethodId = getShipingMethodId(ImportUtils.getDefinedString(lineObject['ShippingMethodId']));
            			
            			orderTotal = new Number(ImportUtils.getDefinedString(lineObject["OrderTotal"]));
            			orderSubtotal = new Number(ImportUtils.getDefinedString(lineObject["SubTotal"]));
            			orderTax = new Number(ImportUtils.getDefinedString(lineObject["TotalTax"]));
            			shipTotal = new Number(ImportUtils.getDefinedString(lineObject["ShippingFee"]));
            			merchTotal = orderTotal - shipTotal;
            		} catch (e) {
            			mainCaller.error(e);
            		}
        		} else {
        			merchTotal = shipments.get(shipmentId).merchTotal;
        			orderTotal = merchTotal;
        			storeId = shipments.get(shipmentId).storeId;
        			
        			var store = StoreMgr.getStore(storeId);
        			
        			if (!empty(store)) {
        				firstName = store.name;
        				address1 = store.address1;
        				address2 = store.address2;
        				city = store.city;
        				postalCode = store.postalCode;
        				stateCode = store.stateCode;
        				countryCode = store.countryCode;
        				phone = store.phone;        			
        			} else {
        				Logger.error("Store not found: {0}", storeId);
        				firstName = "Store " + storeId;
        			}
        		}
        		
        		writeShipment(xmlStream, shipmentId, shippingMethodId, firstName, lastName, address1, address2, city, postalCode, stateCode, countryCode, phone, merchTotal, shipTotal, orderTotal, storeId)
        	}
        xmlStream.writeEndElement();

        
		var orderTotal = 0;
		var orderTax = 0;
		var orderSubtotal = 0;
		var shipTotal = 0;
		var merchTotal = 0;
		try {
			orderTotal = new Number(ImportUtils.getDefinedString(lineObject["OrderTotal"]));
			orderSubtotal = new Number(ImportUtils.getDefinedString(lineObject["SubTotal"]));
			orderTax = new Number(ImportUtils.getDefinedString(lineObject["TotalTax"]));
			shipTotal = new Number(ImportUtils.getDefinedString(lineObject["ShippingFee"]));
			merchTotal = orderTotal - shipTotal;
		} catch (e) {
			mainCaller.error(e);
		}
        
		xmlStream.writeStartElement("totals");
			xmlStream.writeStartElement("merchandize-total");
				ImportUtils.createXMLElement(xmlStream, "net-price", merchTotal.toFixed(2));
				ImportUtils.createXMLElement(xmlStream, "tax", "0.0");
				ImportUtils.createXMLElement(xmlStream, "gross-price", merchTotal.toFixed(2));
			xmlStream.writeEndElement();
			xmlStream.writeStartElement("adjusted-merchandize-total");
				ImportUtils.createXMLElement(xmlStream, "net-price", merchTotal.toFixed(2));
				ImportUtils.createXMLElement(xmlStream, "tax", "0.0");
				ImportUtils.createXMLElement(xmlStream, "gross-price", merchTotal.toFixed(2));
			xmlStream.writeEndElement();
			xmlStream.writeStartElement("shipping-total");
				ImportUtils.createXMLElement(xmlStream, "net-price", shipTotal.toFixed(2));
				ImportUtils.createXMLElement(xmlStream, "tax", "0.0");
				ImportUtils.createXMLElement(xmlStream, "gross-price", shipTotal.toFixed(2));
			xmlStream.writeEndElement();
			xmlStream.writeStartElement("adjusted-shipping-total");
				ImportUtils.createXMLElement(xmlStream, "net-price", "0.0");
				ImportUtils.createXMLElement(xmlStream, "tax", "0.0");
				ImportUtils.createXMLElement(xmlStream, "gross-price", "0.0");
			xmlStream.writeEndElement();
			xmlStream.writeStartElement("order-total");
				ImportUtils.createXMLElement(xmlStream, "net-price", orderSubtotal.toFixed(2));
				ImportUtils.createXMLElement(xmlStream, "tax", orderTax.toFixed(2));
				ImportUtils.createXMLElement(xmlStream, "gross-price", orderTotal.toFixed(2));
			xmlStream.writeEndElement();
		xmlStream.writeEndElement();
        
        
	xmlStream.writeEndElement();
    	
};

function addMonogram(monograms, xmlStream) {
	
	var monogramDataOnPLI = [];

	for each (var monogram in monograms) {
		if (!empty(monogram)) {
			var monogramValues = monogram.split("|");
			var monogramPliIndex = 0;
			
			if (empty(monogramValues[1])) {
				continue;
			}
			
			while (monogramPliIndex < monogramValues.length) {
				var monogramPLI = {};
				for (var i = 0; i < monogramFields.length; i++) {
					if (!empty(monogramValues[monogramPliIndex + i])) {
						var fieldName = monogramFields[i].toString(); 
						monogramPLI[fieldName] = monogramValues[monogramPliIndex + i];
					}
				}
				var pliPushed = false;
				
				if (!empty(monogramPLI["productType"]) && monogramPLI["productType"].indexOf("PREMIUM") > -1) {
					
					var letters = monogramPLI["vasField1"].split(" ");
					var letterCodes = monogramPLI["productCode"].split("_");
					monogramPLI["productCode"] = "";

					var basePrice = monogramPLI["basePrice"];
					var totalPrice = monogramPLI["totalPrice"];
					var sumTaxValues = monogramPLI["sumTaxValues"];

					delete monogramPLI["basePrice"];
					delete monogramPLI["totalPrice"];
					delete monogramPLI["sumTaxValues"];

					var letterCodeIndex = 0;
					for (var j = 0; j < letters.length; j++) {
						if (empty(letters[j])) {
							continue;
						}
						
						var monogramLetter = {};
						monogramLetter["productCode"] = letterCodes[letterCodeIndex];
						letterCodeIndex++;
						
						monogramLetter["productType"] = monogramPLI["productType"];
						monogramLetter["quantity"] = monogramPLI["quantity"];
						monogramLetter["productName"] = letters[j];
						monogramLetter["basePrice"] = basePrice;
						monogramLetter["totalPrice"] = totalPrice;
						monogramLetter["sumTaxValues"] = sumTaxValues;
						
						
						if (!pliPushed) {
							monogramDataOnPLI.push(monogramPLI);
							pliPushed = true;
						}
						
						monogramDataOnPLI.push(monogramLetter);
					}
				}
				
				if (!pliPushed) {
					monogramDataOnPLI.push(monogramPLI);
					pliPushed = true;
				}
				
				monogramPliIndex += monogramFields.length;
			}
			
		}
	}

	if (monogramDataOnPLI.length > 0) {
		xmlStream.writeStartElement("custom-attribute");
			xmlStream.writeAttribute("attribute-id", "monogramDataOnPLI");
			xmlStream.writeCharacters(JSON.stringify(monogramDataOnPLI));
		xmlStream.writeEndElement();
	}
	
}

function getShipingMethodId(shipId) {
	var shipMap = SHIP_US_MAP;
	if (Site.current.ID == "tumi-ca") {
		shipMap = SHIP_CA_MAP;
	}
	
	var shipMapId = shipMap[shipId];
	
	if (shipMapId == null) {
		if (Site.current.ID == "tumi-ca") {
			shipMapId = "standard-international-shipping-net";
		} else {
			shipMapId = "standard-ground-net";			
		}
	}
	
	return shipMapId;
}

function getXMLStreamWriter(fileWriter) {
	
	var xsw : XMLStreamWriter = new XMLIndentingStreamWriter(fileWriter);
	xsw.writeStartDocument();
	xsw.writeStartElement("orders");
	xsw.writeAttribute("xmlns", "http://www.demandware.com/xml/impex/order/2006-10-31");

	return xsw;
};

function closeXMLStreamWriter(fileWriter, xsw) {
	xsw.writeEndElement();
	xsw.writeEndDocument();
	xsw.flush();
	xsw.close();
	fileWriter.close();	
};

function updateShipment(shipments, lineObject, i) {
	var shipId = "MYSHIP";
	
	if (!empty(ImportUtils.getDefinedString(lineObject['StoreId' + i]))) {
		shipId = "SHIP" + ImportUtils.getDefinedString(lineObject['StoreId' + i]);
	}
	
	var shipment = shipments.get(shipId);
	var merchTotal = 0;
	var salePrice = new Number(ImportUtils.getDefinedString(lineObject["SalePrice" + i]));
	var qty = new Number(ImportUtils.getDefinedString(lineObject["ProductQuantity" + i]));
	
	if (shipment == null) {
		shipment = {};
		shipment.storeId = ImportUtils.getDefinedString(lineObject['StoreId' + i]);
	} else {
		merchTotal = shipment.merchTotal;
	}
	
	merchTotal += salePrice * qty;
	
	shipment.merchTotal = merchTotal;
	shipments.put(shipId, shipment);
	
	return shipId;
}

function writeShipment(xmlStream, shipmentId, shippingMethodId, firstName, lastName, address1, address2, city, postalCode, stateCode, countryCode, phone, merchTotal, shipTotal, orderTotal, storeId) {
	xmlStream.writeStartElement("shipment");
	
		xmlStream.writeAttribute("shipment-id", shipmentId);
		xmlStream.writeStartElement("status");
			ImportUtils.createXMLElement(xmlStream, "shipping-status", "SHIPPED");
		xmlStream.writeEndElement();
	
		ImportUtils.createXMLElement(xmlStream, "shipping-method", shippingMethodId);
	
		xmlStream.writeStartElement("shipping-address");
			ImportUtils.createXMLElement(xmlStream, "first-name", firstName);
			ImportUtils.createXMLElement(xmlStream, "last-name", lastName);
			ImportUtils.createXMLElement(xmlStream, "address1", address1);
			ImportUtils.createXMLElement(xmlStream, "address2", address2);
			ImportUtils.createXMLElement(xmlStream, "city", city);
			ImportUtils.createXMLElement(xmlStream, "postal-code", postalCode);
			ImportUtils.createXMLElement(xmlStream, "state-code", stateCode);
			ImportUtils.createXMLElement(xmlStream, "country-code", countryCode);
			ImportUtils.createXMLElement(xmlStream, "phone", phone);        			
		xmlStream.writeEndElement();
	
		xmlStream.writeStartElement("totals");
			xmlStream.writeStartElement("merchandize-total");
				ImportUtils.createXMLElement(xmlStream, "net-price", merchTotal.toFixed(2));
				ImportUtils.createXMLElement(xmlStream, "tax", "0.0");
				ImportUtils.createXMLElement(xmlStream, "gross-price", merchTotal.toFixed(2));
			xmlStream.writeEndElement();
			
			xmlStream.writeStartElement("adjusted-merchandize-total");
				ImportUtils.createXMLElement(xmlStream, "net-price", merchTotal.toFixed(2));
				ImportUtils.createXMLElement(xmlStream, "tax", "0.0");
				ImportUtils.createXMLElement(xmlStream, "gross-price", merchTotal.toFixed(2));
			xmlStream.writeEndElement();
			xmlStream.writeStartElement("shipping-total");
				ImportUtils.createXMLElement(xmlStream, "net-price", shipTotal.toFixed(2));
				ImportUtils.createXMLElement(xmlStream, "tax", "0.0");
				ImportUtils.createXMLElement(xmlStream, "gross-price", shipTotal.toFixed(2));
			xmlStream.writeEndElement();
			xmlStream.writeStartElement("adjusted-shipping-total");
				ImportUtils.createXMLElement(xmlStream, "net-price", "0.0");
				ImportUtils.createXMLElement(xmlStream, "tax", "0.0");
				ImportUtils.createXMLElement(xmlStream, "gross-price", "0.0");
			xmlStream.writeEndElement();
			xmlStream.writeStartElement("shipment-total");
				ImportUtils.createXMLElement(xmlStream, "net-price", orderTotal.toFixed(2));
				ImportUtils.createXMLElement(xmlStream, "tax", "0.0");
				ImportUtils.createXMLElement(xmlStream, "gross-price", orderTotal.toFixed(2));
			xmlStream.writeEndElement();
		xmlStream.writeEndElement();

		if (!empty(storeId)) {
			xmlStream.writeStartElement("custom-attributes");
				ImportUtils.createCustomXMLAttribute(xmlStream, "fromStoreId", storeId);
			xmlStream.writeEndElement();
		}
	
	xmlStream.writeEndElement();
}
