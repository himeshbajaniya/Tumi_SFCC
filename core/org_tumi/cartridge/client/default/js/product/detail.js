'use strict';
var base = require('./base');
var applePayDB = require('../product/applePayDisable');

/**
 * Enable/disable UI elements
 * @param {boolean} enableOrDisable - true or false
 */

function updateAddToCartEnableDisableOtherElements(enableOrDisable) {
    $('button.add-to-cart-global').attr('disabled', enableOrDisable);
}

function compatibleAirlineradioPopUp() {
    let inputRadio = document.querySelectorAll('.countryAirlinesPopup');
    inputRadio.forEach(x => {
        x.addEventListener('click', (e) => {
            if (e.target.value === "imperialPopup") {
                $('#airlineGuideModal').closest('div').find('.imperialPopup').removeClass('d-none');
                $('#airlineGuideModal').closest('div').find('.metricPopup').addClass('d-none')
            } else if (e.target.value === "metricPopup") {
                $('#airlineGuideModal').closest('div').find('.imperialPopup').addClass('d-none')
                $('#airlineGuideModal').closest('div').find('.metricPopup').removeClass('d-none')
            }
        })
    });

}

function airlinesData() {
    $('body').on('click', '#airlinesModalData', function () {
        var airlinesGuideUrl;
        airlinesGuideUrl = $(this).data('content-url');
        var modelBody = $('#airlineGuideModal .modal-body');
        modelBody.empty();
        $.spinner().start();
        if (airlinesGuideUrl) {
            $.ajax({
                url: airlinesGuideUrl,
                method: 'GET',
                success: function (data) {
                    $.spinner().stop();
                    modelBody.append(data);
                    compatibleAirlineradioPopUp();
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        }
    });
}
module.exports = {
    methods: {
        updateAddToCartEnableDisableOtherElements: updateAddToCartEnableDisableOtherElements
    },






    availability: base.availability,
    initSwiper: base.initSwiper,
    viewMoreShowLessImages: base.viewMoreShowLessImages,
    viewAddToCartSticky: base.viewAddToCartSticky,
    autoplayVideo: base.autoplayVideo,
    s7spinview: base.s7spinview,


    addToCart: base.addToCart,
    airlinesData: airlinesData,
    compatibleAirlineradioPopUp: compatibleAirlineradioPopUp,

    compatibleAirlineradio: function () {
        let inputRadio = document.querySelectorAll('.countryAirlines');
        inputRadio.forEach(x => {
            x.addEventListener('click', (e) => {
                if (e.target.value === "imperial") {
                    $('#compatibleairlineguide').closest('div').find('.imperial').removeClass('d-none');
                    $('#compatibleairlineguide').closest('div').find('.metric').addClass('d-none')
                } else if (e.target.value === "metric") {
                    $('#compatibleairlineguide').closest('div').find('.imperial').addClass('d-none')
                    $('#compatibleairlineguide').closest('div').find('.metric').removeClass('d-none')
                }
            })
        });

    },

    /* accentColorAttribute: function () {
        $(document).on('click', '.accents-button', function (e) {
            e.preventDefault();

            if($(this).attr('data-isaccentingsku')=='true'){
               
                document.querySelectorAll('.wrap-items.accented-product button').forEach(elem=>elem.classList.remove('clicked'));
                document.querySelectorAll('.wrap-items.accented-product button').forEach(elem=>elem.classList.remove('selected'));
                $(this).addClass('clicked');
                $(this).addClass('selected');
                let selectedAccent= $(this).attr('title');
                $('.selected-accent-option').empty().append(selectedAccent);
                
                let updatedPrice= $('button.clicked').attr('data-accentprice');
                $('.selected-accent-price').empty().append('');

                if(!(updatedPrice == 'null' || updatedPrice === undefined)) {
                $('.accent-step-button-next').removeClass('disabled');
                $('.accent-step-button-next').empty().append('Apply ('+'+ '+updatedPrice+')');
                $('.selected-accent-price').empty().append(', '+updatedPrice);
                } 
                else if (updatedPrice === undefined){
                    $('.accent-step-button-next').removeClass('disabled');
                    $('.accent-step-button-next').empty().append('Apply');
                    $('.accent-item').addClass('d-block');
                    $('.edit-block-accent').addClass('d-none');
                    $('.add-block.add-accent').removeClass('d-none');
                }
                else {
                    $('.accent-step-button-next').empty().append('Apply');
                    //$('.accent-step-button-next').removeClass('disabled');
                    $('.accent-item').addClass('d-block');
                    $('.edit-block-accent').addClass('d-none');
                    $('.add-block.add-accent').removeClass('d-none');
                }
                let imagevalue=$('.accents-button.clicked').attr('data-accentmainimage');
                let imagetag=document.querySelector(".accent-preview-img");
                imagetag.src=imagevalue;
            }
        });
    }, */

    /* accentColorApply: function () {
        $(document).on('click', '.accent-step-button-next', function (e) {
            e.preventDefault();
           let url = $('.accents-button.clicked').attr('data-url');
            var $productContainer = $(this).closest('.set-item');
             if (!$productContainer.length && $('.accents-button').hasClass('accents-button')) {
                $productContainer = $('.accent-item').closest('.product-detail');
            }
            base.attributeSelect(url, $productContainer);
            var formEle = $('.accent-form-form');
            formEle.addClass('d-none');
            var accentModal = $(e.target).parents('.accent-modal');
            accentModal.modal('hide');
            $('.edit-block-accent').addClass('d-block');
            $('.add-accent').removeClass('d-block')
            $('.add-accent').addClass('d-none');
           
            $('.icon.accent-default').addClass('d-none');
            $('.icon.accent-added').removeClass('d-none');
            let currentPrice=$('.accents-button.clicked.selected').attr('data-accentprice');
            let currentColor=$('.accents-button.clicked.selected').attr('title');
            if(currentPrice){
                $('.accent-item-wrapper.accent-item .title').empty().append('Accent Added');
                $('.accent-item-wrapper.accent-item .desc').empty().append(currentColor + ' (+' + currentPrice+')');
            }
            else{
                $('.accent-item-wrapper.accent-item .title').empty().append('Accent');
                $('.accent-item-wrapper.accent-item .desc').empty().append('Descriptive Text');
                $('.icon.accent-default').removeClass('d-none');
                $('.icon.accent-added').addClass('d-none');
            }
        });
    }, */

   /* addAccentModal:function(){
        $(document).on('click','.add-accent',function(e){
        let mainImage=$('.color-pointer').attr('data-mainproductimage');
        document.querySelector('.accent-preview-img').src=mainImage;
        $('.accents-button.no-accent .accent-price').empty().append('No Accent');
            $('.accent-step-button-next').empty().append('Apply');
            $('.accent-step-button-next').addClass('disabled');
            $('.accents-button.selected').removeClass('selected');
            $('.selected-accent-option').empty().append('None Selected');
            $('.selected-accent-price').empty();

            var accentswiper = new Swiper(".mySwiper-acc", {
                direction: "horizontal",
                slidesPerView: "auto",
                freeMode: true,
                scrollbar: {
                  el: ".swiper-scrollbar",
                  draggable: true,
                  snapOnRelease: false,
                  dragSize: 250
                },
                mousewheel: true
              });
    })
   }, */

   /* editAccentModal:function(){
    $(document).on('click','.edit-accent',function(e){
        $('.accents-button.clicked.selected').click();
        var accentswiper = new Swiper(".mySwiper-acc", {
            direction: "horizontal",
            slidesPerView: "auto",
            freeMode: true,
            scrollbar: {
              el: ".swiper-scrollbar",
              draggable: true,
              snapOnRelease: false,
              dragSize: 250
            },
            mousewheel: true
          });
})
}, */

    updateAttributesAndDetails: function () {
        $('body').on('product:statusUpdate', function (e, data) {
            var $productContainer = $('.product-detail[data-pid="' + data.id + '"]');

            $productContainer.find('.description-and-detail .product-attributes')
                .empty()
                .html(data.attributesHtml);

            if (data.shortDescription) {
                $productContainer.find('.description-and-detail .description')
                    .removeClass('hidden-xl-down');
                $productContainer.find('.description-and-detail .description .content')
                    .empty()
                    .html(data.shortDescription);
            } else {
                $productContainer.find('.description-and-detail .description')
                    .addClass('hidden-xl-down');
            }

            if (data.longDescription) {
                $productContainer.find('.description-and-detail .details')
                    .removeClass('hidden-xl-down');
                $productContainer.find('.description-and-detail .details .content')
                    .empty()
                    .html(data.longDescription);
            } else {
                $productContainer.find('.description-and-detail .details')
                    .addClass('hidden-xl-down');
            }
        });
    },

    showSpinner: function () {
        $('body').on('product:beforeAddToCart product:beforeAttributeSelect', function () {
            $.spinner().start();
        });
    },
    updateAttribute: function () {
        $('body').on('product:afterAttributeSelect', function (e, response) {
            var featureTsalock = $('.maintenance-tsaLock')
            var featuretumiTracer = $('.maintenance-tumiTracer');
            var featureWarrenty = $('.maintenance-warranty');

            if ($('.product-detail>.bundle-items').length) {
                response.container.attr('data-pid', response.data.product.id);
                response.container.find('.product-id').text(response.data.product.id);
            } else if ($('.product-set-detail').eq(0)) {
                response.container.attr('data-pid', response.data.product.id);
                response.container.find('.product-id').text(response.data.product.id);
                response.container.find('.feature-tab').html(response.data.featureAndSpec);
                $('.feature-tsaLock').html(featureTsalock);
                $('.feature-tumiTracer').html(featuretumiTracer);
                $('.feature-warranty').html(featureWarrenty);
                $('.pdp-feature-tab').find('li a:first').trigger('click');
            } else {
                $('.product-id').text(response.data.product.id);
                $('.product-detail:not(".bundle-item")').attr('data-pid', response.data.product.id);
                $('.feature-tab').html(response.data.featureAndSpec);
                $('.feature-tsaLock').html(featureTsalock);
                $('.feature-tumiTracer').html(featuretumiTracer);
                $('.feature-warranty').html(featureWarrenty);
                $('.pdp-feature-tab').find('li a:first').trigger('click');
            }
        });
    },
    updateAddToCart: function () {
        $('body').on('product:updateAddToCart', function (e, response) {
            // update local add to cart (for sets)
            $('button.add-to-cart', response.$productContainer).attr('disabled',
                (!response.product.readyToOrder || !response.product.available));

            var enable = $('.product-availability').toArray().every(function (item) {
                return $(item).data('available') && $(item).data('ready-to-order');
            });
            module.exports.methods.updateAddToCartEnableDisableOtherElements(!enable);
        });
    },
    updateAvailability: function () {
        $('body').on('product:updateAvailability', function (e, response) {
            $('div.availability', response.$productContainer)
                .data('ready-to-order', response.product.readyToOrder)
                .data('available', response.product.available);

            $('.availability-msg', response.$productContainer)
                .empty().html(response.message);

            if ($('.global-availability').length) {
                var allAvailable = $('.product-availability').toArray()
                    .every(function (item) {
                        return $(item).data('available');
                    });

                var allReady = $('.product-availability').toArray()
                    .every(function (item) {
                        return $(item).data('ready-to-order');
                    });

                $('.global-availability')
                    .data('ready-to-order', allReady)
                    .data('available', allAvailable);

                $('.global-availability .availability-msg').empty()
                    .html(allReady ? response.message : response.resources.info_selectforstock);
            }
        });
    },
    sizeChart: function () {
        $('.size-chart a').on('click', function (e) {
            e.preventDefault();
            var url = $(this).attr('href');
            var $prodSizeChart = $(this).closest('.size-chart').find('.size-chart-collapsible');
            if ($prodSizeChart.is(':empty')) {
                $.ajax({
                    url: url,
                    type: 'get',
                    dataType: 'json',
                    success: function (data) {
                        $prodSizeChart.append(data.content);
                    }
                });
            }
            $prodSizeChart.toggleClass('active');
        });

        var $sizeChart = $('.size-chart-collapsible');
        $('body').on('click touchstart', function (e) {
            if ($('.size-chart').has(e.target).length <= 0) {
                $sizeChart.removeClass('active');
            }
        });
    },
    copyProductLink: function () {
        $('body').on('click', '#fa-link', function () {
            event.preventDefault();
            var $temp = $('<input>');
            $('body').append($temp);
            $temp.val($('#shareUrl').val()).select();
            document.execCommand('copy');
            $temp.remove();
            $('.copy-link-message').attr('role', 'alert');
            $('.copy-link-message').removeClass('d-none');
            setTimeout(function () {
                $('.copy-link-message').addClass('d-none');
            }, 3000);
        });
    },

    pdpFeatureTab: function () {
        if (window.innerWidth < 640) {
            let ultabs = document.querySelector("#pdpFeatureTab");
            let tabsLi = document.querySelectorAll("#pdpFeatureTab li.nav-item");
            tabsLi.forEach(x => {
                x.addEventListener('click', (e) => {
                    let tabsliFirstPosition = Math.abs(document.querySelector("#pdpFeatureTab li:first-child").getBoundingClientRect().left);
                    let currentElement = e.currentTarget;
                    let elementPosition = currentElement.getBoundingClientRect().left;
                    let claculatePositionLeft = tabsliFirstPosition + elementPosition
                    ultabs.scrollTo(claculatePositionLeft, 0);

                })
            })
        }
    },

    pdpFeatureTabActiveClass: function () {
        let tabLiFirstChild = document.querySelector("#pdpFeatureTab li:first-child a");
        let tabContentFirstChild = document.querySelector("#pdpTabContent .tab-pane:first-child");
        tabLiFirstChild.classList.add('active');
        tabLiFirstChild.setAttribute('aria-selected', 'true');
        tabContentFirstChild.classList.add('active');
    },

    applePayBtn:function () {
        $('body').on('product:updateAddToCart', function (e, response) {
            if (response.product.readyToOrder) {
                var applePayButton = $('.apple-pay-pdp', response.$productContainer);
                if (applePayButton.length !== 0) {
                    applePayButton.attr('sku', response.product.id);
                } else {
                    var showApplePay = true;
                    if (typeof $('.cart-and-ipay').data('ipay-enabled') !== 'undefined') {
                        showApplePay = $('.cart-and-ipay').data('ipay-enabled');
                    }
                    if ($('.apple-pay-pdp').length === 0 && showApplePay) { // eslint-disable-line no-lonely-if
                        var applePayButtonIsmlString = '<div class="col-12 col-md-6  pdp-apple-pay-button">'
                                                    + '<isapplepay class="apple-pay-pdp btn test"'
                                                    + 'sku=' + response.product.id + '></isapplepay>'
                                                    + '</div>';
                        $('.cart-and-ipay .row').append(applePayButtonIsmlString);

                        if ($('.cart-and-ipay').data('is-apple-session') === true) {
                            $('.pdp-checkout-button').removeClass('col-12');
                            $('.pdp-checkout-button').addClass('col col-sm-5');
                        }
                    }
                }
            } else {
                $('.pdp-apple-pay-button').remove();
                $('.pdp-checkout-button').removeClass('col col-sm-5');
                $('.pdp-checkout-button').addClass('col-12');
            }
        })

        if (window.ApplePaySession && window.ApplePaySession.canMakePayments()) {
            if($('isapplepay').length > 0) {
                $('isapplepay').parent().removeClass('d-none');
            }
        };

        //CH-3404 adding this function to disable apple-pay button on selection of bopis 
        $('.product-btn-wrapper [name="shipment-option"]').on('change', function () {
            if($(this).val() === 'instore-pickup') {
                applePayDB.applePayDisableEnable(true);
            }
            if(($(this).val() !== 'instore-pickup') && !$('.monogram-item').hasClass('edit-monogram')) {
                applePayDB.applePayDisableEnable(false);
            }
        });
    },
    focusChooseBonusProductModal: base.focusChooseBonusProductModal(),
    clickVariationAttributes: base.clickVariationAttributes(),
    updateRatingValue: base.updateRatingValue()
};