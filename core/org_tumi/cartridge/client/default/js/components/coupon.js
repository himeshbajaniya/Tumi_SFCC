'use strict';
/**
 * re-renders the order totals and the number of items in the cart
 * @param {Object} data - AJAX response from the server
 */
function updateCartTotals(data) {
    $('.number-of-items').empty().append(data.resources.numberOfItems);
    $('.shipping-cost').empty().append(data.totals.totalShippingCost);
    $('.tax-total').empty().append(data.totals.totalTax);
    $('.grand-total').empty().append(data.totals.grandTotal);
    $('.order-discount-total').empty()
        .append('- ' + data.totals.totalDiscount.formatted);
    $('.sub-total').empty().append(data.totals.subTotal);
    $('.minicart-quantity').empty().append(data.numItems);
    $('.minicart-link').attr({
        'aria-label': data.resources.minicartCountOfItems,
        title: data.resources.minicartCountOfItems
    });
    if (data.totals.totalDiscount.value > 0) {
        $('.order-discount').removeClass('hide-order-discount');
    } else {
        $('.order-discount').addClass('hide-order-discount');
    }

    if (data.totals.shippingLevelDiscountTotal.value > 0) {
        $('.shipping-discount').removeClass('hide-shipping-discount');
        $('.shipping-discount-total').empty().append('- ' +
            data.totals.shippingLevelDiscountTotal.formatted);
    } else {
        $('.shipping-discount').addClass('hide-shipping-discount');
    }

    data.items.forEach(function (item) {
        if (data.totals.totalDiscount.value > 0) {
            $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
        }
        if (item.renderedPromotions) {
            $('.item-' + item.UUID).empty().append(item.renderedPromotions);
        } else {
            $('.item-' + item.UUID).empty();
        }
        $('.uuid-' + item.UUID + ' .unit-price').empty().append(item.renderedPrice);
        $('.line-item-price-' + item.UUID + ' .unit-price').empty().append(item.renderedPrice);
        $('.item-total-' + item.UUID).empty().append(item.priceTotal.renderedPrice);
        if (item.shipmentType === 'instore' && 'availableForSelectedStore' in item && item.availableForSelectedStore) {
            $('.item-unavailable-' + item.UUID).empty();
            $('.delivery-container-item-unavailable-' + item.UUID).empty();
        } else if ('availableForShipToHome' in item && item.availableForShipToHome) {
            $('.item-unavailable-' + item.UUID).empty();
            $('.delivery-container-item-unavailable-' + item.UUID).parent().removeClass('shiptohomedisabled');
            $('.delivery-container-item-unavailable-' + item.UUID).empty();
        }
    });
}

/**
 * re-renders the approaching discount messages
 * @param {Object} approachingDiscounts - updated approaching discounts for the cart
 */
function updateApproachingDiscounts(approachingDiscounts) {
    var html = '';
    $('.approaching-discounts').empty();
    if (approachingDiscounts.length > 0) {
        approachingDiscounts.forEach(function (item) {
            html += '<div class="single-approaching-discount text-center">' +
                item.discountMsg + '</div>';
        });
    }
    $('.approaching-discounts').append(html);
}

/**
 * Checks whether the basket is valid. if invalid displays error message and disables
 * checkout button
 * @param {Object} data - AJAX response from the server
 */
function validateBasket(data) {
    if (data.valid.error) {
        if (data.valid.message) {
            var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
                'fade show" role="alert">' +
                '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
                '<span aria-hidden="true">&times;</span>' +
                '</button>' + data.valid.message + '</div>';

            $('.cart-error').empty().append(errorHtml);
        } else {
            $('.update-cart').empty().append('<div class="row"> ' +
                '<div class="col-12 text-center"> ' +
                '<h1>' + data.resources.emptyCartMsg + '</h1> ' +
                '</div> ' +
                '</div>'
            );
            $('.number-of-items').empty().append(data.resources.numberOfItems);
            $('.minicart-quantity').empty().append(data.numItems);
            $('.minicart-link').attr({
                'aria-label': data.resources.minicartCountOfItems,
                title: data.resources.minicartCountOfItems
            });
            $('.minicart .popover').empty();
            $('.minicart .popover').removeClass('show');
        }

        $('.checkout-btn').addClass('disabled');
    } else {
        $('.checkout-btn').removeClass('button--disabled');
        $('.cart-error').empty();
    }
}


/**
 * appends params to a url
 * @param {string} url - Original url
 * @param {Object} params - Parameters to append
 * @returns {string} result url with appended parameters
 */
function appendToUrl(url, params) {
    var newUrl = url;
    newUrl += (newUrl.indexOf('?') !== -1 ? '&' : '?') + Object.keys(params).map(function (key) {
        return key + '=' + encodeURIComponent(params[key]);
    }).join('&');

    return newUrl;
}


/**
 * re-renders the order totals and the number of items in the cart
 * @param {Object} message - Error message to display
 */
function createErrorNotification(message) {
    var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
        'fade show" role="alert">' +
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button>' + message + '</div>';

    $('.cart-error').append(errorHtml);
}

/**
 * re-renders the promo section on resice and the number of items in the cart
 */
