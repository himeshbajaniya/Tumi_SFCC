'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var Mail = require('dw/net/Mail');
var Site = require('dw/system/Site');

function subscribe(contactDetails) {
    // var contactDetails = [myForm.contactFirstName, myForm.contactLastName, myForm.contactEmail, myForm.contactTopic, myForm.contactComment];
    var firstName = arguments[0];
    var lastName = arguments[1];
    var contactEmail = arguments[2];
    var contactSubject = arguments[3];
    var contactMessage = arguments[4];
    var contactPhone = arguments[5];

    var template =Template('contactUs/sendConatctUsEmail');

    var o = new HashMap();
    o.put("firstName", firstName);
    o.put("lastName", lastName);
    o.put("contactEmail", contactEmail);
    o.put("contactSubject", contactSubject);
    o.put("contactMessage", contactMessage);
    if(contactPhone!='undefined'){
        o.put("contactPhone", contactPhone);
    }

    var text = template.render(o);

    var mail = new Mail();
    mail.addTo(Site.getCurrent().getCustomPreferenceValue('contactUsEmail'));
    mail.setFrom(contactEmail);
    mail.setSubject("Customer Care");
    mail.setContent(text);
    mail.send();

}

module.exports = {
    subscribe: subscribe
};