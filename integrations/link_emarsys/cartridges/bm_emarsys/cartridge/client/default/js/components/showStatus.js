'use strict';

/**
 * @description show status for user
 * @param {string} typeNotify type notification
 * @param {string} responseText response message
 */
module.exports = function (typeNotify, responseText) {
    var notifications = $('.js-notification-message');

    if (typeNotify) {
        var notifyElement = $('.js-' + typeNotify + '-message');

        notifications.removeClass('js-d-flex');
        $(notifyElement).addClass('js-d-flex');

        if (responseText) {
            notifications.find('.js-body-' + typeNotify + '-message').text('');
            $(notifyElement).find('.js-body-' + typeNotify + '-message').text(responseText);
        }

        $('body,html').animate({ scrollTop: 0 }, 250);
    } else {
        notifications.removeClass('js-d-flex');
        notifications.find('.js-body-' + typeNotify + '-message').text('');
    }
};
