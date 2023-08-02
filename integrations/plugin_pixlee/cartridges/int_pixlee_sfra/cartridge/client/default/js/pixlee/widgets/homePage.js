'use strict';

/* global Pixlee */

module.exports = function () {
    var $pixleeContainer = $('#pixlee_container');
    if (pageContext.type === 'homepage') {
        if ($pixleeContainer.length) {
            var apiKey = $pixleeContainer.data('apikey');
            var widgetId = $pixleeContainer.data('widgetid');
            var accountId = $pixleeContainer.data('accountid');
    
            window.PixleeAsyncInit = function () {
                Pixlee.init({ apiKey: apiKey });
                Pixlee.addProductWidget({
                    accountId: accountId,
                    widgetId: widgetId,
                    ecomm_platform: 'demandware',
                    subscribedEvents: ['widgetLoaded'],
                    getCookieConsent: true
                });
    
                if ($('#pixlee-events-init').length) { // presence of this element in the DOM means tracking is allowed
                    Pixlee.acceptCookiePolicy();
                }
            };
    
            $.getScript('//assets.pxlecdn.com/assets/pixlee_widget_1_0_0.js');
    
        }
    }
    if ($pixleeContainer.length) {
        function pixleeLoadedReceiveMessage(event) {
            // only listen to events coming from Pixlee
            if (event.data) {
                try {
                    var message = JSON.parse(event.data);
                } catch (error) {
                    return;
                }
            } else {
                return;
            }
            if (message.eventName && message.eventName === 'widgetLoaded') {
                $pixleeContainer.addClass('pixlee-container');
            }
        }
        window.addEventListener("message", pixleeLoadedReceiveMessage, false);
    }
};
