'use strict';

var base = require('base/product/base');

/**
 * Updates the Mini-Cart quantity value after the customer has pressed the "Add to Cart" button
 * @param {string} response - ajax response from clicking the add to cart button
 */
function handlePostBuyNow(response) {
    var messageType = 'alert-danger';
    // show add to cart toast
    if ($('.add-to-cart-messages').length === 0) {
        $('body').append(
            '<div class="add-to-cart-messages"></div>'
        );
    }
    $('.add-to-cart-messages').append(
        '<div class="alert ' + messageType + ' add-to-basket-alert text-center" role="alert">' +
        response.errorMsg +
        '</div>'
    );
    setTimeout(function () {
        $('.add-to-basket-alert').remove();
    }, 5000);
}

/**
 * Retrieves the bundle product item ID's for the Controller to replace bundle master product
 * items with their selected variants
 *
 * @return {string[]} - List of selected bundle product item ID's
 */
function getChildProducts() {
    var childProducts = [];
    $('.bundle-item').each(function () {
        childProducts.push({
            pid: $(this).find('.product-id').text(),
            quantity: parseInt($(this).find('label.quantity').data('quantity'), 10)
        });
    });

    return childProducts.length ? JSON.stringify(childProducts) : [];
}

/**
 * Retrieve product options
 *
 * @param {jQuery} $productContainer - DOM element for current product
 * @return {string} - Product options and their selected values
 */
function getOptions($productContainer) {
    var options = $productContainer
        .find('.product-option')
        .map(function () {
            var $elOption = $(this).find('.options-select');
            var urlValue = $elOption.val();
            var selectedValueId = $elOption.find('option[value="' + urlValue + '"]')
                .data('value-id');
            return {
                optionId: $(this).data('option-id'),
                selectedValueId: selectedValueId
            };
        }).toArray();

    return JSON.stringify(options);
}

function onBuyNow() {
    $(document).on('click', 'button.buy-it-now', function () {
        var addToCartUrl;
        var pid;
        var pidsObj;
        var setPids;

        if ($('.set-items').length) {
            setPids = [];
            $('.product-detail').each(function () {
                if (!$(this).hasClass('product-set-detail')) {
                    setPids.push({
                        pid: $(this).find('.product-id').text(),
                        qty: $(this).find('.quantity-select').val(),
                        options: getOptions($(this))
                    });
                }
            });
            pidsObj = JSON.stringify(setPids);
        }

        pid = base.getPidValue($(this));

        var $productContainer = $(this).closest('.product-detail');
        if (!$productContainer.length) {
            $productContainer = $(this).closest('.quick-view-dialog').find('.product-detail');
        }

        addToCartUrl = $(this).data('buyurl');
        var tumiJson = $('.monogram-item.edit-monogram').attr('data-form');

        var form = {
            pid: pid,
            pidsObj: pidsObj,
            childProducts: getChildProducts(),
            quantity: base.getQuantitySelected($(this)),
            personalizationData: tumiJson
        };

        if (!$('.bundle-item').length) {
            form.options = getOptions($productContainer);
        }

        $.spinner().start();
        if (addToCartUrl) {
            $.ajax({
                url: addToCartUrl,
                method: 'POST',
                data: form,
                success: function (data) {
                    $.spinner().stop();
                    if (data.success && data.redirectURL) {
                        window.location.href = data.redirectURL;
                    } else {
                        handlePostBuyNow(data);
                    }
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        }
    });
}

function onVariationUpdate() {
    $('body').on('product:updateAddToCart', function (e, response) {
        // update local add to cart (for sets)
        $('button.buy-it-now', response.$productContainer).attr('disabled', (!response.product.readyToOrder || !response.product.available));
    });
}

module.exports = {
    onBuyNow: onBuyNow,
    onVariationUpdate: onVariationUpdate
}