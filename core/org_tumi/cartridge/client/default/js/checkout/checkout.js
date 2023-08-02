"use strict";

var customerHelpers = require("./customer");
var addressHelpers = require("./address");
var shippingHelpers = require("./shipping");
var billingHelpers = require("./billing");
var summaryHelpers = require("./summary");
var formHelpers = require("./formErrors");
var scrollAnimate = require("base/components/scrollAnimate");
var promo = require('../components/coupon');
var tooltip = require('../common');

/**
 * Create the jQuery Checkout Plugin.
 *
 * This jQuery plugin will be registered on the dom element in checkout.isml with the
 * id of "checkout-main".
 *
 * The checkout plugin will handle the different state the user interface is in as the user
 * progresses through the varying forms such as shipping and payment.
 *
 * Billing info and payment info are used a bit synonymously in this code.
 *
 */
(function ($) {
    $.fn.checkout = function () {
        // eslint-disable-line
        var plugin = this;

        //
        // Collect form data from user input
        //
        var formData = {
            // Customer Data
            //customer: {},

            // Shipping Address
            shipping: {},

            // Billing Address
            billing: {},

            // Payment
            payment: {},

            // Gift Codes
            giftCode: {},
        };

        //
        // The different states/stages of checkout
        //
        var checkoutStages = [
            // "customer",
            "shipping",
            "payment",
            "placeOrder",
            "submitted",
        ];

        /**
         * Updates the URL to determine stage
         * @param {number} currentStage - The current stage the user is currently on in the checkout
         */
        function updateUrl(currentStage) {
            var searchParam;
            if (currentStage === 2) {
                $('.payment-expired').hide();
            }
            if (currentStage === 1 && location.search.indexOf('?stage=payment&error=429') > -1) {
                searchParam = location.search
            } else {
                searchParam = "?stage=" + checkoutStages[currentStage]
            }
            history.pushState(
                checkoutStages[currentStage],
                document.title,
                location.pathname + searchParam + "#" + checkoutStages[currentStage]
            );
        }

        //
        // Local member methods of the Checkout plugin
        //
        var members = {
            // initialize the currentStage variable for the first time
            currentStage: 0,

            /**
             * Set or update the checkout stage (AKA the shipping, billing, payment, etc... steps)
             * @returns {Object} a promise
             */
            updateStage: function () {
                var stage = checkoutStages[members.currentStage];
                var defer = $.Deferred(); // eslint-disable-line

                // if (stage === "customer") {
                //     //
                //     // Clear Previous Errors
                //     //
                //     customerHelpers.methods.clearErrors();
                //     //
                //     // Submit the Customer Form
                //     //
                //     var customerFormSelector =
                //         customerHelpers.methods.isGuestFormActive()
                //             ? customerHelpers.vars.GUEST_FORM
                //             : customerHelpers.vars.REGISTERED_FORM;
                //     var customerForm = $(customerFormSelector);
                //     $.ajax({
                //         url: customerForm.attr("action"),
                //         type: "post",
                //         data: customerForm.serialize(),
                //         success: function (data) {
                //             if (data.redirectUrl) {
                //                 window.location.href = data.redirectUrl;
                //             } else {
                //                 customerHelpers.methods.customerFormResponse(
                //                     defer,
                //                     data
                //                 );
                //             }
                //         },
                //         error: function (err) {
                //             if (
                //                 err.responseJSON &&
                //                 err.responseJSON.redirectUrl
                //             ) {
                //                 window.location.href =
                //                     err.responseJSON.redirectUrl;
                //             }
                //             // Server error submitting form
                //             defer.reject(err.responseJSON);
                //         },
                //     });
                //     return defer;
                // } else 
                if (stage === "shipping") {
                    //
                    // Clear Previous Errors
                    //
                    formHelpers.clearPreviousErrors(".shipping-form");

                    //
                    // Submit the Shipping Address Form
                    //
                    var isMultiShip =
                        $("#checkout-main").hasClass("multi-ship");
                    var formSelector = isMultiShip
                        ? ".multi-shipping .active form"
                        : ".single-shipping .shipping-form";
                    var form = $(formSelector);

                    if (isMultiShip && form.length === 0) {
                        // disable the next:Payment button here
                        $("body").trigger(
                            "checkout:disableButton",
                            ".next-step-button button"
                        );
                        // in case the multi ship form is already submitted
                        var url = $("#checkout-main").attr(
                            "data-checkout-get-url"
                        );
                        $.ajax({
                            url: url,
                            method: "GET",
                            success: function (data) {
                                // enable the next:Payment button here
                                $("body").trigger(
                                    "checkout:enableButton",
                                    ".next-step-button button"
                                );
                                if (!data.error) {
                                    $("body").trigger(
                                        "checkout:updateCheckoutView",
                                        {
                                            order: data.order,
                                            customer: data.customer,
                                        }
                                    );
                                    
                                    defer.resolve();
                                } else if (
                                    data.message &&
                                    $(".shipping-error .alert-danger").length <
                                        1
                                ) {
                                    var errorMsg = data.message;
                                    var errorHtml =
                                        '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
                                        'fade show" role="alert">' +
                                        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
                                        '<span aria-hidden="true">&times;</span>' +
                                        "</button>" +
                                        errorMsg +
                                        "</div>";
                                    $(".shipping-error").append(errorHtml);
                                    scrollAnimate($(".shipping-error"));
                                    defer.reject();
                                } else if (data.redirectUrl) {
                                    window.location.href = data.redirectUrl;
                                }
                            },
                            error: function () {
                                // enable the next:Payment button here
                                $("body").trigger(
                                    "checkout:enableButton",
                                    ".next-step-button button"
                                );
                                // Server error submitting form
                                defer.reject();
                            },
                        });
                    } else {
                        var shippingFormData = form.serialize();

                        $("body").trigger("checkout:serializeShipping", {
                            form: form,
                            data: shippingFormData,
                            callback: function (data) {
                                shippingFormData = data;
                            },
                        });
                        // disable the next:Payment button here
                        $("body").trigger(
                            "checkout:disableButton",
                            ".next-step-button button"
                        );
                        $.ajax({
                            url: form.attr("action"),
                            type: "post",
                            data: shippingFormData,
                            success: function (data) {
                                // enable the next:Payment button here
                                $("body").trigger(
                                    "checkout:enableButton",
                                    ".next-step-button button"
                                );
                                shippingHelpers.methods.shippingFormResponse(
                                    defer,
                                    data
                                );
                                if(!data.fieldErrors && ($('.paypalExpressCheckout').val() === 'true') && ($('.paypalExpressCheckout').val() === 'true')) {
                                    location.reload();
                                }
                                if (data.order && data.order.billing && data.order.billing.billingAddress && data.order.billing.billingAddress && data.order.billing.billingAddress.address && data.order.billing.billingAddress.address.address1) {
                                    if ($('.isBasketHavingOnlyStorePickupitems').val() !== 'true') {
                                        $('.billing-address-block').addClass('checkout-hidden');
                                    }
                                }
                                if (data.fieldErrors) {
                                    $('.selectedAddress').closest('.select-current-address').find('.edit-ship-add').trigger('click');
                                }
                                if (data.order && data.order.billing) {
                                    $('html,body').animate({
                                        scrollTop: $('.card.payment-form').offset().top
                                    }, 500);
                                }
                            },
                            error: function (err) {
                                // enable the next:Payment button here
                                $("body").trigger(
                                    "checkout:enableButton",
                                    ".next-step-button button"
                                );
                                if (
                                    err.responseJSON &&
                                    err.responseJSON.redirectUrl
                                ) {
                                    window.location.href =
                                        err.responseJSON.redirectUrl;
                                }
                                // Server error submitting form
                                defer.reject(err.responseJSON);
                            },
                        });
                    }
                    return defer;
                } else if (stage === "payment") {
                    //
                    // Submit the Billing Address Form
                    //

                    formHelpers.clearPreviousErrors(".payment-form");

                    var billingAddressForm = $(
                        "#dwfrm_billing .billing-address-block :input"
                    ).serialize();

                    $("body").trigger("checkout:serializeBilling", {
                        form: $("#dwfrm_billing .billing-address-block"),
                        data: billingAddressForm,
                        callback: function (data) {
                            if (data) {
                                billingAddressForm = data;
                            }
                        },
                    });

                    var contactInfoForm = $(
                        "#billing-contact-info :input"
                    ).serialize();

                    $("body").trigger("checkout:serializeBilling", {
                        form: $("#billing-contact-info .contact-info-section"),
                        data: contactInfoForm,
                        callback: function (data) {
                            if (data) {
                                contactInfoForm = data;
                            }
                        },
                    });

                    var bopisContactInfoForm = $(
                        "#dwfrm_billing .contact-info-block :input"
                    ).serialize();

                    $("body").trigger("checkout:serializeBilling", {
                        form: $("#dwfrm_billing .contact-info-block"),
                        data:  bopisContactInfoForm,
                        callback: function (data) {
                            if (data) {
                                bopisContactInfoForm = data;
                            }
                        },
                    });

                    var activeTabId = $('#dwfrm_billing').hasClass('is-only-gc') ? 'valuetec-content' : $(".tab-pane.active").attr("id");
                    var paymentInfoSelector =
                        "#dwfrm_billing ." +
                        activeTabId +
                        " .payment-form-fields :input";
                    var paymentInfoForm = $(paymentInfoSelector).serialize();

                    $("body").trigger("checkout:serializeBilling", {
                        form: $(paymentInfoSelector),
                        data: paymentInfoForm,
                        callback: function (data) {
                            if (data) {
                                paymentInfoForm = data;
                            }
                        },
                    });

                    var paymentForm =
                        billingAddressForm +
                        "&" +
                        bopisContactInfoForm +
                        "&" +
                        contactInfoForm +
                        "&" +
                        paymentInfoForm;

                    if (
                        $(".data-checkout-stage").data("customer-type") ===
                        "registered"
                    ) {
                        // if payment method is credit card
                        if (
                            $(".payment-information").data(
                                "payment-method-id"
                            ) === "CREDIT_CARD" &&
                            $('form.is-only-gc').length === 0
                        ) {
                            if (
                                !$(".payment-information").data(
                                    "is-new-payment"
                                )
                            ) {
                                var cvvCode = $(
                                    ".saved-payment-instrument." +
                                        "selected-payment .saved-payment-security-code"
                                ).val();

                                if (cvvCode === "") {
                                    var cvvElement = $(
                                        ".saved-payment-instrument." +
                                            "selected-payment " +
                                            ".form-control"
                                    );
                                    cvvElement.addClass("is-invalid");
                                    scrollAnimate(cvvElement);
                                    defer.reject();
                                    return defer;
                                }

                                var $savedPaymentInstrument = $(
                                    ".saved-payment-instrument" +
                                        ".selected-payment"
                                );

                                paymentForm +=
                                    "&storedPaymentUUID=" +
                                    $savedPaymentInstrument.data("uuid");

                                paymentForm += "&securityCode=" + cvvCode;
                            }
                        }
                    }
                    if ($('.shippingAddressOne').length > 0 && $('.shippingAddressOne').val().length > 35) {
                        $('.change-shipping').click();
                        $('.save-continue-shipping').click();
                        defer.reject();
                        return defer;
                    }
                    // disable the next:Place Order button here
                    $("body").trigger(
                        "checkout:disableButton",
                        ".next-step-button button"
                    );

                    $.ajax({
                        url: $("#dwfrm_billing").attr("action"),
                        method: "POST",
                        data: paymentForm,
                        success: function (data) {
                            // enable the next:Place Order button here
                            $("body").trigger(
                                "checkout:enableButton",
                                ".next-step-button button"
                            );
                            // look for field validation errors
                            if (data.error) {
                                if (data.fieldErrors.length) {
                                    data.fieldErrors.forEach(function (error) {
                                        if (error && Object.keys(error).length) {
                                            formHelpers.loadFormErrors(
                                                ".payment-form",
                                                error
                                            );
                                            // Handle card number for flex
                                            if (error['dwfrm_billing_creditCardFields_cardNumber'] && !$('#cardNumber-container').hasClass('flex-microform-valid')) {
                                                $('.card-number-wrapper .invalid-feedback').text(error['dwfrm_billing_creditCardFields_cardNumber']);
                                                $('#cardNumber-container').addClass('is-invalid');
                                            }

                                            var cvvEle = $('#securityCode');
                                            if((cvvEle.val() !== "") & (cvvEle.val().length !== parseInt(cvvEle.attr('minlength')))) {
                                                cvvEle.addClass('is-invalid');
                                            }
                                        }
                                    });

                                }

                                if (data.serverErrors.length) {
                                    data.serverErrors.forEach(function (error) {
                                        $(".error-message").show();
                                        $(".error-message-text").text(error);
                                        scrollAnimate($(".error-message"));
                                    });
                                }

                                if (data.cartError) {
                                    window.location.href = data.redirectUrl;
                                }

                                if (data.klarnaOrApplePayWithGC) {
                                    $('#pay-with-giftcard').prop('checked', false).prop('disabled', true);
                                    $('#valuetec-content').removeClass('d-block');
                                    $('.giftcard-not-allowed').removeClass('d-none');
                                }

                                defer.reject();
                            } else {
                                $('.giftcard-not-allowed').addClass('d-none');
                                //
                                // Populate the Address Summary
                                //
                                $("body").trigger(
                                    "checkout:updateCheckoutView",
                                    {
                                        order: data.order,
                                        customer: data.customer,
                                    }
                                );
                                if (data.order.billing.payment &&
                                    data.order.billing.payment.selectedPaymentInstruments &&
                                    data.order.billing.payment.selectedPaymentInstruments.length > 0) {
                                        var paymentMethodClass = data.order.billing.payment.selectedPaymentInstruments ? data.order.billing.payment.selectedPaymentInstruments[0].paymentMethod : 'unknown';
                                        if($('.details-wrapper .card-number-wrapper').length > 0) {
                                            $('.details-wrapper .card-number-wrapper').attr('data-type', paymentMethodClass);
                                        }
                                    } 

                                if (data.order.billing && data.order.billing.payment && data.order.billing.payment.btnName) {
                                    if (data.order.billing.payment.selectedPaymentInstruments[0].paymentMethod === "PayPal") {
                                        var paypalName = data.order.billing.payment.btnName.lastIndexOf(" ");
                                        var paypalimage = '<svg xmlns="http://www.w3.org/2000/svg" width="63" fill="none" viewBox="0 0 188 49"><path fill="#ffffff" d="M164.01 11.446l-4.012 25.207a.643.643 0 0 0 .642.746h4.748a.701.701 0 0 0 .698-.589l4.012-25.207a.643.643 0 0 0-.642-.746h-4.748a.692.692 0 0 0-.698.589zm-5.07 7.356h-4.505a.699.699 0 0 0-.697.588l-.149.928s-3.499-3.794-9.694-1.23c-3.554 1.468-5.26 4.501-5.986 6.723 0 0-2.304 6.753 2.907 10.47 0 0 4.832 3.575 10.273-.22l-.094.592a.644.644 0 0 0 .37.686c.085.04.178.06.272.06h4.508a.692.692 0 0 0 .698-.589l2.742-17.262a.632.632 0 0 0-.149-.521.643.643 0 0 0-.496-.226zm-6.629 9.54a5.005 5.005 0 0 1-1.715 3.095 5.073 5.073 0 0 1-3.345 1.203 4.602 4.602 0 0 1-1.416-.206c-1.945-.62-3.055-2.474-2.736-4.484a5.01 5.01 0 0 1 1.717-3.093 5.08 5.08 0 0 1 3.343-1.207 4.6 4.6 0 0 1 1.416.208c1.957.616 3.062 2.473 2.741 4.485h-.005zm-24.056.477c2.443 0 4.806-.868 6.662-2.446a10.147 10.147 0 0 0 3.456-6.158c.789-4.993-3.14-9.351-8.71-9.351h-8.973a.699.699 0 0 0-.697.589L115.98 36.66a.644.644 0 0 0 .37.686c.086.04.178.06.272.06h4.751a.699.699 0 0 0 .697-.589l1.178-7.402a.692.692 0 0 1 .698-.59l4.309-.006zm3.974-8.831c-.293 1.846-1.731 3.205-4.482 3.205h-3.517l1.068-6.713h3.454c2.844.005 3.77 1.67 3.477 3.513v-.005z"/><path fill="#ffffff" d="M110.567 19.23l-5.434 9.105-2.758-9.038a.694.694 0 0 0-.672-.495h-4.904a.526.526 0 0 0-.527.446.515.515 0 0 0 .025.247l4.942 15.224-4.47 7.174a.516.516 0 0 0 .18.728.527.527 0 0 0 .269.07h5.282a.876.876 0 0 0 .751-.42l13.804-22.667a.512.512 0 0 0 .011-.53.524.524 0 0 0-.463-.263h-5.28a.877.877 0 0 0-.756.419zm-16.548-.428H89.51a.7.7 0 0 0-.698.59l-.146.927s-3.502-3.794-9.697-1.23c-3.553 1.468-5.26 4.501-5.983 6.723 0 0-2.306 6.753 2.904 10.47 0 0 4.833 3.575 10.274-.22l-.094.592a.642.642 0 0 0 .37.686c.085.04.178.06.272.06h4.508a.701.701 0 0 0 .697-.589l2.743-17.262a.642.642 0 0 0-.37-.687.655.655 0 0 0-.272-.06zm-6.63 9.542a5.011 5.011 0 0 1-1.716 3.091 5.082 5.082 0 0 1-3.343 1.206 4.605 4.605 0 0 1-1.414-.206c-1.944-.62-3.053-2.474-2.734-4.485a5.011 5.011 0 0 1 1.723-3.098 5.082 5.082 0 0 1 3.353-1.201c.48-.005.959.065 1.417.208 1.937.616 3.04 2.472 2.72 4.485h-.005zm-24.055.476a10.284 10.284 0 0 0 6.656-2.449 10.144 10.144 0 0 0 3.452-6.156c.79-4.992-3.14-9.35-8.708-9.35H55.76a.7.7 0 0 0-.698.588l-4 25.2a.642.642 0 0 0 .37.687c.085.039.178.06.272.06h4.748a.7.7 0 0 0 .698-.59l1.176-7.402a.692.692 0 0 1 .698-.589h4.31zm3.974-8.832c-.293 1.846-1.73 3.205-4.481 3.205H59.31l1.066-6.713h3.454c2.845.005 3.77 1.671 3.478 3.513v-.005z"/><path fill="#cccccc" d="M32.639 12.16c.107-5.566-4.484-9.836-10.797-9.836H8.784a1.277 1.277 0 0 0-1.262 1.078L2.29 36.095a1.038 1.038 0 0 0 1.025 1.2h7.736l-1.209 7.57a1.038 1.038 0 0 0 1.025 1.2h6.302c.304 0 .575-.109.807-.306.23-.198.268-.471.316-.772l1.85-10.884c.047-.3.2-.69.431-.888.231-.198.433-.306.738-.306h3.856c6.183 0 11.428-4.395 12.387-10.507.679-4.338-1.181-8.286-4.915-10.243z"/><path fill="#ffffff" d="M12.725 25.238l-1.927 12.218-1.21 7.664a1.038 1.038 0 0 0 1.026 1.199h6.67a1.276 1.276 0 0 0 1.26-1.078l1.758-11.139a1.277 1.277 0 0 1 1.261-1.078h3.926c6.183 0 11.428-4.51 12.388-10.622.68-4.338-1.504-8.286-5.238-10.243-.01.462-.05.923-.121 1.38-.959 6.11-6.206 10.621-12.387 10.621h-6.145a1.278 1.278 0 0 0-1.261 1.079"/><path fill="#efefef" d="M10.797 37.456h-7.76a1.037 1.037 0 0 1-1.024-1.2L7.245 3.078A1.277 1.277 0 0 1 8.506 2h13.336c6.313 0 10.904 4.594 10.797 10.159-1.571-.824-3.417-1.295-5.439-1.295H16.082a1.277 1.277 0 0 0-1.262 1.078l-2.094 13.296-1.93 12.218z"/></svg>';
                                        $('button.submit-order, a.summary-submit-payment').html(data.order.billing.payment.btnName.substring(0, paypalName) + " &nbsp;" + paypalimage);
                                    } else {
                                        $('button.submit-order, a.summary-submit-payment').html(data.order.billing.payment.btnName);
                                    }
                                }

                                if (data.renderedPaymentInstruments) {
                                    $(".stored-payments")
                                        .empty()
                                        .html(data.renderedPaymentInstruments);
                                }

                                if (
                                    data.customer.registeredUser &&
                                    data.customer.customerPaymentInstruments
                                        .length
                                ) {
                                    $(".cancel-new-payment").removeClass(
                                        "checkout-hidden"
                                    );
                                }

                                defer.resolve(data);
                                $('html,body').animate({
                                    scrollTop: $('.card.review-section').offset().top
                                }, 500);
                            }
                        },
                        error: function (err) {
                            // enable the next:Place Order button here
                            $("body").trigger(
                                "checkout:enableButton",
                                ".next-step-button button"
                            );
                            if (
                                err.responseJSON &&
                                err.responseJSON.redirectUrl
                            ) {
                                window.location.href =
                                    err.responseJSON.redirectUrl;
                            }
                        },
                    });

                    return defer;
                } else if (stage === "placeOrder") {
                    // disable the placeOrder button here
                    $("body").trigger(
                        "checkout:disableButton",
                        ".next-step-button button"
                    );
                    $.ajax({
                        url: $(".place-order").data("action"),
                        method: "POST",
                        success: function (data) {
                            // enable the placeOrder button here
                            $("body").trigger(
                                "checkout:enableButton",
                                ".next-step-button button"
                            );
                            if (data.error) {
                                if (data.cartError) {
                                    window.location.href = data.redirectUrl;
                                    defer.reject();
                                } else {
                                    // go to appropriate stage and display error message
                                    defer.reject(data);
                                }
                            } else {
                                var redirect = $("<form>")
                                    .appendTo(document.body)
                                    .attr({
                                        method: "POST",
                                        action: data.continueUrl,
                                    });

                                $("<input>").appendTo(redirect).attr({
                                    name: "orderID",
                                    value: data.orderID,
                                });

                                $("<input>").appendTo(redirect).attr({
                                    name: "orderToken",
                                    value: data.orderToken,
                                });

                                redirect.submit();
                                defer.resolve(data);
                            }
                        },
                        error: function () {
                            // enable the placeOrder button here
                            $("body").trigger(
                                "checkout:enableButton",
                                $(".next-step-button button")
                            );
                        },
                    });

                    return defer;
                }
                var p = $("<div>").promise(); // eslint-disable-line
                setTimeout(function () {
                    p.done(); // eslint-disable-line
                }, 500);
                return p; // eslint-disable-line
            },

            /**
             * Initialize the checkout stage.
             *
             * TODO: update this to allow stage to be set from server?
             */
            initialize: function () {

                $(".mobile-cart-review").click(function(e){
                    e.preventDefault();
                    $('.order-mobile').toggleClass('d-block');
                    $(".mobile-cart-review .text-right").toggleClass('svg-icon');
                });

                // set the initial state of checkout
                members.currentStage = checkoutStages.indexOf(
                    $(".data-checkout-stage").data("checkout-stage")
                );
                $(plugin).attr(
                    "data-checkout-stage",
                    checkoutStages[members.currentStage]
                );

                $("body").on("click", ".submit-customer-login", function (e) {
                    e.preventDefault();
                    members.nextStage();
                });

                $("body").on("click", ".submit-customer", function (e) {
                    e.preventDefault();
                    members.nextStage();
                });

                //
                // Handle Payment option selection
                //
                $('input[name$="paymentMethod"]', plugin).on(
                    "change",
                    function () {
                        $(".credit-card-form").toggle(
                            $(this).val() === "CREDIT_CARD"
                        );
                    }
                );

                //
                // Handle Next State button click
                //
                $(plugin).on("click", ".next-step-button button", function () {
                    members.nextStage();
                });

                //
                // Handle Edit buttons on shipping and payment summary cards
                //
                $(".customer-summary .edit-button", plugin).on(
                    "click",
                    function () {
                        members.gotoStage("customer");
                    }
                );

                // $(".shipping-summary .edit-button", plugin).on(
                //     "click",
                //     function () {
                //         if (!$("#checkout-main").hasClass("multi-ship")) {
                //             $("body").trigger("shipping:selectSingleShipping");
                //         }

                //         members.gotoStage("shipping");
                //     }
                // );

                $(".shipping-summary .change-shipping", plugin).on(
                    "click",
                    function () {
                        if (!$("#checkout-main").hasClass("multi-ship")) {
                            $("body").trigger("shipping:selectSingleShipping");
                        }

                        members.gotoStage("shipping");
                    }
                );

                $(".payment-summary .edit-button", plugin).on(
                    "click",
                    function () {
                        $('.default-payment-card,.change-payment-method').addClass('d-none');
                        $('.choose-save-cards, .form-nav.billing-nav.payment-information').removeClass('d-none');
                        $('.payment-information, .add-new-payment-card').removeClass('checkout-hidden');
                        members.gotoStage("payment");
                    }
                );

                $('.change-payment-method', plugin).on('click', function () {
                    $('.default-payment-card').addClass('d-none');
                    $('.choose-save-cards, .form-nav.billing-nav.payment-information').removeClass('d-none');
                    $('.payment-information, .add-new-payment-card').removeClass('checkout-hidden');
                    $(this).addClass('d-none');
                });

                //
                // remember stage (e.g. shipping)
                //
                updateUrl(members.currentStage);

                //
                // Listen for foward/back button press and move to correct checkout-stage
                //
                $(window).on("popstate", function (e) {
                    // stage is billing reloading page for temporary fix 
                    if(members.currentStage === 2) {
                        $.spinner().start();
                        location.reload();
                    }
                    
                    //
                    // Back button when event state less than current state in ordered
                    // checkoutStages array.
                    //
                    if (
                        e.state === null ||
                        checkoutStages.indexOf(e.state) < members.currentStage
                    ) {
                        members.handlePrevStage(false);
                    } else if (
                        checkoutStages.indexOf(e.state) > members.currentStage
                    ) {
                        // Forward button  pressed
                        members.handleNextStage(false);
                    }
                });

                //
                // Set the form data
                //
                plugin.data("formData", formData);

                const params = new Proxy(new URLSearchParams(window.location.search), {
                    get: (searchParams, prop) => searchParams.get(prop),
                  });

                  if(params.stage == 'payment' || params.stage == 'shipping') {
                    $('a.summary-submit-payment').text('Place Order');
                  }
            },

            /**
             * The next checkout state step updates the css for showing correct buttons etc...
             */
            nextStage: function () {
                var promise = members.updateStage();

                promise.done(function () {
                    // Update UI with new stage
                    $(".error-message").hide();
                    members.handleNextStage(true);
                });

                promise.fail(function (data) {
                    // show errors
                    if (data) {
                        if (data.errorStage) {
                            members.gotoStage(data.errorStage.stage);

                            if (data.errorStage.step === "billingAddress") {
                                var $billingAddressSameAsShipping = $(
                                    'input[name$="_shippingAddressUseAsBillingAddress"]'
                                );
                                if (
                                    $billingAddressSameAsShipping.is(":checked")
                                ) {
                                    $billingAddressSameAsShipping.prop(
                                        "checked",
                                        false
                                    );
                                }
                            }
                        }

                        if (data.errorMessage) {
                            $(".error-message").show();
                            $(".error-message-text").text(data.errorMessage);
                        }
                    }
                });
            },

            /**
             * The next checkout state step updates the css for showing correct buttons etc...
             *
             * @param {boolean} bPushState - boolean when true pushes state using the history api.
             */
            handleNextStage: function (bPushState) {
                if (members.currentStage < checkoutStages.length - 1) {
                    // move stage forward
                    members.currentStage++;

                    //
                    // show new stage in url (e.g.payment)
                    //
                    if (bPushState) {
                        updateUrl(members.currentStage);
                    }
                }

                // Set the next stage on the DOM
                $(plugin).attr(
                    "data-checkout-stage",
                    checkoutStages[members.currentStage]
                );
            },

            /**
             * Previous State
             */
            handlePrevStage: function () {
                if (members.currentStage > 0) {
                    // move state back
                    members.currentStage--;
                    updateUrl(members.currentStage);
                }

                $(plugin).attr(
                    "data-checkout-stage",
                    checkoutStages[members.currentStage]
                );
            },

            /**
             * Use window history to go to a checkout stage
             * @param {string} stageName - the checkout state to goto
             */
            gotoStage: function (stageName) {
                members.currentStage = checkoutStages.indexOf(stageName);
                updateUrl(members.currentStage);
                $(plugin).attr(
                    "data-checkout-stage",
                    checkoutStages[members.currentStage]
                );
            },
        };

        //
        // Initialize the checkout
        //
        members.initialize();

        return this;
    };
})(jQuery);

