'use strict';

var processInclude = require('base/util');

/**
 * Checking user input email is valid or not
 * @param {string} email - user input email
 * @return {boolean} - If email is valid, return true if not return false.
 */
function validateEmail(email) {
    // check length
    if (!email) return false;
    var emailParts = email.split('@');
    // check email should have only two part local account name and domain
    if (emailParts.length !== 2) return false;
    // allowed local part length 64 and domain 255
    var local = emailParts[0];
    var domain = emailParts[1];
    if (local.length > 64) {
        return false;
    } if (domain.length > 255) {
        return false;
    }
    // regex validation based on RFC 5322 reccomendation
    var emailRegEx = /^[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
    if (!emailRegEx.test(email)) return false;
    return true;
}

$(document).ready(function () {
    processInclude(require('base/contactUs/contactUs'));

    $(document).on('click', '.subscribe-contact-us', function () {
        var email = $('#contact-email').val();
        var validEmail = validateEmail(email);
        if (validEmail) {
            window.dataLayer = window.dataLayer || [];
            var dataLayerJson = window.dataLayer[0];
            dataLayerJson.contactUsEmail = email;
        }
    });
    $(document).on('click', '.open-chat', function (e) {
        e.preventDefault();
        $('#gladlyChatDragHandle').click();
    });
});
