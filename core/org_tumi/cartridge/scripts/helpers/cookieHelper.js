/* global request response */
'use strict';

/* API Modules */
var Cookie = require('dw/web/Cookie');

/* variables */
var MAX_AGE = 86400; // 1 day in seconds

/**
 * gets a cookie value
 * @param {string} cookieName - the name of the cookie value to return
 * @return {string} returns the cookie value or null
 */
function getCookie(cookieName) {
    if (!cookieName) return null;

    var httpCookies = request ? request.getHttpCookies() : {};
    if (httpCookies && Object.hasOwnProperty.call(httpCookies, cookieName) && httpCookies[cookieName].value) {
        return httpCookies[cookieName].value;
    }

    return null;
}

/**
 * sets a cookie value
 * @param {string} cookieName - the name of the cookie
 * @param {string} cookieValue - the value of the cookie
 * @param {integer} maxAge - the max age in seconds of the cookie
 */
function setCookie(cookieName, cookieValue, maxAge) {
    if (!cookieName || !cookieValue) return;

    if (!maxAge) {
        maxAge = MAX_AGE; // eslint-disable-line no-param-reassign
    }

    // make sure we're not going to violate the api.cookie.maxValueLength - warnings start at 1,200, limit at 2,000
    var stringLimit = 1150;
    if (cookieValue.length < stringLimit) {
        var cookie = new Cookie(cookieName, cookieValue);
        cookie.setMaxAge(maxAge);
        cookie.setPath('/');

        response.addHttpCookie(cookie);
    }
}

/**
 * gets a cookie
 * @param {string} cookieName - the name of the cookie
 * @returns {string} returns the cookie itself or null
 */
function getCookieFromRequest(cookieName) {
    if (!cookieName) return null;

    var httpCookies = request ? request.getHttpCookies() : {};
    if (httpCookies && Object.hasOwnProperty.call(httpCookies, cookieName) && httpCookies[cookieName].value) {
        return httpCookies[cookieName];
    }

    return null;
}

/**
 * sets a cookie in response
 * @param {Object} cookie - the cookie itself
 */
function setCookieInResponse(cookie) {
    if (response && cookie) {
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath('/');
        response.addHttpCookie(cookie);
    }
}

/**
 * deletes a cookie value
 * @param {string} cookieName - the name of the cookie
 */
function deleteCookie(cookieName) {
    if (!cookieName) return;

    var cookie = new Cookie(cookieName, null);
    cookie.setMaxAge(0);
    cookie.setPath('/');
    response.addHttpCookie(cookie);
}

/**
 * set the cookie without expiration date and time
 * @param {string} cookieName - the name of the cookie
 * @param {string} cookieValue - the value of the cookie
 */
function setCookieWithoutExpiration(cookieName, cookieValue) {
    if (!cookieName || !cookieValue) return;
    var cookie = new Cookie(cookieName, cookieValue);
    cookie.setPath('/');

    response.addHttpCookie(cookie);
}


module.exports = {
    getCookie: getCookie,
    setCookie: setCookie,
    setCookieWithoutExpiration: setCookieWithoutExpiration,
    deleteCookie: deleteCookie,
    getCookieFromRequest: getCookieFromRequest,
    setCookieInResponse: setCookieInResponse
};