var exports = {
    initialize: function () {
        $("#checkout-main").checkout();
    },

    updateCheckoutView: function () {
        $("body").on("checkout:updateCheckoutView", function (e, data) {
            if (data.csrfToken) {
                $("input[name*='csrf_token']").val(data.csrfToken);
            }
            customerHelpers.methods.updateCustomerInformation(
                data.customer,
                data.order
            );
            // Commented below line of code because Multiple Ship To Home functionality is not being used.
            //shippingHelpers.methods.updateMultiShipInformation(data.order);
            summaryHelpers.updateTotals(data.order.totals);
            data.order.shipping.forEach(function (shipping) {
                shippingHelpers.methods.updateShippingInformation(
                    shipping,
                    data.order,
                    data.customer,
                    data.options
                );
            });
            billingHelpers.methods.updateBillingInformation(
                data.order,
                data.customer,
                data.options
            );
            billingHelpers.methods.updatePaymentInformation(
                data.order,
                data.options
            );
            summaryHelpers.updateOrderProductSummaryInformation(
                data.order,
                data.options
            );
        });
    },

    disableButton: function () {
        $("body").on("checkout:disableButton", function (e, button) {
            $(button).prop("disabled", true);
        });
    },

    enableButton: function () {
        $("body").on("checkout:enableButton", function (e, button) {
            $(button).prop("disabled", false);
        });
    },
    showHideShippingMethod: function () {
        $("body").on("click", ".choose-expedit-shipping", function (e) {
            $('.shipping-method-block').addClass('show-all-list');
        });
    },
    showOtherShippingAddressRegisterUser: function () {
        $('.change-ship-logIn').click(function (e) {
            $('.other-address-register-user').removeClass('d-none');
            $('.other-address-register-user').addClass('d-block');
            $('.change-ship-logIn').addClass('d-none');
        });
    },
    placeOrder: function () {
        $('.summary-submit-payment').click(function () {
            if ($('input[name=dwfrm_billing_paymentMethod]').val() === 'KLARNA_PAYMENTS') {
                $('.klarna-place-order').click();
            } else {
                $('.submit-order, #submit-order.paypal').click();
            }
        });
    },
    promoCoupon: promo.promoCoupon,
    tooltip: tooltip.tooltip
};

[customerHelpers, billingHelpers, shippingHelpers, addressHelpers].forEach(
    function (library) {
        Object.keys(library).forEach(function (item) {
            if (typeof library[item] === "object") {
                exports[item] = $.extend({}, exports[item], library[item]);
            } else {
                exports[item] = library[item];
            }
        });
    }
);

module.exports = exports;
