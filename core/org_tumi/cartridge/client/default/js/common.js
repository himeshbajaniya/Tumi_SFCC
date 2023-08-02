"use strict";

module.exports = {
    checkUserLoggedIn: function () {
        var screenWidth = $(window).width();
        if (screenWidth > 1024) {
            $('#footer-my-account, [aria-labelledby="footer-my-account"] a:eq(0)').on('click', function(e) {
                e.preventDefault();
                var href=$('#footer-my-account').attr("href")
                if($('#myaccount').length > 0) {
                    window.location = $('#footer-my-account').attr("href");
                } else {
                    $('#requestLoginModal').modal('show');
                }
            });
        } else {
            $('[aria-labelledby="footer-my-account"] a:eq(0)').on('click', function(e) {
                e.preventDefault();
                if($('#myaccount').length > 0) {
                    window.location = $('#footer-my-account').attr("href");
                } else {
                    $('#requestLoginModal').modal('show');
                }
            });
        }
    },
    janrinButtontexts: function () {
        $('.janrain-provider-text-color-googleplus').html('Sign in with Google');
        $('.janrain-provider-text-color-apple').html('Sign in with Apple');
        $('.janrain-provider-text-color-facebook').html('Sign in with Facebook');
    },
    registerType: function() {
        let serviceRepairsSignin = document.querySelector(".service-repairs-signin");
        if(serviceRepairsSignin) {
            serviceRepairsSignin.addEventListener('click', () => {
                document.querySelector("li.login-tab a.nav-link").classList.add("active");
                document.querySelector("li.register-tab a.nav-link").classList.remove("active");
                document.querySelector("li#login div.tab-pane").classList.add("active");
                document.querySelector("li#register div.tab-pane").classList.remove("active");
            })
        }

        let serviceRepairsRegister = document.querySelector(".service-repairs-register");
        if(serviceRepairsRegister) {
            serviceRepairsRegister.addEventListener('click', () => {
                document.querySelector("li.register-tab a.nav-link").classList.add("active");
                document.querySelector("li.login-tab a.nav-link").classList.remove("active");
                document.querySelector("li#register div.tab-pane").classList.add("active");
                document.querySelector("li#login div.tab-pane").classList.remove("active");
            })
        }
    },
    tooltip: function() {
        $('[data-toggle="tooltip"]').tooltip({
            trigger: 'hover focus',
            placement: 'bottom',
            html: true,
            title: '<a href="#" class="close" data-dismiss="alert">&times;</a>',
        });
        
        $('[data-toggle="tooltip"]').on('click', function () {
            setTimeout(function () {
                $('.tooltip-inner').prepend('<a href="javascript:void(0)" class="close close-tooltip" data-dismiss="alert">&times;</a>');
            }, 100);
        });
        $(document).on('click', '.close-tooltip', function () {
            var targEle = $(this).closest('.tooltip').attr('id');
            $('[aria-describedby = "'+targEle+'"]').click();
        });
    },
    logoutPopup: function() {
        var pageName = (window.pageContext) ? window.pageContext.ns : '';
        var urlParam = window.location.href.indexOf('rurl=1');

        if (pageName === 'homepage' && urlParam > -1){
            $('[data-target="#requestLoginModal"]').click();
        }
    },
    timerInitialize: function() {
        var timerEle = document.querySelectorAll('.countdown-time');
        timerEle.forEach(element => {
            var ID = element.dataset.id
            this.countdownTimer('.'+ID)
        });
    },
    countdownTimer: function(dateEle) {
        var dateTime = $(dateEle).closest('.countdown-time').find('.end-time').val(),
            countDownDate = new Date(dateTime).getTime(),
            myfunc = setInterval(function() {
            var now = new Date().getTime(),
                timeleft = countDownDate - now,
                days = Math.floor(timeleft / (1000 * 60 * 60 * 24)),
                hours = Math.floor((timeleft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes = Math.floor((timeleft % (1000 * 60 * 60)) / (1000 * 60)),
                seconds = Math.floor((timeleft % (1000 * 60)) / 1000);
            if (days > 0) {
                $(dateEle+' .days').html(days + (days > 1 ? ' days' : ' day'))
            } else { 
                $(dateEle+' .days').html('')
                $(dateEle+' .hours').html(hours < 10 ? '0' + hours + ':' : hours + ':')
                $(dateEle+' .mins').html(minutes < 10 ? '0' + minutes + ':' : minutes + ':')
                $(dateEle+' .secs').html(seconds < 10 ? '0' + seconds : seconds)
            }

            if (timeleft < 0) {
                clearInterval(myfunc);
                $(dateEle+' .hours').html('')
                $(dateEle+' .mins').html('')
                $(dateEle+' .secs').html('')
            }
        }, 1000);
    },

    orderSummeryinMobile: function () {
        $(document).on('click', '.mobile-cart-review', function(e){
            e.preventDefault();
            $('.order-mobile').toggleClass('d-block');
            $('.mobile-cart-review .text-right').toggleClass('svg-icon');
        });
    },
    confirmationPageCreateAccount: function () {
        if($('.order-confirmation').length > 0) {
            $('#requestLoginModal').on('shown.bs.modal', function (e) {
                if (e.relatedTarget.dataset.login === "create-account") {
                    $('#register-tab').trigger('click');
                } else {
                    $('#login-tab').trigger('click');
                }
            });
        }
    }
};