'use strict';
var Handlebars = require('handlebars/dist/handlebars');
var rfkService = require('../reflektion/rfkService');
var handlebarHelpers = require('../handleBar/handleBarHelpers');
var bookmark = require('./bookmark');

function updateCollectionLookComponent(productTileData) {
    handlebarHelpers.getHandlebarHelpers();
    var template = Handlebars.compile($('#producttile-handlebar').html());
    const templateScript = template(productTileData);
    let lookProductTileArr = $(templateScript).filter('div.ctnr-product-item');
    let lookClassNamePrefix = ".look-comp-product-tile";

    for (let j = 0; j < lookProductTileArr.length; j++) {
        if($('.look-comp-product-tile-1').length > 0){
            $(lookClassNamePrefix + '-' + (j + 1)).html(lookProductTileArr[j]);
        }
        else {
            $(lookClassNamePrefix + '-' + (j + 2)).html(lookProductTileArr[j]);
        }
        
    }
    $('.look-component-container .ctnr-product-item').removeClass('col-6 col-sm-4');
    bookmark.getWishlistItem();
}

function updateCollectionBestSeller(productTileData) {
    handlebarHelpers.getHandlebarHelpers();
    var template = Handlebars.compile($('#producttile-handlebar').html());
    const templateScript = template(productTileData);
    var productSkuForBestSeller = $('.best-seller-container .nav-link.categories-prev.active').attr('data-best-seller-pid').split(',');
    let productTileArr = $(templateScript).filter('div.ctnr-product-item');
    let classNamePrefix = '.active .best-seller-tile';
    for (let j = 0; j < productTileArr.length; j++) {
        if (j == 0) {
            $('.best-seller-component .active .image-wrapper').html(productTileArr[j]);
            let heroImageURL = $('.best-seller-container .nav-link.categories-prev.active').attr('data-hero-image-url');
            $('.active .image-wrapper .image-container .primary-image img')[j].src = heroImageURL;
        } else {
            $(classNamePrefix + '-' + (j)).html(productTileArr[j]);
        }
    }
    $('.best-seller-container .ctnr-product-item').removeClass('col-6 col-sm-4');
    bookmark.getWishlistItem();
}

function updateCollectionSuperBestSeller(productTileData) {
    handlebarHelpers.getHandlebarHelpers();
    var template = Handlebars.compile($('#producttile-handlebar').html());
    const templateScript = template(productTileData);
    var productSkuForSuperBestSeller = $('.super-collection-tab .nav-link.categories-prev.active').attr('data-best-seller-pid').split(',');
    let productTileArrSuperBestSeller = $(templateScript).filter('div.ctnr-product-item');
    let classNamePrefixSuperBestSeller = '.active .best-seller-tile';
    
    for (let j = 0; j < productTileArrSuperBestSeller.length; j++) {
        if (j == 0) {
            $('.active .super-best-seller-container .image-wrapper').html(productTileArrSuperBestSeller[j]);
            let heroImageURL = $('.super-collection-tab .nav-link.categories-prev.active').attr('data-hero-image-url');
            $('.active .image-wrapper .image-container .primary-image img')[j].src = heroImageURL;
        } else {
            $(classNamePrefixSuperBestSeller + '-' + (j)).html(productTileArrSuperBestSeller[j]);
        }
    }
    $('.super-best-seller-container .ctnr-product-item').removeClass('col-6 col-sm-4');
    bookmark.getWishlistItem();
}

function getProductTilesDataUsingPids(listOfPId) {
    rfkService.getProductDataFromRfkUsingProductGroup(listOfPId).then(function (productTileData) {
        // Run this when your request was successful
        updateCollectionBestSeller(productTileData);
    }).catch(function (err) {
        // Run this when promise was rejected via reject()
        console.log(err)
    })
}

function getProductTilesDataUsingRfkId(rfkId) {
    rfkService.getProductDataUsingRfkID(rfkId).then(function (productTileData) {
        // Run this when your request was successful
        updateCollectionBestSeller(productTileData);
    }).catch(function (err) {
        // Run this when promise was rejected via reject()
        console.log(err)
    })
}

function getProductTilesDataForSuperCollectionsUsingPids(listOfPId) {
    rfkService.getProductDataFromRfkUsingProductGroup(listOfPId).then(function (productTileData) {
        // Run this when your request was successful
        updateCollectionSuperBestSeller(productTileData);
    }).catch(function (err) {
        // Run this when promise was rejected via reject()
        console.log(err)
    })
}

