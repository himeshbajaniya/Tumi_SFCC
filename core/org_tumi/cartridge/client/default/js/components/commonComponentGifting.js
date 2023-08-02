'use strict';
var Handlebars = require('handlebars/dist/handlebars');
var rfkService = require('../reflektion/rfkService');
var handlebarHelpers = require('../handleBar/handleBarHelpers');
var bookmark = require('./bookmark');


function updateGiftingProductList(productTileData) {

    handlebarHelpers.getHandlebarHelpers();
    var template = Handlebars.compile($('#producttile-handlebar').html());
    const templateScript = template(productTileData);
    var productSkuForBestSeller = $('.gifting-poduct-list-container .nav-link.categories-prev.active').attr('data-best-seller-pid').split(',');
    let productTileArr = $(templateScript).filter('div.ctnr-product-item');
    let classNamePrefix = '.active .gifting-poduct-list-tile';
    for (let j = 0; j < productTileArr.length; j++) {
        $(classNamePrefix + '-' + (j + 1)).html(productTileArr[j]);
    }
    $('.ctnr-product-item').removeClass('col-6 col-sm-4');
    bookmark.getWishlistItem();
}


function getProductTilesDataGiftingProductListUsingPids(listOfPId) {
    rfkService.getProductDataFromRfkUsingProductGroup(listOfPId).then(function (productTileData) {
        // Run this when your request was successful
        updateGiftingProductList(productTileData);
    }).catch(function (err) {
        // Run this when promise was rejected via reject()
        console.log(err)
    })
}

function getProductTilesDataGiftingProductListUsingRfkId(rfkId) {
    rfkService.getProductDataUsingRfkID(rfkId).then(function (productTileData) {
        // Run this when your request was successful
        updateGiftingProductList(productTileData);
    }).catch(function (err) {
        // Run this when promise was rejected via reject()
        console.log(err)
    })
}

module.exports = {
    callSwiper: function(){
        var swiper = new Swiper(".gifting-premium-service-swiper", {
            slidesPerView: "2.5",
            spaceBetween: 16,
    
            breakpoints: {
                768: {
                    slidesPerView: "3",
                },
                1024: {
                    slidesPerView: "3",
                },
            },
        });
       },

    giftingProductListComponent: function () {
        let $el = $('.gifting-poduct-list-container');

        if ($el.length) {
            const config = {
                rootMargin: '0px',
                threshold: 0
            };
            let observer = new IntersectionObserver((entry) => {
                if (entry[0].isIntersecting) {
                    Handlebars.registerHelper('isUrl', function (str1, str2, suffix) {
                        if (typeof str1 === 'string' && typeof str2 === 'string' && typeof suffix === 'string') {
                            return str1 + str2 + suffix;
                        }
                        return str1;
                    });
                    var rfkId = $('.gifting-poduct-list-container .nav-link.categories-prev.active').attr('data-best-seller-rfkid'); 
                    if (rfkId !== '') {
                        getProductTilesDataGiftingProductListUsingRfkId(rfkId);
                    } else {
                        var productSkuForBestSeller = $('.best-seller-container .nav-link.categories-prev.active').attr('data-best-seller-pid').split(',');
                        getProductTilesDataGiftingProductListUsingPids(productSkuForBestSeller);
                    }
                }
            }, config);
            observer.observe($el[0]);
        }
    },

    attachEventlistener: function () {
        $(document).on('click', '.gifting-poduct-list-component .nav-link:not(".dom-created")', function () {
            var rfkId = $(this).attr('data-best-seller-rfkid');
            if (rfkId !== '') {
                getProductTilesDataGiftingProductListUsingRfkId(rfkId);
            } else {
                var productSkuForBestSeller = $(this).attr('data-best-seller-pid').split(',');
                getProductTilesDataGiftingProductListUsingPids(productSkuForBestSeller);
            }
            $(this).addClass('dom-created');
        })
    },

    buildRfkRequestObject: function buildRfkRequestObject() {
        var collectionLandingPage = $('.collection-landing-page');
        if (collectionLandingPage.length > 0) {
            $.spinner().start();
            var rfkLookUpUrl = $('#rfkLookUpUrl').val();
            $.ajax({
                url: rfkLookUpUrl,
                method: 'GET',
                success: function (data) {
                    sessionStorage.setItem('productLookUpRequestData', data.contentLookRFkRequestData);
                    sessionStorage.setItem('reflktionUrl', data.reflktionUrl);
                    var reflektionHeaders = JSON.stringify(data.headers);
                    sessionStorage.setItem('reflektionHeaders', reflektionHeaders);
                    $.spinner().stop();
                },
                error: function () {
                    console.log('error');
                    $.spinner().stop();
                }
            });
        }
    },
};