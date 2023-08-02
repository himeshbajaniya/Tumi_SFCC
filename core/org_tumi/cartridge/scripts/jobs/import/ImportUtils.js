importPackage(dw.system);
importPackage(dw.util);


function getDefinedString(value, len, encode) {
    if(empty(value)){
        return '';
    } else {
        value = value.toString().replace(/[^\x00-\x7F]/g,' ');
        value = value.trim();
        if (encode) {
        	value = dw.util.StringUtils.encodeString(value, dw.util.StringUtils.ENCODE_TYPE_XML).trim();
        }
        
        if (len) {
        	return value.substring(0, len);
        }
        return value;
    }
};

function createCustomAttribute(xmlParent, attrName, attrValue, encode) {
	if (empty(attrValue)) {
		return;
	}
	
	xmlParent["custom-attributes"] +=
		<custom-attribute attribute-id={attrName}>{getDefinedString(attrValue, false, encode)}</custom-attribute>;
};

function createCustomXMLAttribute(xmlStream, attrName, attrValue, encode) {
	if (empty(attrValue)) {
		return;
	}

	xmlStream.writeStartElement("custom-attribute");
		xmlStream.writeAttribute("attribute-id", attrName);
		xmlStream.writeCharacters(getDefinedString(attrValue, false, encode));
	xmlStream.writeEndElement();
	
};

function createXMLElement(xmlStream, elemName, elemValue) {
	if (empty(elemValue)) {
		return;
	}

	xmlStream.writeStartElement(elemName);
		xmlStream.writeCharacters(elemValue);
	xmlStream.writeEndElement();
	
};


function getDateString(dt, onlyDate) {

    if (dt != '') {
    	
    
	    var dateCalendar = System.getCalendar();
	    var d = dt.split("-");
	    
	    //dateCalendar.setTimeZone("EST");
	    dateCalendar.set(Calendar.HOUR_OF_DAY, 0);
	    dateCalendar.set(Calendar.MINUTE, 0);
	    dateCalendar.set(Calendar.SECOND, 0);
	    dateCalendar.set(Calendar.MILLISECOND, 0);
	    
	    dateCalendar.set(Calendar.YEAR, parseInt(d[2]));
	    dateCalendar.set(Calendar.MONTH, parseInt(d[0]) - 1);
	    dateCalendar.set(Calendar.DAY_OF_MONTH, parseInt(d[1]));
	    
	    var s = new Date(dateCalendar.getTime());

        if (onlyDate) {
            return s.toISOString().split('T')[0] + 'Z';
        } else {
            return s.toISOString();
        }
	    
    }

    return '';
};


function getLineAddressId(firstName, lastName, city, index) {
	if (!empty(city)) {
		return city + index;
	}
	
	if (!empty(firstName) && !empty(lastName)) {
		return firstName + lastName + index;
	}
	
	return UUIDUtils.createUUID() + index;
};

module.exports = {
		getDefinedString: getDefinedString,
		createCustomAttribute : createCustomAttribute,
		createCustomXMLAttribute : createCustomXMLAttribute,
		getDateString : getDateString,
		getLineAddressId : getLineAddressId,
		createXMLElement : createXMLElement
	};
