'use strict';
var processInclude = require('base/util');
var Handlebars = require('handlebars/dist/handlebars');
var rfkService = require('../reflektion/rfkService');
var handlebarHelpers = require('../handleBar/handleBarHelpers');
var bookmark = require('./bookmark');
// processInclude(require('../product/compare'));

function updateBestSeller(productTileData) {
    handlebarHelpers.getHandlebarHelpers();
    var template = Handlebars.compile($('#producttile-handlebar').html());
    const templateScript = template(productTileData);
    var productSkuForBestSeller = $('.home-best-seller-container').attr('home-best-seller-pid').split(',');
    let productTileArr = $(templateScript).filter('div.ctnr-product-item');
    let classNamePrefix = '.home-best-seller-tile';
    for (let j = 0; j < productTileArr.length; j++) {
        if (j == 0) {
            $('.home-best-seller-container .image-wrapper').html(productTileArr[j]);
            let heroImageURL = $('.home-best-seller-container').attr('home-hero-image-url');
            let imageEle = $('.image-wrapper .image-container .primary-image img')[j] 
            if (heroImageURL) {
                imageEle.src = heroImageURL;
            }
            else {
                var imgUrl = imageEle.src;
                var params = new URL(imgUrl);
                params.searchParams.set('wid','647');
                params.searchParams.set('hei','1012');
                imageEle.src =params.href;
            }

        } else {
            $(classNamePrefix + '-' + (j)).html(productTileArr[j]);
        }
    }

    $('.home-best-seller-container .ctnr-product-item').removeClass('col-6 col-sm-4');
    bookmark.getWishlistItem();
}

function getProductTilesDataUsingPids(listOfPId) {
    rfkService.getProductDataFromRfkUsingProductGroup(listOfPId).then(function (productTileData) {
        // Run this when your request was successful
        updateBestSeller(productTileData);
    }).catch(function (err) {
        // Run this when promise was rejected via reject()
        console.log(err)
    })
}

function getProductTilesDataUsingRfkId(rfkId) {
    rfkService.getProductDataUsingRfkID(rfkId).then(function (productTileData) {
        // Run this when your request was successful
        updateBestSeller(productTileData);
    }).catch(function (err) {
        // Run this when promise was rejected via reject()
        console.log(err)
    })
}

module.exports = {

    collectionBestSellerComponent: function () {
        let $el = $('.home-best-seller-container');
        if ($el.length) {
            const config = {
                rootMargin: '0px',
                threshold: 0
            };
            let observer = new IntersectionObserver((entry) => {
                if (entry[0].isIntersecting) {
                    var rfkId = $('.home-best-seller-container').attr('home-best-seller-rfkid');
                    if (rfkId !== '') {
                        getProductTilesDataUsingRfkId(rfkId);
                    } else {
                        var productSkuForBestSeller = $('.home-best-seller-container').attr('home-best-seller-pid').split(',');
                        getProductTilesDataUsingPids(productSkuForBestSeller);
                    }
                }
            }, config);
            observer.observe($el[0]);
        }
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
    }
}
