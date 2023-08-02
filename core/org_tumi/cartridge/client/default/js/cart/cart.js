'use strict';

var base = require('../product/base');
var accent = require('../accent/cart');
var focusHelper = require('base/components/focus');
var promo = require('../components/coupon');
var tooltip = require('../common');

var mySwiperEle = $('.swiper-cart').length;
if(mySwiperEle > 0) {
    var saveItemSwiper = new Swiper(".swiper-cart", {
        slidesPerView: 1.5,
        grabCursor: true,
        observer: true,
        observeParents: true,
        breakpoints: {
            645: {
                slidesPerView: 1.5,
                grabCursor: true,
            },
            1024: {
                slidesPerView: 2,
                slidesPerGroup: 2,
                watchSlidesProgress: true,
                navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
                },
            },
        },
    });
}

if (window.innerWidth < 543) {
    let $el = $('.order-summary');
    let mobileSummary = $('.mobile-summary');
    let desktopSummary = $('.desktop-summary');
    let mobileProductList = $('.mobile-prod-details');
    let smProductList = $('.productList-container');
    if ($el.length) {
        const config = {
            rootMargin: '0px',
            threshold: 0
        };
        let observer = new IntersectionObserver((entry) => {
            if (!entry[0].isIntersecting) {
                $('.checkout-continue').addClass('active');
            } else {
                $('.checkout-continue').removeClass('active');
            }
        }, config);
        observer.observe($el[0]);
    }

    desktopSummary.children(".totals").appendTo(mobileSummary);
    if(mobileProductList.length > 0) {
        smProductList.children(".update-cart").appendTo(mobileProductList);
        $('.update-cart .product-card').addClass('d-none');
    
        $(".mobile-prod-details .your-cart-header").click(function(e){
            e.preventDefault();
            $(".mobile-prod-details  h1.your-cart-header").toggleClass('svg-icon');
            $('.update-cart .product-card').toggleClass('d-none');
            $('.product-detail').toggleClass('border-0');
        });
    }
}

$(document).on('click', '.show-store-link', function () {
    $(this).toggleClass('show-up-arrow');
    $(this).next().toggleClass('show-store');
});

$(document).on('click', '#view-all-days', function () {
    $('.days-and-time').toggleClass('show-day-time');
    ($(this).text() === "View all days") ? $(this).text($(this).data('text-show-less')) : $(this).text($(this).data('text-view-all'));
});

/**
 * Updates the availability of a product line item
 * @param {Object} data - AJAX response from the server
 * @param {string} uuid - The uuid of the product line item to update
 */
function updateAvailability(data, uuid) {
    var lineItem;
    var messages = '';

    for (var i = 0; i < data.items.length; i++) {
        if (data.items[i].UUID === uuid) {
            lineItem = data.items[i];
            break;
        }
    }

    if (lineItem != null) {
        $('.availability-' + lineItem.UUID).empty();

        if (lineItem.availability) {
            if (lineItem.availability.messages) {
                lineItem.availability.messages.forEach(function (message) {
                    messages += '<p class="line-item-attributes">' + message + '</p>';
                });
            }

            if (lineItem.availability.inStockDate) {
                messages += '<p class="line-item-attributes line-item-instock-date">' +
                    lineItem.availability.inStockDate +
                    '</p>';
            }
        }

        $('.availability-' + lineItem.UUID).html(messages);
    }
}

/**
 * Finds an element in the array that matches search parameter
 * @param {array} array - array of items to search
 * @param {function} match - function that takes an element and returns a boolean indicating if the match is made
 * @returns {Object|null} - returns an element of the array that matched the query.
 */
function findItem(array, match) { // eslint-disable-line no-unused-vars
    for (var i = 0, l = array.length; i < l; i++) {
        if (match.call(this, array[i])) {
            return array[i];
        }
    }
    return null;
}

/**
 * Updates details of a product line item
 * @param {Object} data - AJAX response from the server
 * @param {string} uuid - The uuid of the product line item to update
 */
function updateProductDetails(data, uuid) {
    $('.card.product-info.uuid-' + uuid).replaceWith(data.renderedTemplate);
}

/**
 * Generates the modal window on the first call.
 *
 */
