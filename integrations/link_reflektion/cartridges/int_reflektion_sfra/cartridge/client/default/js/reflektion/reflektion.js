'use strict';

var base = require('base/product/base');

module.exports = {
    reflektion: function () {
        if (typeof rfkDomain !== 'undefined') {
            $('body').on('product:afterAddToCart', function (data) { //eslint-disable-line
                var pid = base.getPidValue($(this)); //eslint-disable-line
                var name = 'pdp';
                if ($(this).attr('class') === 'modal-open') { //eslint-disable-line
                    name = 'qview';
                }
                var rfk = window.rfk || [];
                rfk.push(["trackEvent", { //eslint-disable-line
                    type: "a2c", //eslint-disable-line
                    name: name,
                    value: {
                        products: [{
                            sku: pid
                        }],
                        dn: rfkDomain, //eslint-disable-line
                        locale: {
                            lg: rfkLanguage, //eslint-disable-line
                            co: rfkCountry, //eslint-disable-line
                            cy: rfkCurrency //eslint-disable-line
                        }
                    }
                }]);
            });

            $('body').on('cart:update', function () { //eslint-disable-line
                $.ajax({ //eslint-disable-line
                    url: cartGetURL, //eslint-disable-line
                    method: 'GET',
                    success: function (data) {
                        var pids = [];
                        for (var i = 0; i < data.items.length; i += 1) {
                            pids.push({ sku: data.items[i].id });
                        }
                        var rfk = window.rfk || [];
                        rfk.push(["trackEvent", { //eslint-disable-line
                            type: "status", //eslint-disable-line
                            name: "cart", //eslint-disable-line
                            value: {
                                products: pids,
                                dn: rfkDomain, //eslint-disable-line
                                locale: {
                                    lg: rfkLanguage, //eslint-disable-line
                                    co: rfkCountry, //eslint-disable-line
                                    cy: rfkCurrency //eslint-disable-line
                                }
                            }
                        }]);
                    },
                    error: function (err) {
                        console.log(err); // eslint-disable-line no-console
                    }
                });
            });
        }
    }
};
