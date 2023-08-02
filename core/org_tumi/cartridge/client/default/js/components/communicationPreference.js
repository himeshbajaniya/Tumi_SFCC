'use strict';

module.exports = function () {
    $(document).on('submit','form.communication-pref-form', function (e) {
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
                },
                error: function () {
                    form.spinner().stop();
                }
            });
        }
    });
};