function getModalHtmlElement() {
    if ($('#editProductModal').length !== 0) {
        $('#editProductModal').remove();
    }
    var htmlString = '<!-- Modal -->'
        + '<div class="modal fade global-modal" id="editProductModal" tabindex="-1" role="dialog">'
        + '<span class="enter-message sr-only" ></span>'
        + '<div class="modal-dialog quick-view-dialog">'
        + '<!-- Modal content-->'
        + '<div class="modal-content">'
        + '<div class="modal-header">'
        + '<h6>Edit Item</h6>'
        + '    <button type="button" class="close pull-right" data-dismiss="modal">'
        + '        <span aria-hidden="true">'
        + '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">'
        + ' <path fill-rule="evenodd" clip-rule="evenodd" d="M0 0.708333L0.708333 0L8.50522 7.79688L16.0918 0.210327L16.8001 0.918661L9.21355 8.50522L17 16.2917L16.2917 17L8.50522 9.21355L0.919271 16.7995L0.210938 16.0912L7.79688 8.50522L0 0.708333Z" fill="#1B1C1E"/>'
        + '</svg></span>'
        + '        <span class="sr-only"> </span>'
        + '    </button>'
        + '</div>'
        + '<div class="modal-body"></div>'
        + '<div class="modal-footer"></div>'
        + '</div>'
        + '</div>'
        + '</div>';
    $('body').append(htmlString);
}

/**
 * Parses the html for a modal window
 * @param {string} html - representing the body and footer of the modal window
 *
 * @return {Object} - Object with properties body and footer.
 */
function parseHtml(html) {
    var $html = $('<div>').append($.parseHTML(html));

    var body = $html.find('.product-quickview');
    var footer = $html.find('.modal-footer').children();

    return {
        body: body,
        footer: footer
    };
}

/**
 * replaces the content in the modal window for product variation to be edited.
 * @param {string} editProductUrl - url to be used to retrieve a new product model
 */
