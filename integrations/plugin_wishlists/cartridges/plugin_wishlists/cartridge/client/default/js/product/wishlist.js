'use strict';

/**
 * appends params to a url
 * @param {string} data - data returned from the server's ajax call
 */
function displayMessageAndRemoveFromCart(data) {
    $.spinner().stop();
    var status = data.success ? 'alert-success' : 'alert-danger';

    if ($('.add-to-wishlist-messages').length === 0) {
        $('body').append('<div class="add-to-wishlist-messages "></div>');
    }
    $('.add-to-wishlist-messages')
        .append('<div class="add-to-wishlist-alert text-center ' + status + '">' + data.msg + '</div>');

    setTimeout(function () {
        $('.add-to-wishlist-messages').remove();
    }, 1500);
    // var $targetElement = $('a[data-pid="' + data.pid + '"]').closest('.product-info').find('.remove-product');
    // var itemToMove = {
    //     actionUrl: $targetElement.data('action'),
    //     productID: $targetElement.data('pid'),
    //     productName: $targetElement.data('name'),
    //     uuid: $targetElement.data('uuid')
    // };
    // $('body').trigger('afterRemoveFromCart', itemToMove);
    // console.log('removed from cart');
    // confirmDelete(itemToMove.actionUrl, itemToMove.productID, itemToMove.productName, itemToMove.uuid);

// setTimeout(function () {
//     $('.cart.cart-page #removeProductModal');
// }, 2000);
// setTimeout(function () {
//     $('.cart.cart-page #removeProductModal').modal();
// }, 2000);
}

$('.product-move .move').on('click', function (e) {
    e.preventDefault();
    var url = $(this).attr('href');
    var pid = $(this).attr('data-pid');
    var optionId = $(this).closest('.product-info').find('.lineItem-options-values').data('option-id');
    var optionVal = $(this).closest('.product-info').find('.lineItem-options-values').data('value-id');
    optionId = optionId || null;
    optionVal = optionVal || null;
    if (!url || !pid) {
        return;
    }

    $.spinner().start();
    $.ajax({
        url: url,
        type: 'post',
        dataType: 'json',
        data: {
            pid: pid,
            optionId: optionId,
            optionVal: optionVal
        },
        success: function (data) {
            location.reload(); // eslint-disable-line no-restricted-globals
            displayMessageAndRemoveFromCart(data);
        },
        error: function (err) {
            console.log('error sfl move'); // eslint-disable-line no-console
            displayMessageAndRemoveFromCart(err);
        }
    });
});

/**
 * appends params to a url
 * @param {string} data - data returned from the server's ajax call
 * @param {Object} button - button that was clicked to add a product to the wishlist
 */
function displayMessage(data, button) {
    $.spinner().stop();
    var status;
    if (data.success) {
        status = 'alert-success';
    } else {
        status = 'alert-danger';
    }

    if ($('.add-to-wishlist-messages').length === 0) {
        $('body').append(
            '<div class="add-to-wishlist-messages "></div>'
        );
    }
    $('.add-to-wishlist-messages')
        .append('<div class="add-to-wishlist-alert text-center ' + status + '">' + data.msg + '</div>');

    setTimeout(function () {
        $('.add-to-wishlist-messages').remove();
        button.removeAttr('disabled');
    }, 5000);
}

module.exports = {
    addToWishlist: function () {
        $('.add-to-wish-list').on('click', function (e) {
            e.preventDefault();
            var url = $(this).data('href');
            var button = $(this);
            var pid = $(this).closest('.product-detail').find('.product-id').html();
            var optionId = $(this).closest('.product-detail').find('.product-option').attr('data-option-id');
            var optionVal = $(this).closest('.product-detail').find('.options-select option:selected').attr('data-value-id');
            optionId = optionId || null;
            optionVal = optionVal || null;
            if (!url || !pid) {
                return;
            }

            $.spinner().start();
            $(this).attr('disabled', true);
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: {
                    pid: pid,
                    optionId: optionId,
                    optionVal: optionVal
                },
                success: function (data) {
                    displayMessage(data, button);
                },
                error: function (err) {
                    displayMessage(err, button);
                }
            });
        });
    }
};