function promoWrapperSwap() {
    var screenWidth = $(window).width();
    var promoDesktopEle = $('.promo-wrapper-desktop').length ? $('.promo-wrapper-desktop') : '';
    var promoMobileEle = $('.promo-wrapper-mobile').length ? $('.promo-wrapper-mobile') : '';
    if (promoDesktopEle || promoMobileEle === '') {
        return;
    }
    if (screenWidth > 640) {
        if (promoMobileEle.html() !== '') {
            promoMobileEle.children('.promo-code-container').appendTo(promoDesktopEle);
            promoMobileEle.children('.coupons-and-promos').appendTo(promoDesktopEle);
        }
    } else if (promoDesktopEle.html() !== '') {
        promoDesktopEle.children('.promo-code-container').appendTo(promoMobileEle);
        promoDesktopEle.children('.coupons-and-promos').appendTo(promoMobileEle);
    }
}

$(window).resize(function () {
    promoWrapperSwap();
});

module.exports = {
    updateCartTotals: updateCartTotals,
    updateApproachingDiscounts: updateApproachingDiscounts,
    validateBasket: validateBasket,
    createErrorNotification: createErrorNotification,
    appendToUrl: appendToUrl,
    promoCoupon: function() {
        $('.promo-code-form').on('submit', function (e) {
            e.preventDefault();
            $.spinner().start();
            $('.coupon-missing-error').hide();
            $('.coupon-error-message').empty();
            if (!$('.coupon-code-field').val()) {
                $('.promo-code-form .form-control').addClass('is-invalid');
                $('.promo-code-form .form-control').attr('aria-describedby', 'missingCouponCode');
                $('.coupon-missing-error').show();
                $.spinner().stop();
                return false;
            }
            var $form = $('.promo-code-form');
            $('.promo-code-form .form-control').removeClass('is-invalid');
            $('.coupon-error-message').empty();
            $('body').trigger('promotion:beforeUpdate');
    
            $.ajax({
                url: $form.attr('action'),
                type: 'GET',
                dataType: 'json',
                data: $form.serialize(),
                success: function (data) {
                    if (data.error && !data.updateCart) {
                        $('.promo-code-form .form-control').addClass('is-invalid');
                        $('.promo-code-form .form-control').attr('aria-describedby', 'invalidCouponCode');
                        $('.coupon-error-message').empty().append(data.errorMessage);
                        $('body').trigger('promotion:error', data);
                    } else {
                        $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
                        updateCartTotals(data);
                        if (data.totals.totalDiscount.value > 0) {
                        $('.promo-text').removeClass('d-none');
                        }
                        updateApproachingDiscounts(data.approachingDiscounts);
                        validateBasket(data);
                        $('body').trigger('promotion:success', data);
                    }
                    $('.coupon-code-field').val('');
                    if (data.error && data.updateCart) {
                        $('.promo-code-form .form-control').attr('aria-describedby', 'invalidCouponCode');
                        $('.coupon-error-message').empty().append(data.errorMessage);
                        $('body').trigger('promotion:error', data);
                    }
                    $.spinner().stop();
                },
                error: function (err) {
                    $('body').trigger('promotion:error', err);
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    } else {
                        createErrorNotification(err.errorMessage);
                        $.spinner().stop();
                    }
                }
            });
            return false;
        });
    
        $('body').on('click', '.remove-coupon', function (e) {
            e.preventDefault();
    
            var couponCode = $(this).data('code');
            var uuid = $(this).data('uuid');
            var $deleteConfirmBtn = $('.delete-coupon-confirmation-btn');
            var $productToRemoveSpan = $('.coupon-to-remove');
    
            $deleteConfirmBtn.data('uuid', uuid);
            $deleteConfirmBtn.data('code', couponCode);
    
            $productToRemoveSpan.empty().append(couponCode);
        });
    
        $('body').on('click', '.delete-coupon-confirmation-btn', function (e) {
            e.preventDefault();
    
            var url = $(this).data('action');
            var uuid = $(this).data('uuid');
            var couponCode = $(this).data('code');
            var urlParams = {
                code: couponCode,
                uuid: uuid
            };
    
            url = appendToUrl(url, urlParams);
    
            $('body > .modal-backdrop').remove();
    
            $.spinner().start();
            $('body').trigger('promotion:beforeUpdate');
            $.ajax({
                url: url,
                type: 'get',
                dataType: 'json',
                success: function (data) {
                    if (data.error && data.updateCart) {
                        $('.promo-code-form .form-control').attr('aria-describedby', 'invalidCouponCode');
                        $('.coupon-error-message').empty().append(data.errorMessage);
                        $('body').trigger('promotion:error', data);
                    }
                    $('.coupon-uuid-' + uuid).remove();
                    updateCartTotals(data);
                    if (data.totals.totalDiscount.value <= 0) {
                    $('.promo-text').addClass('d-none');
                    }
                    updateApproachingDiscounts(data.approachingDiscounts);
                    validateBasket(data);
                    $.spinner().stop();
                    $('body').trigger('promotion:success', data);
                },
                error: function (err) {
                    $('body').trigger('promotion:error', err);
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    } else {
                        createErrorNotification(err.responseJSON.errorMessage);
                        $.spinner().stop();
                    }
                }
            });
        });
        promoWrapperSwap();
    }
};
