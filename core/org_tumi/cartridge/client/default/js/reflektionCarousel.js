'use strict';

var Handlebars = require('handlebars/dist/handlebars');
var rfkService = require('./reflektion/rfkService');
var handlebarHelpers = require('./handleBar/handleBarHelpers');
var produtTile = require('./search/product-tile');

function reflectionCarousel() {
    let el = document.querySelectorAll('.relfection-carousel-container');
    if (el.length) {
        const config = {
            rootMargin: '0px',
            threshold: 0
        };
        var rfkObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var carouselTarget = entry.target;
                    $('.content-slot-title').removeClass('d-none');
                    var rfkRecommendationRequestData = null;
                    if(typeof window.pageContext != 'undefined') {
                        var pageContext = window.pageContext;
                        switch(pageContext.type) {
                            case 'homepage' : 
                                rfkRecommendationRequestData = rfkService.buildRfkHomeRequestData();
                                break;
                            case 'productdetail' : 
                                rfkRecommendationRequestData = rfkService.buildRfkPDPRequestData();
                                break;
                            case 'cartpage' : 
                                rfkRecommendationRequestData = rfkService.buildRfkCartRequestData();
                                break;
                            case 'orderdetails' : 
                                rfkRecommendationRequestData = rfkService.buildOrderPageRequestData();
                                break;
                            case 'orderhistory' : 
                                rfkRecommendationRequestData = rfkService.buildOrderPageRequestData();
                                break;
                            case 'orderconfirmation' :
                                rfkRecommendationRequestData = rfkService.buildConfirmationRequestData();
                                break;
                            case 'wishlist' :
                                rfkRecommendationRequestData = rfkService.buildWishlistRequestData();
                                break;
                            case 'notFound' :
                                rfkRecommendationRequestData = rfkService.buildRequestData();
                                break;
                            case 'productlist' : 
                                rfkRecommendationRequestData = rfkService.buildListViewRequestData();
                            default : 
                                rfkRecommendationRequestData = rfkService.buildRequestData();
                                break;
                        }
                    }
                    // rfkRecommendationRequestData = rfkService.buildRequestData();
                    if (rfkRecommendationRequestData) {
                        var rfkId = carouselTarget.getAttribute('data-rfkid');
                        if (rfkId) {
                            rfkRecommendationRequestData.widget.rfkid = rfkId;
                        }
                        var reflektionUrl = rfkService.reflektionUrl();
                        var reflektionHeaders = JSON.stringify(rfkService.reflektionHeaders());
                        $.ajax({
                            url: reflektionUrl,
                            type: 'post',
                            headers: JSON.parse(reflektionHeaders),
                            data: '{"data":'+JSON.stringify(rfkRecommendationRequestData)+'}',
                            success: function (response) {
                                handlebarHelpers.getHandlebarHelpers();
                                var template = Handlebars.compile($('#producttile-handlebar').html());
                                const templateScript = template(response);
                                carouselTarget.querySelectorAll('.swiper-wrapper-reflection').forEach(function(elemen) {
                                    elemen.innerHTML = templateScript;
                                });
                                carouselTarget.setAttribute('data-rfkidEvent', response.widget.rfkid);
                                carouselTarget.querySelectorAll('.reflektion-wrapper').forEach(function(elemen) {
                                    if(!(window.pageContext.type === 'cartpage')) {
                                        const swiper = new Swiper(elemen, {  
                                            slidesPerView: 1.5,
                                            slidesPerGroup: 1,
                                            breakpoints: {
                                                768: {
                                                    slidesPerView: 3,
                                                    slidesPerGroup: 3
                                                }
                                            },
                                            navigation: {
                                            nextEl: ".collections-next",
                                            prevEl: ".collections-prev",
                                            },
                                        });
                                    } else {
                                        const swiper = new Swiper(elemen, {
                                            slidesPerView: 1.5,
                                            slidesPerGroup: 1,
                                            breakpoints: {
                                                768: {
                                                    slidesPerView: 2,
                                                    slidesPerGroup: 2
                                                }
                                            },
                                            navigation: {
                                            nextEl: ".collections-next",
                                            prevEl: ".collections-prev",
                                            },
                                        });
                                    }
                                });
                                produtTile.imageLazyLoadPlp();
                                $('body').trigger('widget:appear',
                                {
                                    fType: 'recommendation',
                                    rfkId: response.widget.rfkid
                                });
                                rfkObserver.unobserve(carouselTarget);
                                $.spinner().stop();
                            },
                            error: function (error) {
                                console.log(error);
                                $.spinner().stop();
                            }
                        });
                    }
                }
            });
        }, config);
        el.forEach(function(carouselTarget) {
            rfkObserver.observe(carouselTarget);
        });
    }
    handlebarHelpers.handleColorSwatchesInTile();
}

function renderTemplate() {
    $(document).ready(function () {
        reflectionCarousel();
    });
}

function handleColorSwatchesInTileonHover() {
    $(document).on('mouseover', '.productTileTemplates .product-tile .image-container', function (e) {
        var $this = $(e.target);
        var alternateMasterImage = $this.attr('data-master-alt-image');
        $this.closest('.product-tile').find('.image-container .primary-image img').attr('src', alternateMasterImage);
    });

    $(document).on('mouseout', '.productTileTemplates .product-tile .image-container', function (e) {
        var $this = $(e.target);
        var masterImage = $this.attr('data-master-image');
        $this.closest('.product-tile').find('.image-container .primary-image img').attr('src', masterImage);
    })
}

module.exports = {
    renderTemplate: renderTemplate,
    handleColorSwatchesInTileonHover: handleColorSwatchesInTileonHover,
    reflectionCarousel: reflectionCarousel
}