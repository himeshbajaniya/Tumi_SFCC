"use strict";

var base = require("base/checkout/shipping");
var formHelpers = require("base/checkout/formErrors");
var siteCountryCode = $('.siteCountryCode').attr('data-siteCountryCode');

base.methods.shippingFormResponse = function (defer, data) {
    var isMultiShip = $("#checkout-main").hasClass("multi-ship");
    var formSelector = isMultiShip ?
        '.multi-shipping .active form' :
        '.single-shipping form';

    // highlight fields with errors
    if (data.error) {
        if (data.fieldErrors.length) {
            data.fieldErrors.forEach(function (error) {
                if (Object.keys(error).length) {
                    formHelpers.loadFormErrors(formSelector, error);
                }
            });
            defer.reject(data);
        }

        if (data.cartError) {
            window.location.href = data.redirectUrl;
            defer.reject();
        }
    } else if (data.taxError) {
        $(".error-message").css({
            display: "block",
            "margin-top": "0",
        });
        var errorPara = $(".error-message-text");
        if (errorPara.length > 0) {
            errorPara[0].innerText = data.taxErrorMsg;
        }
        defer.reject();
    } else {
        // Populate the Address Summary
        $("body").trigger("checkout:updateCheckoutView", {
            order: data.order,
            customer: data.customer,
            options: data.options,
        });

        defer.resolve(data);
    }
};

base.editShippingSummary = function () {
    $(".shipping-summary .edit-button").on("click", function () {
        $('#checkout-main[data-checkout-stage = "shipping"]')
            .find("button.submit-payment")
            .attr("id", "showSubmitPayment");
    });
};


base.selectCurrentAddress = function () {

    $('.edit-summary-details .other-edit-ship-address ,.single-shipping .add-new').on('click', function (e) {
        if (e.currentTarget.className.indexOf('add-new') > -1) {
            $('.shipment-selector-block').addClass("d-none");
        }
        if (e.currentTarget.className.indexOf('other-edit-ship-address') > -1) {
            $('.other-edit-ship-address').removeClass('selectedAddress');
        }

        var form = $(this).parents('form')[0];
        var selectedOption = $(this);
        var attrs = selectedOption.data();
        var shipmentUUID = $(selectedOption[0]).data('addid')
        var originalUUID = $('input[name=shipmentUUID]', form).val();
        var element;
        if (e.currentTarget.className.indexOf('other-edit-ship-address') > -1) {
            selectedOption.addClass("selectedAddress");
        }
        Object.keys(attrs).forEach(function (attr) {
            element = attr === 'countryCode' ? 'country' : attr;
            $('[name$=' + element + ']', form).val(attrs[attr]);
        });
        $('[name$=stateCode]', form).trigger('change');
        if (shipmentUUID === 'new') {
            $(form).attr('data-address-mode', 'new');
            $(form).find('.shipping-address-block').removeClass('d-none');
        } else if (shipmentUUID === originalUUID) {
            $(form).attr('data-address-mode', 'shipment');
        } else if (shipmentUUID.indexOf('ab_') === 0) {
            $(form).attr('data-address-mode', 'customer');
        } else {
            $(form).attr('data-address-mode', 'edit');
        }
    });
};


