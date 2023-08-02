/**
* Controller that renders Reflektion beacon template, sets global variables,
* adds event tracking for logged in users and cart view
*
* @module  controllers/Reflektion
*/

'use strict';

var app = require('*/cartridge/scripts/app');
var guard = require('*/cartridge/scripts/guard');
var BasketMgr = require('dw/order/BasketMgr');

/**
 *  Render Reflektion beacon JavaScript
 *  Also trigger user login and push cart events as needed.
 */
function beacon() {
    var rfkEnabled = require('*/cartridge/scripts/reflektionHelper').getRFKEnabled();
    if (!rfkEnabled) {
        return;
    }

    var loggedIn = session.privacy.loggedIn; // eslint-disable-line no-undef
    if (!loggedIn && customer.registered) { // eslint-disable-line no-undef
        session.privacy.loggedIn = true; // eslint-disable-line no-undef
    } else {
        if (loggedIn && !customer.registered) { // eslint-disable-line no-undef
            session.privacy.loggedIn = false; // eslint-disable-line no-undef
        }
        customer = null; // eslint-disable-line no-undef
    }

    var currentBasket = BasketMgr.getCurrentBasket();
    var pushCart = request.httpParameterMap.pushCart; // eslint-disable-line no-undef
    app.getView({
        customer: customer, // eslint-disable-line no-undef
        currentBasket: currentBasket,
        pushCart: pushCart
    }).render('reflektion/beacon');
}

exports.Beacon = guard.ensure(['get'], beacon);
