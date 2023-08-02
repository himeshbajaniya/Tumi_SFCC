
/**
 * Display the returned message.
 * @param {string} data - data returned from the server's ajax call
 * @param {Object} button - button that was clicked for contact us sign-up
 */
 function displayMessage(data, button) {
    $.spinner().stop();
    var status;
    if (data.success) {
        status = 'alert-success';
    } else {
        status = 'alert-danger';
    }

    if ($('.send-inquiry-message').length === 0) {
        $('body').append(
            '<div class="send-inquiry-message"></div>'
        );
    }
    $('.send-inquiry-message')
        .append('<div class="send-inquiry-alert text-center ' + status + '" role="alert">' + data.msg + '</div>');

    setTimeout(function () {
        $('.send-inquiry-message').remove();
        button.removeAttr('disabled');
    }, 3000);
}


module.exports = {
    sendInquiry: function () {
        $('form.inquiryForm').submit(function (e) {
            e.preventDefault();
            var form = $(this);
            var button = $('.submitInquiry');
            var url = form.attr('action');

            $.spinner().start();
            button.attr('disabled', true);
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: form.serialize(),
                success: function (data) {
                    displayMessage(data, button);
                    if (data.success) {
                        $('.contact-us').trigger('reset');
                    }
                },
                error: function (err) {
                    displayMessage(err, button);
                }
            });
        });
    }
};