function updateShippingMethods(shipping) {
    var uuidEl = $("input[value=" + shipping.UUID + "]");

    if (uuidEl && uuidEl.length > 0) {
        $.each(uuidEl, function (shipmentIndex, el) {
            var form = el.form;
            if (!form) return;
            var $shippingMethodList = $(".shipping-method-list", form);
            var $shippingMethodList2 = $(
                ".shipping-summary .shipping-method-list"
            );

            if ($shippingMethodList && $shippingMethodList.length > 0) {
                $shippingMethodList.empty();
                $shippingMethodList2.empty();
                var shippingMethods = shipping.applicableShippingMethods;
                var selected = shipping.selectedShippingMethod || {};
                var shippingMethodFormID =
                    form.name + "_shippingAddress_shippingMethodID"; //
                // Create the new rows for each shipping method
                //
                $('.ground-method').removeClass('inactive');
                $('.continue-shipping button').removeAttr('disabled');
                if (!shippingMethods.length) {
                    $('.ground-method').addClass('inactive');
                    $('.continue-shipping button').attr('disabled', true);
                }
                $.each(shippingMethods, function (methodIndex, shippingMethod) {
                    var tmpl = $("#shipping-method-template").clone(); // set input

                    $("input", tmpl)
                        .prop(
                            "id",
                            "shippingMethod-" +
                            shippingMethod.ID +
                            "-" +
                            shipping.UUID
                        )
                        .prop("name", shippingMethodFormID)
                        .prop("value", shippingMethod.ID)
                        .attr("checked", shippingMethod.ID === selected.ID);
                    $("label", tmpl).prop(
                        "for",
                        "shippingMethod-" +
                        shippingMethod.ID +
                        "-" +
                        shipping.UUID
                    ); // set shipping method name

                    $(".display-name", tmpl).text(shippingMethod.displayName); // set or hide arrival time

                    if (shippingMethod.estimatedArrivalTime) {
                        $(".arrival-time", tmpl)
                            .text(
                                shippingMethod.estimatedArrivalTime
                            )
                            .show();
                    } // set shipping cost

                    $(".shipping-cost", tmpl).text(shippingMethod.shippingCost);
                    $shippingMethodList.append(tmpl.html());
                    $shippingMethodList2.append(tmpl.html());
                });
            }
        });
    }

    setTimeout(function () {
        $('.shipping-method-block [name="dwfrm_shipping_shippingAddress_shippingMethodID"]:checked').parent().addClass('shipmethod-selected');
        $('.shipping-method-block').removeClass('show-all-list');
        if (shipping && shipping.applicableShippingMethods.length < 2) {
            $('.choose-expedit-shipping').css('display', 'none');
        } else {
            $('.choose-expedit-shipping').css('display', 'block');
        }
    }, 10);

}

base.methods.updateShippingInformation = function (
    shipping,
    order,
    customer,
    options
) {
    // First copy over shipmentUUIDs from response, to each PLI form
    order.shipping.forEach(function (aShipping) {
        aShipping.productLineItems.items.forEach(function (productLineItem) {
            base.methods.updateProductLineItemShipmentUUIDs(
                productLineItem,
                aShipping
            );
        });
    });

    // Now update shipping information, based on those associations
    updateShippingMethods(shipping);
    base.methods.updateShippingAddressFormValues(shipping);
    base.methods.updateShippingSummaryInformation(shipping, order);

    // And update the PLI-based summary information as well
    shipping.productLineItems.items.forEach(function (productLineItem) {
        base.methods.updateShippingAddressSelector(
            productLineItem,
            shipping,
            order,
            customer
        );
        base.methods.updatePLIShippingSummaryInformation(
            productLineItem,
            shipping,
            order,
            options
        );
    });

    $("body").trigger("shipping:updateShippingInformation", {
        order: order,
        shipping: shipping,
        customer: customer,
        options: options,
    });
};
base.editButtonUpdate = function () {
    //$('.shipping-content .edit-ship-add,.shipping-content .btn-add-new').on('click', function () {
    $('.edit-ship-add').on('click', function () {
        $(this).parent().find('.other-edit-ship-address').trigger('click');
    });
    $('.edit-ship-add,.shipping-content .btn-add-new').on('click', function () {
        $('.shipment-selector-block').addClass('d-none');
        $('.shipping-address-block').removeClass('d-none');
        $('.shipping-summary-new').addClass('d-none');
        $('.shipping-summary-edit').removeClass('d-none');
    });

    $('.save-continue-shipping, .continue-shipping').on('click', function () {
        $('.submit-shipping').click();
        $('#edq-verification-suggestion-box').hide();
    });
};
base.newButtonUpdate = function () {
    $('.add-new').on('click', function () {
        $('.shipment-selector-block').addClass('d-none');
        $('.shipping-address-block').removeClass('d-none');
        $('.shipping-summary-new').removeClass('d-none');
        $('.shipping-summary-edit').addClass('d-none');
    });

    $('.save-continue-shipping').on('click', function () {
        $('.submit-shipping').click();
    });
};
base.editShippingSummaryNew = function () {
    $('.back-to-shipping-summary-new').on('click', function (e) {
        var defaultaddressid = $('.default-addressID').attr('data-defaultaddressid');
        var addressid = $('.other-edit-ship-address').attr('data-addressid');
        $('.shipment-selector-block').removeClass('d-none');
        $('.shipping-address-block').addClass('d-none');
        
        if (defaultaddressid === addressid) {
            $(".edit-summary-details .select-default-address").click().addClass("selectedAddress");
        }
    });
};
base.editShippingSummary = function () {
    $('.back-to-shipping-summary-edit').on('click', function (e) {
        $('.shipment-selector-block').removeClass('d-none');
        $('.shipping-address-block').addClass('d-none');
    });
}
/**
 * updates the shipping address form values within shipping forms
 * @param {Object} shipping - the shipping (shipment model) model
 */
