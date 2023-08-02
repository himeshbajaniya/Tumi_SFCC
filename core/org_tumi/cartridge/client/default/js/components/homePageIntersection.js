"use strict";
var contentBanner = require('../components/content-banner');
var storeLocator = require('../storeLocator/storeLocator');
var reflection = require('../reflektionCarousel')

module.exports = {
    loadHomePageSlots: function () {
        let $el = $('#homePageOne');
        if ($el.length) {
            const config = {
                rootMargin: '0px',
                threshold: 0
            };
            let observer = new IntersectionObserver((entry, self) => {
                if (entry[0].isIntersecting) {
                    if (!($('#homePageOne').hasClass('homeSlotsLoaded'))) {
                        $('#homePageOne').addClass('homeSlotsLoaded');
                        var url = $('#homePageOne').data('url');
                        if (url) {
                            $.spinner().start();
                            $.ajax({
                                url: url,
                                type: 'get',
                                success: function (data) {
                                    $(data).insertAfter($('#homePageOne'));
                                    observer.unobserve($el[0]);
                                    contentBanner.contentBanner();
                                    storeLocator.storeLocator();
                                    reflection.reflectionCarousel();
                                    $.spinner().stop();
                                },
                                error: function () {
                                    observer.unobserve($el[0]);
                                    $.spinner().stop();
                                }
                            });
                        }
                    }
                }
            }, config);
            observer.observe($el[0]);
        }
    }
};