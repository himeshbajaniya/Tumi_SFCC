'use strict';

var showStatus = require('./components/showStatus');

module.exports = {
    submitForms: function () {
        $('.js-forms').on('submit', function (event) {
            var $form = $(this);
            event.preventDefault();
            var url = $form.attr('action');

            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: $form.serialize(),
                success: function (data) {
                    if (data.success) {
                        showStatus('success', data.responseText);
                    } else {
                        showStatus('error', data.responseText);
                    }
                },
                error: function () {
                    showStatus('error', $('.js-body-error-message').attr('data-check-logs'));
                }
            });
        });
    }
};