function updateShippingAddressFormValues(shipping) {
    var addressObject = $.extend({}, shipping.shippingAddress);

    if (!addressObject) {
        addressObject = {
            firstName: null,
            lastName: null,
            address1: null,
            address2: null,
            city: null,
            postalCode: null,
            stateCode: null,
            countryCode: null,
            phone: null
        };
    }

    addressObject.isGift = shipping.isGift;
    addressObject.giftMessage = shipping.giftMessage;

    $('input[value=' + shipping.UUID + ']').each(function (formIndex, el) {
        var form = el.form;
        if (!form) return;
        var countryCode = addressObject.countryCode;
        $('input[name$=_firstName]', form).val(addressObject.firstName);
        $('input[name$=_lastName]', form).val(addressObject.lastName);
        $('input[name$=_address1]', form).val(addressObject.address1);
        $('input[name$=_address2]', form).val(addressObject.address2);
        $('input[name$=_city]', form).val(addressObject.city);
        $('input[name$=_postalCode]', form).val(addressObject.postalCode);
        $('select[name$=_stateCode],input[name$=_stateCode]', form)
            .val(addressObject.stateCode);

        $('select[name$=_country]', form).val(siteCountryCode);

        $('input[name$=_phone]', form).val(addressObject.phone);

        $('input[name$=_isGift]', form).prop('checked', addressObject.isGift);
        $('textarea[name$=_giftMessage]', form).val(addressObject.isGift && addressObject.giftMessage ? addressObject.giftMessage : '');
    });

    $('body').trigger('shipping:updateShippingAddressFormValues', {
        shipping: shipping
    });
};
/**
 * Clear out all the shipping form values and select the new address in the drop down
 * @param {Object} order - the order object
 */
function clearShippingForms(order) {
    order.shipping.forEach(function (shipping) {
        $('input[value=' + shipping.UUID + ']').each(function (formIndex, el) {
            var form = el.form;
            if (!form) return;

            $('input[name$=_firstName]', form).val('');
            $('input[name$=_lastName]', form).val('');
            $('input[name$=_address1]', form).val('');
            $('input[name$=_address2]', form).val('');
            $('input[name$=_city]', form).val('');
            $('input[name$=_postalCode]', form).val('');
            $('select[name$=_stateCode],input[name$=_stateCode]', form).val('');
            $('select[name$=_country]', form).val(siteCountryCode);

            $('input[name$=_phone]', form).val('');

            $('input[name$=_isGift]', form).prop('checked', false);
            $('textarea[name$=_giftMessage]', form).val('');
            $(form).find('.gift-message').addClass('d-none');

            $(form).attr('data-address-mode', 'new');
            var addressSelectorDropDown = $('.addressSelector option[value=new]', form);
            $(addressSelectorDropDown).prop('selected', true);
        });
    });

    $('body').trigger('shipping:clearShippingForms', {
        order: order
    });
}

base.editContactInfoForStore = function () {
    $('.edit-contact-info').on('click', function (e) {
        e.preventDefault();
        $('.contact-info-summary').addClass('d-none');
        $('.contact-info-section').removeClass('d-none');
    });
}

base.methods.updateShippingMethods = updateShippingMethods;
base.methods.updateShippingAddressFormValues = updateShippingAddressFormValues;
base.methods.clearShippingForms = clearShippingForms;
module.exports = base;