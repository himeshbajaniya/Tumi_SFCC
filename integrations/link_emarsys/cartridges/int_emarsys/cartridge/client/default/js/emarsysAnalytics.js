'use strict';

var analyticsData = false;

if (window.emarsysAnalyticsData) {
    analyticsData = window.emarsysAnalyticsData.emarsysAnalytics;
} else if (window.pageContext) {
    analyticsData = window.pageContext.analytics;
}

window.ScarabQueue = window.ScarabQueue || [];

/**
 * @description create new array for save analytics data
 */
function initScarabQueue() {
    ((function (subdomain, id) {
        if (document.getElementById(id)) {
            return;
        }
        var js = document.createElement('script');
        js.id = id;
        js.src = subdomain + '.scarabresearch.com/js/' + analyticsData.predictMerchantID + '/scarab-v2.js';
        var fs = document.getElementsByTagName('script')[0];
        fs.parentNode.insertBefore(js, fs);
    })(document.location.protocol === 'https:' ? 'https://recommender' : 'http://cdn', 'scarab-js-api'));
}

/**
 * @description an overlay is applied to the button to send analytics
 */
function initQuickViewAnalytics() {
    if (analyticsData.isEnableEmarsys) {
        var targetElement = analyticsData.isSFRA ? '.product' : '.product-tile';
        var targetData = analyticsData.isSFRA ? 'pid' : 'itemid';

        $(targetElement).on('click', '.quickview', function () {
            window.ScarabQueue.push(['view', $(this).closest(targetElement).data(targetData)]);
            window.ScarabQueue.push(['go']);
        });
    }
}
/**
 * @description an overlay is applied to the button to send analytics
 */
function initAddItemToCart() {
    if (analyticsData.isSFRA) {
        $('body').on('product:afterAddToCart', function () {
            $.ajax({
                url: EmarsysUrls.emarsysAddToCartAjax
            }).done(function (data) {
                if (data) {
                    window.ScarabQueue.push(['cart', data.cartObj]);
                    window.ScarabQueue.push(['go']);
                }
            });
        });
    }
}

/**
 * @description function generates ScarabQueue array for emarsys analytics
 */
function addPageData() {
    var customerData = analyticsData.customerData;

    if (analyticsData.isEnableEmarsys && analyticsData.isAnalyticPage) {
        window.ScarabQueue.push(['availabilityZone', analyticsData.locale]);
        window.ScarabQueue.push(['cart', analyticsData.currentBasket]);

        if (customerData.isCustomer) {
            if (customerData.customerEmail) {
                window.ScarabQueue.push(['setEmail', customerData.customerEmail]);
            } else {
                window.ScarabQueue.push(['setCustomerId', customerData.customerNo]);
            }
        } else if (analyticsData.pageType === 'orderconfirmation') {
            window.ScarabQueue.push(['setEmail', customerData.guestEmail]);
        }
        if (analyticsData.nameTracking && analyticsData.trackingData) {
            window.ScarabQueue.push([analyticsData.nameTracking, analyticsData.trackingData]);
        }
        if (analyticsData.logic) {
            window.ScarabQueue.push(['recommend', {
                logic: analyticsData.logic,
                containerId: 'predict-recs'
            }]);
        }

        window.ScarabQueue.push(['go']);
    }
}

module.exports = {
    init: function () {
        if (analyticsData.isEnableEmarsys) {
            initScarabQueue();
            addPageData();
            initQuickViewAnalytics();
            initAddItemToCart();
        }
    }
};