function getProductTilesDataForSuperCollectionsUsingRfkId(rfkId) {
    rfkService.getProductDataUsingRfkID(rfkId).then(function (productTileData) {
        // Run this when your request was successful
        updateCollectionSuperBestSeller(productTileData);
    }).catch(function (err) {
        // Run this when promise was rejected via reject()
        console.log(err)
    })
}

module.exports = {
    collectionLookcomponent: function (data) {
        let $el = $('.look-component-container');

        if ($el.length) {
            const config = {
                rootMargin: '0px',
                threshold: 0
            };
            let observer = new IntersectionObserver((entry) => {
                if (entry[0].isIntersecting) {
                    var rfkId = $('.look-component-container').attr('div-amp-rfkid'); 
                    if (rfkId !== '') {
                            rfkService.getProductDataUsingRfkID(rfkId).then(function (productTileData) {
                            // Run this when your request was successful
                            updateCollectionLookComponent(productTileData);
                        }).catch(function (err) {
                            // Run this when promise was rejected via reject()
                            console.log(err)
                        })
                    } else {
                         var productSkuForLookComponent = $('.look-component-container').attr('data-amp-pid').split(',');
                        rfkService.getProductDataFromRfkUsingProductGroup(productSkuForLookComponent).then(function (productTileData) {
                            // Run this when your request was successful
                            updateCollectionLookComponent(productTileData);
                        }).catch(function (err) {
                            // Run this when promise was rejected via reject()
                            console.log(err)
                        })
                    }
                }
            }, config);
            observer.observe($el[0]);
        }
    },

    collectionBestSellerComponent: function () {
        let $el = $('.best-seller-container');
        if ($el.length) {
            const config = {
                rootMargin: '0px',
                threshold: 0
            };
            let observer = new IntersectionObserver((entry) => {
                if (entry[0].isIntersecting) {
                    if ($('.best-seller-container .nav-item').length === 1 ) {
                           $('.best-seller-container .nav-tabs').removeClass('d-sm-flex');
                    }
                    var rfkId = $('.best-seller-container .nav-link.categories-prev.active').attr('data-best-seller-rfkid'); 
                    if (rfkId !== '') {
                        getProductTilesDataUsingRfkId(rfkId);
                    } else {
                        var productSkuForBestSeller = $('.best-seller-container .nav-link.categories-prev.active').attr('data-best-seller-pid').split(',');
                        getProductTilesDataUsingPids(productSkuForBestSeller);
                    }
                }
            }, config);
            observer.observe($el[0]);
        }
    },
   
    superCollectionBestSellerComponent: function () {
        let $el = $('.super-best-seller-container');
        let bestSellerHeading = $('.best-seller-heading');
        let bestSellerHeadingData= $('.super-collection-tab').attr('data-best-seller-heading');
        if ($el.length) {
            const config = {
                rootMargin: '0px',
                threshold: 0
            };
            let observer = new IntersectionObserver((entry) => {
                if (entry[0].isIntersecting) {
                    var rfkId = $('.super-collection-tab .nav-link.categories-prev.active').attr('data-best-seller-rfkid');
                    if (rfkId !== '') {
                        getProductTilesDataForSuperCollectionsUsingRfkId(rfkId);
                    } else {
                        var productSkuForSuperBestSeller = $('.super-collection-tab .nav-link.categories-prev.active').attr('data-best-seller-pid').split(',');
                        getProductTilesDataForSuperCollectionsUsingPids(productSkuForSuperBestSeller);
                    }
                    $(bestSellerHeading).html(bestSellerHeadingData);
                }
            }, config);
            observer.observe($el[0]);
        }
    },
    attachEventlistener: function () {
        $(document).on('click', '.best-seller-component .nav-link:not(".dom-created")', function () {
            
            var rfkId = $(this).attr('data-best-seller-rfkid'); 
            if (rfkId !== '') {
                getProductTilesDataUsingRfkId(rfkId);
            } else {
                var productSkuForBestSeller = $(this).attr('data-best-seller-pid').split(',');
                getProductTilesDataUsingPids(productSkuForBestSeller);
            }
            $(this).addClass('dom-created');
        })
    },
    attachEventlistenerSuperCollectionsTabs: function () {
        $(document).on('click', '.super-collection-tab-container .nav-link:not(".dom-created")', function () {
            var rfkId = $(this).attr('data-best-seller-rfkid'); 
            if (rfkId !== '') {
                getProductTilesDataForSuperCollectionsUsingRfkId(rfkId);
            } else {
                var productSkuForBestSeller = $(this).attr('data-best-seller-pid').split(',');
                getProductTilesDataForSuperCollectionsUsingPids(productSkuForBestSeller);
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
    }
};