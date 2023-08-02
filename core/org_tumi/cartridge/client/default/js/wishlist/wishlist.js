'use strict';
var wishlist = require('wishlist/wishlist/wishlist');
var base = require('../product/base');

/**
 * @param {Object} $elementAppendTo - The element to append error html to
 * @param {string} msg - The error message
 * display error message if remove item from wishlist failed
 */

function displayErrorMessage($elementAppendTo, msg) {
    if ($('.remove-from-wishlist-messages').length === 0) {
        $elementAppendTo.append(
            '<div class="remove-from-wishlist-messages "></div>'
        );
    }
    $('.remove-from-wishlist-messages')
        .append('<div class="remove-from-wishlist-alert text-center alert-danger">' + msg + '</div>');

    setTimeout(function () {
        $('.remove-from-wishlist-messages').remove();
    }, 3000);
}

/**
 * Updates the Mini-Cart quantity value after the customer has pressed the "Add to Cart" button
 * @param {string} response - ajax response from clicking the add to cart button
 */
function handlePostCartAdd(response) {
    $('.minicart').trigger('count:update', response);
    var messageType = response.error ? 'alert-danger' : 'alert-success';

    if ($('.add-to-cart-messages').length === 0) {
        $('body').append(
            '<div class="add-to-cart-messages"></div>'
        );
    }

    $('.add-to-cart-messages').append(
        '<div class="alert ' + messageType + ' add-to-basket-alert text-center" role="alert">' +
        response.message +
        '</div>'
    );

    setTimeout(function () {
        $('.add-to-basket-alert').remove();
    }, 5000);
}

/**
 * renders the list up to a given page number
 * @param {number} pageNumber - current page number
 * @param {boolean} spinner - if the spinner has already started
 * @param {string} focusElementSelector - selector of the element to focus on
 */
function renderNewPageOfItems(pageNumber, spinner, focusElementSelector) {
    var publicView = $('.wishlistItemCardsData').data('public-view');
    var listUUID = $('.wishlistItemCardsData').data('uuid');
    var url = $('.wishlistItemCardsData').data('href');
    if (spinner) {
        $.spinner().start();
    }
    var scrollPosition = document.documentElement.scrollTop;
    var newPageNumber = pageNumber;
    $.ajax({
        url: url,
        method: 'get',
        data: {
            pageNumber: ++newPageNumber,
            publicView: publicView,
            id: listUUID
        }
    }).done(function (data) {
        // $('.wishlistItemCards').empty();
        $('body .wishlistItemWrapper').html(data);
        // $('body .wishlistItemCards').append(data);
        var savedItemCount = $('.wishlistItemWrapper .product').length;
        savedItemCount = savedItemCount > 0 ? ' (' + savedItemCount + ')' : '';
        $('.wishlist-title h3').html('Saved Items' + savedItemCount);
        $('.wishlist-quantity').html(savedItemCount);
        if ($('div .text-center').hasClass('empty-wishlist')) {
            $('.category-banner').addClass('empty-list-heading');
        }
        if (focusElementSelector) {
            $(focusElementSelector).focus();
        } else {
            document.documentElement.scrollTop = scrollPosition;
        }
    }).fail(function () {
        $('.more-wl-items').remove();
    });
    $.spinner().stop();
}

/**
 * Excecute this function after Cart-AddProduct to remove product fro SFL List
 // eslint-disable-next-line valid-jsdoc
 * @param {string} pid - pid for deleting product
*/
function movetoCartFromSFL(pid) {
    var url = $('.remove-from-sfl-url').val() + '?pid=' + pid;

    var elMyAccount = $('.account-wishlist-item').length;

    // If user is in my account page, call removeWishlistAccount() end point, re-render wishlist cards
    if (elMyAccount > 0) {
        $('.wishlist-account-card').spinner().start();
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'html',
            data: {},
            success: function (html) {
                $('.wishlist-account-card>.card').remove();
                $('.wishlist-account-card').append(html);
                $('.wishlist-account-card').spinner().stop();
                window.location.reload();
            },
            error: function () {
                var $elToAppend = $('.wishlist-account-card');
                $elToAppend.spinner().stop();
                var msg = $elToAppend.data('error-msg');
                displayErrorMessage($elToAppend, msg);
            }
        });
        // else user is in wishlist landing page, call removeProduct() end point, then remove this card
    } else {
        $.spinner().start();
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            data: {},
            success: function (data) {
                var wishlistPidArray = data.wishlistPidArray;
                sessionStorage.setItem('wishlistPidArray', wishlistPidArray);
                var pageNumber = $('.wishlistItemCardsData').data('page-number') - 1;
                renderNewPageOfItems(pageNumber, false);
                var isCartPage = $('div.saved-items-lp').length > 0;
                if (!isCartPage) {
                    window.location.reload();
                }
            },
            error: function () {
                $.spinner().stop();
                var $elToAppendWL = $('.wishlistItemCards');
                var msg = $elToAppendWL.data('error-msg');
                displayErrorMessage($elToAppendWL, msg);
            }
        });
    }
}

wishlist.sortByFilter = function () {
    $('.sort-filter').on('change', function (e) {
        var url;
        if (window.location.href.indexOf('?') != -1) {
            url = window.location.href.substring(0, window.location.href.indexOf('?'));
        }
        else {
            url = window.location.href;
        }
        var currentFilterVal = e.target.value;
        url = url + "?sort=" + currentFilterVal;
        console.log(url);
        window.location = url;
    })
}
wishlist.addToCartFromWishlist = function () {
    $('body').on('click', '.add-to-cart', function () {
        var pid;
        var addToCartUrl;

        $('body').trigger('product:beforeAddToCart', this);

        pid = $(this).data('pid');
        addToCartUrl = $(this).data('url');
        var form = {
            pid: pid,
            quantity: 1
        };

        if ($(this).data('option')) {
            form.options = JSON.stringify($(this).data('option'));
        }

        $(this).trigger('updateAddToCartFormData', form);
        if (addToCartUrl) {
            $.ajax({
                url: addToCartUrl,
                method: 'POST',
                data: form,
                success: function (data) {
                    handlePostCartAdd(data);
                    $('#flyout-minicart').html(base.minicartFlyout(data));
                    $('#miniCartModal').modal('show');
                    $('body').trigger('product:afterAddToCart', data);
                    $.spinner().stop();
                    base.miniCartReportingUrl(data.reportingURL, data.error);
                    movetoCartFromSFL(pid);
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        }
    });
}

module.exports = wishlist;