function fillModalElement(editProductUrl) {
    $('.modal-body').spinner().start();
    $.ajax({
        url: editProductUrl,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            var parsedHtml = parseHtml(data.renderedTemplate);

            $('#editProductModal .modal-body').empty();
            $('#editProductModal .modal-body').html(parsedHtml.body);
            $('#editProductModal .modal-footer').html(parsedHtml.footer);
            $('#editProductModal .modal-header .close .sr-only').text(data.closeButtonText);
            $('#editProductModal .enter-message').text(data.enterDialogMessage);
            $('#editProductModal').attr('store-id', data.storeId);
            $('.hide-accent-on-edit').addClass('d-none');
            $('[data-quantity="plus"]').click(function (e) {
                // Stop acting like a button
                e.preventDefault();
                // Get the field name
                var fieldName = $(this).attr('data-field');
                // Get its current value
                var currentVal = parseInt($('input[name=' + fieldName + ']').val());
                // If is not undefined
                if (!isNaN(currentVal)) {
                    // Increment
                    let selectedQuantity = currentVal + 1;
                    $('input[name=' + fieldName + ']').val(selectedQuantity);
                    $('.modal.show .update-cart-url').data('selected-quantity', selectedQuantity);
                } else {
                    // Otherwise put a 1 there
                    $('input[name=' + fieldName + ']').val(1);
                }
            });
            // This button will decrement the value till 1
            $('[data-quantity="minus"]').click(function (e) {
                // Stop acting like a button
                e.preventDefault();
                // Get the field name
                var fieldName = $(this).attr('data-field');
                // Get its current value
                var currentVal = parseInt($('input[name=' + fieldName + ']').val());
                // If it isn't undefined or its greater than 1
                if (!isNaN(currentVal) && currentVal > 1) {
                    // Decrement one
                    let selectedQuantity = currentVal - 1;
                    $('input[name=' + fieldName + ']').val(selectedQuantity);
                    $('.modal.show .update-cart-url').data('selected-quantity', selectedQuantity);
                } else {
                    // Otherwise put a 1 there
                    $('input[name=' + fieldName + ']').val(1);
                }
            });

            $('body').trigger('editproductmodal:ready');
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

/*
function accentDefaultButton() {
    let mainImage = $('.color-pointer').attr('data-mainproductimage');
    let dataURl = $('.color-pointer').attr('data-url');
    let baseColorName = $('.color-pointer').attr('title');
    let noAccentImage = $('.color-pointer').attr('data-noaccentimage');
    // if(mainImage && document.querySelector('.accent-preview-img')) {
    //     document.querySelector('.accent-preview-img').src = mainImage;
    // }
    
    if($('.accents-button.no-accents-button').length == 0) {
    let noAccentBtnElement = document.createElement('button');
    let swatchCircleDiv = document.createElement('div');
    let imageElemCirecleDiv = document.createElement('img');
    let accentPriceDiv = document.createElement('div');
    imageElemCirecleDiv.src = noAccentImage;
    accentPriceDiv.setAttribute('class','accent-price');
    accentPriceDiv.innerHTML = 'No Accent'

    noAccentBtnElement.setAttribute('data-accentmainimage',mainImage);
    noAccentBtnElement.setAttribute('class','accents-button no-accents-button');

    noAccentBtnElement.setAttribute('data-isaccentingsku','true');
    noAccentBtnElement.setAttribute('data-accentable',null);

    noAccentBtnElement.setAttribute('data-url',dataURl);
    noAccentBtnElement.setAttribute('title',baseColorName);

    swatchCircleDiv.appendChild(imageElemCirecleDiv);
    noAccentBtnElement.appendChild(swatchCircleDiv);
    noAccentBtnElement.appendChild(accentPriceDiv);
    document.querySelector('.wrap-items.accented-product .swiper-wrapper .swiper-slide>div').appendChild(noAccentBtnElement);
}
};
*/
/**
 * replaces the content in the modal window for product variation to be edited.
 * @param {string} editProductUrl - url to be used to retrieve a new product model
 */
/* function fillModalElementAccent(editProductUrl) {
    $('.modal-body').spinner().start();
    $.ajax({
        url: editProductUrl,
        method: 'GET',
        dataType: 'json',
        success: function (data) {

            var parsedHtml = parseHtml(data.renderedTemplate);
            $('#editProductModal .modal-body').empty();
            $('#editProductModal .modal-body').html(parsedHtml.body);
            
      
            var accentswiper = new Swiper(".mySwiper-acc", {
                direction: "horizontal",
                slidesPerView: "auto",
                freeMode: true,
                scrollbar: {
                  el: ".swiper-scrollbar",
                  draggable: true,
                  dragSize: 250
                },
                mousewheel: true
              });
            // change modal heading for accents modal
            $('.quick-view-dialog .modal-header h6').html('Add Color Accents');
            $('.quick-view-dialog .modal-header h6').addClass("add-your-accent");
            // remove quantity range from modal
            $('.quick-view-dialog .modal-body .edit-productlist').css("display","block");
            $('.quick-view-dialog .modal-body .edit-productlist .prooduct-image').css("width","auto");
            $('.quick-view-dialog .modal-body .edit-productlist .update-product').addClass('d-none');

            // creating div to show selected accent alongwith price and color

            let selectedAccentDetails= document.createElement('div');
            selectedAccentDetails.classList.add('selected-accent-details');
            let color = document.createElement('span');
            color.classList.add('color');
            let price = document.createElement('span');
            price.classList.add('price');
            let description = document.createElement('div');
            description.classList.add('description');
            selectedAccentDetails.append(description);
            selectedAccentDetails.append(color);
            selectedAccentDetails.append(price);
            $('.quick-view-dialog .modal-body .edit-productlist').append(selectedAccentDetails);

            $('.selected-accent-details .description').html("Choose Your Accent Color");
            $('.selected-accent-details .color').html("None Selected");



            var colorPointer = $('.color-pointer')
            if (colorPointer.attr('data-accentable') == 'true') {
                if ($('.accents-button.no-accents-button').length) {
                    $('.accents-button.no-accents-button').remove();
                }
                  accentDefaultButton();
            colorPointer.closest('.attribute').addClass('d-none');
            let accentingColorID = colorPointer.attr('data-accentingskus');
            var accentingskus = accentingColorID.split(',');
            var buttonaccent = [];
            var allVarientSKUs = data.product.variationAttributes[0].values;
            allVarientSKUs.forEach(elem => {
                buttonaccent.push(elem.id);
            });
            buttonaccent.forEach(function (accent) {
                accentingskus.forEach(function (skus) {
                if (accent == skus) {
                    var buttonAttr ='[data-attr-accent-value=' + skus + ']';
                    $(buttonAttr).removeClass('d-none');
                }
            });
        });
    }
        // var isAccentingSku = colorPointer.attr('data-isaccentingsku')
        else if($('.color-pointer').attr('data-isaccentingsku') == 'true' ){
            if($('.color-attribute.color-pointer').attr('data-baseaccentingsku')!=="null"){
                if ($('.accents-button.no-accents-button').length) {
                    $('.accents-button.no-accents-button').remove();
                }
            $('.color-pointer').closest('.attribute').addClass('d-none');
        //    $('.accent-item').removeClass('d-none');
        //    $('.edit-block-accent').removeClass('d-none');
        //    $('.add-block.add-accent').removeClass('d-block');
        //    $('.add-block.add-accent').addClass('d-none');
               let baseaccentingSkuValue=$('.color-attribute.color-pointer').attr('data-baseaccentingsku');
               $('.color-attribute').each(function(x,elem){
                if($(elem).attr('data-attr-id-value')==baseaccentingSkuValue){
                    let baseElem=$(this);
                    var buttonUrl = baseElem.attr('data-url');
                    var accentingColor = baseElem.attr('data-accentingskus')
                    var accentingskus = accentingColor.split(',');
                    var buttonaccent = [];

                    var accentColor = $('.swatch-circle.selected').parent('.color-attribute').attr('title');
                    var noAccentImg = $('.accents-button.no-accent').attr('title');
                    document.querySelectorAll('.accented-product button').forEach(elem => buttonaccent.push(elem.getAttribute('data-attr-accent-value')));
                    buttonaccent.forEach(function (accent) {
                            accentingskus.forEach(function (skus) {
                            if (accent == skus) {
                                var buttonAttr ='[data-attr-accent-value=' + skus + ']';
                                $(buttonAttr).removeClass('d-none');
                                // if($(buttonAttr).hasClass('no-accents-button')) {
                                // document.querySelector('.accent-preview-img').src = $(buttonAttr).attr('data-accentmainimage');
                                // }
                            }
                        });
                    });
                    let mainImage= baseElem.attr('data-mainproductimage');
                    let baseColorName=baseElem.attr('title');
                    // let noAccentImage=$('.color-pointer').attr('data-noaccentimage');
                    let noAccentImage=baseElem.attr('data-noaccentimage');
                    // document.querySelector('.accent-preview-img').src=mainImage;
                    if($('.accents-button.no-accents-button').length == 0) {
                    let noAccentBtnElement = document.createElement('button');
                    let swatchCircleDiv = document.createElement('div');
                    let imageElemCirecleDiv = document.createElement('img');
                    let accentPriceDiv = document.createElement('div');
                    imageElemCirecleDiv.src = noAccentImage;
                    accentPriceDiv.setAttribute('class','accent-price');
                    accentPriceDiv.innerHTML = 'No Accent'
                    noAccentBtnElement.setAttribute('data-accentmainimage',mainImage);
                    noAccentBtnElement.setAttribute('class','accents-button no-accents-button');
                    noAccentBtnElement.setAttribute('data-isaccentingsku','true');
                    noAccentBtnElement.setAttribute('data-url',buttonUrl);
                    noAccentBtnElement.setAttribute('title',baseColorName);
                    //noAccentBtnElement.setAttribute('data-accentprice',' ');
                    swatchCircleDiv.appendChild(imageElemCirecleDiv);
                    noAccentBtnElement.appendChild(swatchCircleDiv);
                    noAccentBtnElement.appendChild(accentPriceDiv);
                    document.querySelector('.wrap-items.accented-product .swiper-wrapper .swiper-slide>div').appendChild(noAccentBtnElement);
                    }
                }
                })
            }
        }
            $('#editProductModal .modal-footer').html(parsedHtml.footer);
            $('#editProductModal .modal-footer').addClass('accent-cart-footer');

            $('#editProductModal .modal-header .close .sr-only').text(data.closeButtonText);
            $('#editProductModal .enter-message').text(data.enterDialogMessage);
            $('#editProductModal').attr('store-id', data.storeId);
            $('.update-cart-product-global').html('Apply');
            $('.accents-button.clicked.selected').click();

            $('body').trigger('editproductmodal:ready');
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });

    var accentswiper = new Swiper(".mySwiper-acc", {
        direction: "horizontal",
        slidesPerView: "auto",
        freeMode: true,
        scrollbar: {
          el: ".swiper-scrollbar",
          draggable: true,
          dragSize: 250
        },
        mousewheel: true
      });
} */

/**
 * replace content of modal
 * @param {string} actionUrl - url to be used to remove product
 * @param {string} productID - pid
 * @param {string} productName - product name
 * @param {string} uuid - uuid
 */
function confirmDelete(actionUrl, productID, productName, uuid) {
    var $deleteConfirmBtn = $('.cart-delete-confirmation-btn');
    var $productToRemoveSpan = $('.product-to-remove');

    $deleteConfirmBtn.data('pid', productID);
    $deleteConfirmBtn.data('action', actionUrl);
    $deleteConfirmBtn.data('uuid', uuid);

    $productToRemoveSpan.empty().append(productName);
}

function findAndSetStore(url) {
    $.spinner().start();
    $.ajax({
        url: url,
        type: 'get',
        dataType: 'json',
        success: function (data) {
            $.spinner().stop();
            window.location.href = data.redirectUrl;
        },
        error: function (err) {
            $.spinner().stop();
            window.location.href = err.redirectUrl;
        }
    });
}

module.exports = function () {
    base.findStoreByLocationOrZipCode();
    promo.promoCoupon();
    tooltip.tooltip();

    $('.change-shipment').on('change', function (e) {
        var url = $(this).data('change-shipment-url');
        if (url && url !== undefined && url !== null && url !== '') {
            findAndSetStore(url);
        }
    });

    $('#pick-up-store').on('click', function () {
        var isPdpPage = document.querySelectorAll('#pickup-in-store').length > 0;
        if(isPdpPage) {
            var storeId = $('input[name=selected-store]:checked').data('store-id');
            var storeName = $('input[name=selected-store]:checked').val();
            $('.pickup-instore-label span').html(storeName);
            $('#pickup-in-store').attr('data-store-id', storeId);
            $('#pickup-in-store').trigger('click');
            $('.premium-modal-btn').removeClass('hidePremiumforBopis').addClass('hidePremiumforBopis');
        }
        var isCartPage = $('div.cart-page').length > 0;
        if(isCartPage){
            var storeId = $('input[name=selected-store]:checked').data('store-id');
            var url = $('#findAStore').attr('find-store-url') + '&storeId=' + storeId;
            findAndSetStore(url);
            $('.premium-modal-btn').removeClass('hidePremiumforBopis').addClass('hidePremiumforBopis');
        }
        $('.monogram-option-selection').addClass('hide-premium-mono');
    });

    $('body').on('click', 'input[name="shipment-option"]',  function() {
        if ($('input[name="shipment-option"]:checked').val() === 'ship-to-me') {
            $('.monogram-option-selection').removeClass('hide-premium-mono');
            $('.classic-both').removeClass('show-classic-mono');
            $('.monogram-option-selection').removeClass('hide-premium-mono');
        }
    });

    $('body').on('click', '.remove-product', function (e) {
        e.preventDefault();

        var actionUrl = $(this).data('action');
        var productID = $(this).data('pid');
        var productName = $(this).data('name');
        var uuid = $(this).data('uuid');
        confirmDelete(actionUrl, productID, productName, uuid);
    });

    $('body').on('afterRemoveFromCart', function (e, data) {
        e.preventDefault();
        confirmDelete(data.actionUrl, data.productID, data.productName, data.uuid);
    });

    $('.optional-promo').click(function (e) {
        e.preventDefault();
        $('.promo-code-form').toggle();
    });

    $('#requestLoginModal').on('shown.bs.modal', function (e) {
        $(this).css('z-index', '1051');
        $('#login-tab').focus();
        if (e.relatedTarget && (e.relatedTarget.className === 'checkout-login' || e.relatedTarget.className.includes('signin-memeber-checkout') || e.relatedTarget.className.includes('checkout-btn'))) {
            /* var form = $(e.target).find('form').attr('action').split('?');
            form = form[0]+'?'+ 'rurl=2';
            $(e.target).find('form').attr('action', form); */
            $('.login-page form').map(function (index, list) {
                var formEle = list.action;
                list.action = formEle.replace('rurl=1', 'rurl=2');
            });
            if (e.relatedTarget.dataset.login === "create-account") {
                $('#register-tab').trigger('click');
            } else {
                $('#login-tab').trigger('click');
            }

        }
        var janrain = $('.janrainPage');
        if (janrain.length) {
            janrain.find('a').each(function() {
                $(this).attr('tabindex','0');
            });
        }
    });

    $('#requestLoginModal').on('hidden.bs.modal', function (e) {
        /* var form = $(e.target).find('form').attr('action').split('?');
        form = form[0]+'?'+ 'rurl=1';
        $(e.target).find('form').attr('action', form); */
        $('.login-page form').map(function (index, list) {
            var formEle = list.action;
            list.action = formEle.replace('rurl=2', 'rurl=1');
        });
    });

    $('body').on('click', '.cart-delete-confirmation-btn', function (e) {
        e.preventDefault();

        var productID = $(this).data('pid');
        var url = $(this).data('action');
        var uuid = $(this).data('uuid');
        var urlParams = {
            pid: productID,
            uuid: uuid
        };

        url = promo.appendToUrl(url, urlParams);

        $('body > .modal-backdrop').remove();

        $.spinner().start();

        $('body').trigger('cart:beforeUpdate');

        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                if (data.basket.items.length === 0) {
                    $('.cart-error').empty();
                    $('.cart-details .cart-header').removeClass('row')
                    $('.product-card').empty();
                    $('.cart-details .cart-header').empty().append('<h1 class="your-cart-header">Your Cart'
                        + '<div class="opening-parenthesis">(</div>'
                        + '<div class="number-of-items">0</div>'
                        + '<div>)</div>'
                        + '</h1>'
                        + '<p class="empty-msg">' + data.basket.resources.emptyCartMsg + '</p>');
                    $('.minicart-quantity').addClass('d-none');
                    $('.number-of-items').empty().append(data.basket.resources.numberOfItems);
                    $('.minicart-quantity').empty().append(data.basket.numItems);
                    $('.minicart-link').attr({
                        'aria-label': data.basket.resources.minicartCountOfItems,
                        title: data.basket.resources.minicartCountOfItems
                    });
                    $('.minicart .popover').empty();
                    $('.minicart .popover').removeClass('show');
                    $('body').removeClass('modal-open');
                    $('html').removeClass('veiled');
                    $('h3').css("margin-bottom", "30px");
                    $('.subtotal-text, .sub-text, .promo-code-container, .coupons-and-promos, .promo-text, .shipping-text, .content-hide').hide();
                    $('.shipping-cost, .grand-total, .sub-total').html("$0.00");
                    $('.container').removeClass('cart-page').addClass('cart-empty');
                    $('.checkout-btn').removeClass('button-secondary-dark').addClass('button--disabled');
                } else {
                    if (data.toBeDeletedUUIDs && data.toBeDeletedUUIDs.length > 0) {
                        for (var i = 0; i < data.toBeDeletedUUIDs.length; i++) {
                            $('.uuid-' + data.toBeDeletedUUIDs[i]).remove();
                        }
                    }
                    $('.uuid-' + uuid).remove();   
                    if (!data.basket.hasBonusProduct) {
                        $('.bonus-product').remove();
                    }
                    $('.coupons-and-promos').empty().append(data.basket.totals.discountsHtml);
                    promo.updateCartTotals(data.basket);
                    if (data.basket.totals.totalDiscount.value > 0) {
                        $('.promo-text').removeClass('d-none');
                        } else {
                            $('.promo-text').addClass('d-none');
                        }
                    promo.updateApproachingDiscounts(data.basket.approachingDiscounts);
                    $('body').trigger('setShippingMethodSelection', data.basket);
                    promo.validateBasket(data.basket);
                }

                $('body').trigger('cart:update', data);

                window.dataLayer = window.dataLayer || [];
                window.dataLayer[0] = JSON.parse(data.dataLayerJson);

                $.spinner().stop();
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    promo.createErrorNotification(err.responseJSON.errorMessage);
                    $.spinner().stop();
                }
            }
        });
    });

    $('body').on('change', '.quantity-form > .quantity', function () {
        var preSelectQty = $(this).data('pre-select-qty');
        var quantity = $(this).val();
        var productID = $(this).data('pid');
        var url = $(this).data('action');
        var uuid = $(this).data('uuid');

        var urlParams = {
            pid: productID,
            quantity: quantity,
            uuid: uuid
        };
        url = promo.appendToUrl(url, urlParams);

        $(this).parents('.card').spinner().start();

        $('body').trigger('cart:beforeUpdate');

        $.ajax({
            url: url,
            type: 'get',
            context: this,
            dataType: 'json',
            success: function (data) {
                $('.quantity[data-uuid="' + uuid + '"]').val(quantity);
                $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
                promo.updateCartTotals(data);
                promo.updateApproachingDiscounts(data.approachingDiscounts);
                updateAvailability(data, uuid);
                promo.validateBasket(data);
                $(this).data('pre-select-qty', quantity);

                $('body').trigger('cart:update', data);

                $.spinner().stop();
                if ($(this).parents('.product-info').hasClass('bonus-product-line-item') && $('.cart-page').length) {
                    location.reload();
                }
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    promo.createErrorNotification(err.responseJSON.errorMessage);
                    $(this).val(parseInt(preSelectQty, 10));
                    $.spinner().stop();
                }
            }
        });
    });

    $('.shippingMethods').change(function () {
        var url = $(this).attr('data-actionUrl');
        var urlParams = {
            methodID: $(this).find(':selected').attr('data-shipping-id')
        };
        // url = promo.appendToUrl(url, urlParams);

        $('.totals').spinner().start();
        $('body').trigger('cart:beforeShippingMethodSelected');
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: urlParams,
            success: function (data) {
                if (data.error) {
                    window.location.href = data.redirectUrl;
                } else {
                    $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
                    promo.updateCartTotals(data);
                    promo.updateApproachingDiscounts(data.approachingDiscounts);
                    promo.validateBasket(data);
                }

                $('body').trigger('cart:shippingMethodSelected', data);
                $.spinner().stop();
            },
            error: function (err) {
                if (err.redirectUrl) {
                    window.location.href = err.redirectUrl;
                } else {
                    promo.createErrorNotification(err.responseJSON.errorMessage);
                    $.spinner().stop();
                }
            }
        });
    });

    $('body').on('click', '.cart-page .bonus-product-button', function () {
        $.spinner().start();
        $(this).addClass('launched-modal');
        $.ajax({
            url: $(this).data('url'),
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                base.methods.editBonusProducts(data);
                $.spinner().stop();
            },
            error: function () {
                $.spinner().stop();
            }
        });
    });

    $('body').on('hidden.bs.modal', '#chooseBonusProductModal', function () {
        $('#chooseBonusProductModal').remove();
        $('.modal-backdrop').remove();
        $('body').removeClass('modal-open');

        if ($('.cart-page').length) {
            $('.launched-modal .btn-outline-primary').trigger('focus');
            $('.launched-modal').removeClass('launched-modal');
        } else {
            $('.product-detail .add-to-cart').focus();
        }
    });

    $('body').on('click', '.cart-page .product-edit .edit, .cart-page .bundle-edit .edit', function (e) {
        e.preventDefault();

        var editProductUrl = $(this).attr('href');
        getModalHtmlElement();
        fillModalElement(editProductUrl);
    });
    /* $('body').on('click', '.clickable.add-block.add-accent .edit', function (e) {
        e.preventDefault();
        var accentswiper = new Swiper(".mySwiper-acc", {
            direction: "horizontal",
            slidesPerView: "auto",
            freeMode: true,
            scrollbar: {
              el: ".swiper-scrollbar",
              draggable: true,
              dragSize: 250
            },
            mousewheel: true
          });
        // let accentingColor = $('.color-pointer').attr('data-accentingskus');
        // var accentingSKUs = document.querySelector('#accentingskusCart').value;
        // var accentingskus = accentingSKUs.split(',');
        var editProductUrl = $(this).attr('href');
        getModalHtmlElement();
        fillModalElementAccent(editProductUrl);
    }); */

    $('body').on('shown.bs.modal', '#editProductModal', function () {
        $('#editProductModal').siblings().attr('aria-hidden', 'true');
        $('#editProductModal .close').focus();
    });

    $('body').on('hidden.bs.modal', '#editProductModal', function () {
        $('#editProductModal').siblings().attr('aria-hidden', 'false');
    });

    $('body').on('keydown', '#editProductModal', function (e) {
        var focusParams = {
            event: e,
            containerSelector: '#editProductModal',
            firstElementSelector: '.close',
            lastElementSelector: '.update-cart-product-global',
            nextToLastElementSelector: '.modal-footer .quantity-select'
        };
        focusHelper.setTabNextFocus(focusParams);
    });

    $('body').on('product:updateAddToCart', function (e, response) {
        // update global add to cart (single products, bundles)
        var dialog = $(response.$productContainer)
            .closest('.quick-view-dialog');

        $('.update-cart-product-global', dialog).attr('disabled',
            !$('.global-availability', dialog).data('ready-to-order') ||
            !$('.global-availability', dialog).data('available')
        );
    });

    $('body').on('product:updateAvailability', function (e, response) {
        // bundle individual products
        $('.product-availability', response.$productContainer)
            .data('ready-to-order', response.product.readyToOrder)
            .data('available', response.product.available)
            .find('.availability-msg')
            .empty()
            .html(response.message);


        var dialog = $(response.$productContainer)
            .closest('.quick-view-dialog');

        if ($('.product-availability', dialog).length) {
            // bundle all products
            var allAvailable = $('.product-availability', dialog).toArray()
                .every(function (item) {
                    return $(item).data('available');
                });

            var allReady = $('.product-availability', dialog).toArray()
                .every(function (item) {
                    return $(item).data('ready-to-order');
                });

            $('.global-availability', dialog)
                .data('ready-to-order', allReady)
                .data('available', allAvailable);

            $('.global-availability .availability-msg', dialog).empty()
                .html(allReady ? response.message : response.resources.info_selectforstock);
        } else {
            // single product
            $('.global-availability', dialog)
                .data('ready-to-order', response.product.readyToOrder)
                .data('available', response.product.available)
                .find('.availability-msg')
                .empty()
                .html(response.message);
        }
    });

    $('body').on('product:afterAttributeSelect', function (e, response) {
        if ($('.modal.show .product-quickview .bundle-items').length) {
            $('.modal.show').find(response.container).data('pid', response.data.product.id);
            $('.modal.show').find(response.container).find('.product-id').text(response.data.product.id);
        } else {
            $('.modal.show .product-quickview').attr('data-pid', response.data.product.id);
        }
    });

    $('body').on('change', '.quantity-select', function () {
        var selectedQuantity = $(this).val();
        $('.modal.show .update-cart-url').data('selected-quantity', selectedQuantity);
    });

    $('body').on('change', '.options-select', function () {
        var selectedOptionValueId = $(this).children('option:selected').data('value-id');
        $('.modal.show .update-cart-url').data('selected-option', selectedOptionValueId);
    });

    $('body').on('click', '.update-cart-product-global', function (e) {
        e.preventDefault();

        var updateProductUrl = $(this).closest('.cart-and-ipay').find('.update-cart-url').val();
        var selectedQuantity = $(this).closest('.cart-and-ipay').find('.update-cart-url').data('selected-quantity');
        var selectedOptionValueId = $(this).closest('.cart-and-ipay').find('.update-cart-url').data('selected-option');
        var uuid = $(this).closest('.cart-and-ipay').find('.update-cart-url').data('uuid');
        var accentID = $('.accents-button.selected').attr('data-attr-accent-value');
        var form = {
            uuid: uuid,
            pid: $('button.accents-button.no-accents-button.clicked.selected').data('baseaccentingsku') || base.getPidValue($(this)),
            quantity: selectedQuantity,
            selectedOptionValueId: selectedOptionValueId
        };

        $(this).parents('.card').spinner().start();

        $('body').trigger('cart:beforeUpdate');

        if (updateProductUrl) {
            $.ajax({
                url: updateProductUrl,
                type: 'post',
                context: this,
                data: form,
                dataType: 'json',
                success: function (data) {
                    $('#editProductModal').modal('hide');

                    $('.coupons-and-promos').empty().append(data.cartModel.totals.discountsHtml);
                    promo.updateCartTotals(data.cartModel);
                    promo.updateApproachingDiscounts(data.cartModel.approachingDiscounts);
                    updateAvailability(data.cartModel, uuid);
                    updateProductDetails(data, uuid);

                    if (data.uuidToBeDeleted) {
                        $('.uuid-' + data.uuidToBeDeleted).remove();
                    }

                    promo.validateBasket(data.cartModel);

                    $('body').trigger('cart:update', data);
                    $.spinner().stop();
                    location.reload();
                },
                error: function (err) {
                    $('#editProductModal .modal-footer-error').html(err.responseJSON.errorMessage);
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    } else {
                        promo.createErrorNotification(err.responseJSON.errorMessage);
                        $.spinner().stop();
                    }
                }
            });
        }
    });

    $('.toggle-value').on('click', function (e) {
        e.preventDefault();
        $(this).parent().next('.delivery-options-container').toggleClass('active');
        if ($(this).text() == "Change")
            $(this).text("Cancel")
        else
            $(this).text("Change");
    });
   
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

                $('.selected-accent-details .color').html(selectedAccent+", ");
                if(updatedPrice){
                    $('.selected-accent-details .price').html(updatedPrice);
                }
                else{
                    $('.selected-accent-details .price').empty().append(" ");
                }
                
                
                



                if(!(updatedPrice == 'null' || updatedPrice === undefined)) {
                // $('.accent-step-button-next').removeClass('disabled');
                // $('.accent-step-button-next').empty().append('Apply ('+'+'+updatedPrice+')');
                $('.update-cart-product-global').removeClass('disabled');
                $('.update-cart-product-global').empty().append('Apply ('+'+ '+updatedPrice+')');
                //$('.selected-accent-price').empty().append(', '+updatedPrice);
                } 
                else if (updatedPrice === undefined){
                    $('.update-cart-product-global').removeClass('disabled');
                    $('.update-cart-product-global').empty().append('Apply');
                    //$('.selected-accent-details .price').empty().append(" ");
                    // $('.accent-item').addClass('d-block');
                    // $('.edit-block-accent').addClass('d-none');
                    // $('.add-block.add-accent').removeClass('d-none');
                }
                else {
                    $('.update-cart-product-global').empty().append('Apply');
                    //$('.accent-step-button-next').removeClass('disabled');
                    // $('.accent-item').addClass('d-block');
                    // $('.edit-block-accent').addClass('d-none');
                    // $('.add-block.add-accent').removeClass('d-none');
                }
                let imagevalue=$('.accents-button.clicked').attr('data-accentmainimage');
                let imagetag=document.querySelector('.product-quickview .edit-productlist #productImg_0 img');
               
                if(imagetag) {
                imagetag.src=imagevalue;
                }
            }
        });        
    $('form.gift-box-form').submit(function (e) {
        e.preventDefault();
        var form = $(this);
    
        form.spinner().start();
        var url = form.attr('action');
        if (url) {
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: form.serialize(),
                success: function (data) {
                    form.spinner().stop();
                    console.log(data);
                    location.reload();
                },
                error: function () {
                    form.spinner().stop();
                }
            });
        }
    });

    $('.remove-giftItem').on('click', function (e) {
        var url = $(this).attr("href");
        $.ajax({
            url: url,
            type: 'get',
            data: {},
            success: function () {
                $.spinner().stop();
                location.reload();
            },
        });
    });


    $(document).on('cart:loginUpdate', function () {
        location.reload();
    });
    
    $(window).on('load', function() {
        $('.third-party-dom').removeClass('third-party-dom');
    });

    base.selectAttribute();
    base.colorAttribute();
    if ($('.cart-page').length || $('.cart-empty').length){
        base.addToCart();
    }
    base.removeBonusProduct();
    base.selectBonusProduct();
    base.enableBonusProductSelection();
    base.showMoreBonusProducts();
    base.addBonusProductsToCart();
    base.focusChooseBonusProductModal();
    base.trapChooseBonusProductModalFocus();
    base.onClosingChooseBonusProductModal();
    //base.accentColorAttribute();
    // base.accentDefaultButton();
    accent.base();
    accent.editAccentModal();
    accent.provideEditAccentModal();
    accent.provideAddAccentModal();
    accent.removeAccent();
};