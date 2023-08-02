'use strict';

var scrollAnimate = require('base/components/scrollAnimate');

/**
 * appends params to a url
 * @param {string} data - data returned from the server's ajax call
 * @param {Object} button - button that was clicked for email sign-up
 */
function displayMessage(data, button) {
    $.spinner().stop();
    var status;
    if (data.success) {
        status = 'alert-success';
    } else {
        status = 'alert-danger';
    }

    if ($('.email-signup-message').length === 0) {
        $('body').append(
           '<div class="email-signup-message"></div>'
        );
    }
    $('.email-signup-message')
        .append('<div class="email-signup-alert text-center ' + status + '">' + data.msg + '</div>');

    setTimeout(function () {
        $('.email-signup-message').remove();
        button.removeAttr('disabled');
    }, 3000);
}

function validateTracerInput(tracerNumber) {
    var isValid = true;
    var tracerLen = tracerNumber.length;
    var invalidFeedback = $('body').find('.footer-register .tumi-tracer-response');
    var regexCheck = /^[0-9]*$/.test(tracerNumber);
    if (tracerLen === 0 || tracerNumber === '') {
        invalidFeedback.html($('body').find('.footer-register .tracer-email').attr('data-missing-error'));
        isValid = false;
        invalidFeedback.css('display','block');
    } else if (tracerLen !== 20) {
        invalidFeedback.html($('body').find('.footer-register .tracer-email').attr('data-parse-error'));
        isValid = false;
        invalidFeedback.css('display','block');
    } else if (!regexCheck) {
        invalidFeedback.html($('body').find('.footer-register .tracer-email').attr('data-length-error'));
        isValid = false;
        invalidFeedback.css('display','block');
    } else {
        invalidFeedback.css('display','none');
        invalidFeedback.html('');
    }
    return isValid;
}

module.exports = function () {
    $('.back-to-top').click(function () {
        scrollAnimate();
    });

    $('.subscribe-email').on('click', function (e) {
        e.preventDefault();
        var url = $(this).data('href');
        var button = $(this);
        var emailId = $('input[name=hpEmailSignUp]').val();
        $.spinner().start();
        $(this).attr('disabled', true);
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: {
                emailId: emailId
            },
            success: function (data) {
                displayMessage(data, button);
            },
            error: function (err) {
                displayMessage(err, button);
            }
        });
    });

    $('.footer-register .input-group-append button').on('click', function (e) {
        e.preventDefault();
        var tracerNumber = $('.footer-register .tracer-email').val();
        if (validateTracerInput(tracerNumber)) {
            var urlString = $('.footer-register form').attr('action');
            var url = new URL(urlString);
            var searchParams = url.searchParams;
            searchParams.set('tracerID', tracerNumber);
            window.location.href = url.href;
        }
    });

    let footerLinkTitles = document.querySelectorAll('ul.footer-menu-links .title');
    let footerSubLinks = document.querySelectorAll('.footer-menu-sub-links');
    var screenWidth = $(window).width();

    if (screenWidth < 1024) {
        footerLinkTitles.forEach(title => {
            title.addEventListener('click', (e) => {
                e.preventDefault();
                title.classList.toggle('active');
                let getAttr = title.getAttribute("id");
                matchRel(getAttr);
            })
        })
    }

    let matchRel = (linkAttr) => {
      footerSubLinks.forEach( subLink => {
        let subLinkAttr = subLink.getAttribute("aria-labelledby");
        if(subLinkAttr === linkAttr){
          subLink.classList.toggle("active");
        }
      })
    }
};
