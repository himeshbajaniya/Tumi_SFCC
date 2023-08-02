'use strict';

var showStatus = require('./components/showStatus');

module.exports = {
    navigateNavsTab: function () {
        $('.js-tab').on('click', '.js-tablinks', function () {
            var target = $(this);
            var id = target.attr('data');

            $('.js-tablinks').each(function (i, elem) {
                if ($(elem).attr('data') !== id) {
                    $(elem).removeClass('active');
                }
            });
            $('.js-tabcontent').each(function (i, elem) {
                if ($(elem).attr('id') !== id) {
                    $(elem).hide();
                }
            });
            target.addClass('active');
            $('#' + id).show();
        });
    },
    hideNotification: function () {
        $('.js-tab').on('click', function () {
            showStatus();
        });
    }
};
