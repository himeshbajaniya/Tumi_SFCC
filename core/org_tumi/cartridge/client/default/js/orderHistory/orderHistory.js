'use strict';

module.exports = function () {
    $('body').on('change', '.order-history-select', function (e) {
        var $ordersContainer = $('.order-list-container');
        $ordersContainer.empty();
        $.spinner().start();
        $('.order-history-select').trigger('orderHistory:sort', e);
        $.ajax({
            url: e.currentTarget.value,
            method: 'GET',
            success: function (data) {
                $ordersContainer.html(data);
                $.spinner().stop();
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                }
                $.spinner().stop();
            }
        });
    });

    $(document).on('click', '.load-more', function (e) {
        var loadMoreURL = $(this).data('url');
        var $loadMoreOrders = $('.load-more-orders');
        $('.order-history-select').trigger('orderHistory:sort', e);
        $.spinner().start();
        $.ajax({
            url: loadMoreURL,
            method: 'GET',
            success: function (data) {
                $loadMoreOrders.replaceWith(data);
                $.spinner().stop();
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                }
                $.spinner().stop();
            }
        });
    });

    $(document).on('input', '.order-search-field', function () {
        if ($(this).val().length > 1) {
            $('.clear-search-button').css('z-index', 1);
        } else {
            $('.clear-search-button').css('z-index', 0);
        }
    });

    $(document).on('click', '.clear-search-button', function () {
        $(this).css('z-index', 0);
        $('.order-search-field').focus();
    });
};
