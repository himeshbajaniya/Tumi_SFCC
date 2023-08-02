'use strict';

/**
 * Parses the html for a modal window
 * @param {string} html - representing the body and footer of the modal window
 * @return {Object} - Object with properties body and footer.
 */
function parseHtml(html) {
    var $html = $('<div>').append($.parseHTML(html));
    var body = $html.find('.product-quickview');
    var footer = $html.find('.modal-footer').children();
    return {
        body: body,
        footer: footer
    };
}

function accentDefaultButton() {
    var baseaccentingSkuColor = $('.color-pointer[data-baseaccentingsku-color]').data('baseaccentingsku-color');
    let mainImage = $('.color-pointer[data-mainproductimage]').data('mainproductimage');
    let dataURl = $('.color-pointer').data('url');
    let baseColorName = $('.color-pointer').attr('title');

    let noAccentImage = $('.color-pointer[data-noaccentimage]').attr('data-noaccentimage');

    if (baseaccentingSkuColor) {
        noAccentImage = $('.color-attribute[data-attr-id-value="' + baseaccentingSkuColor + '"]').data('noaccentimage');
        dataURl = $('.color-attribute[data-attr-id-value="' + baseaccentingSkuColor + '"]').data('url');
        mainImage = $('.color-attribute[data-attr-id-value="' + baseaccentingSkuColor + '"]').data('mainproductimage');
    }

    if ($('.accents-button.no-accents-button').length == 0) {
        let noAccentBtnElement = document.createElement('button');
        let swatchCircleDiv = document.createElement('div');
        let imageElemCirecleDiv = document.createElement('img');
        let accentPriceDiv = document.createElement('div');
        imageElemCirecleDiv.src = noAccentImage;
        accentPriceDiv.setAttribute('class', 'accent-price');
        accentPriceDiv.innerHTML = 'No Accent'

        noAccentBtnElement.setAttribute('data-accentmainimage', mainImage);
        noAccentBtnElement.setAttribute('class', 'accents-button no-accents-button');

        noAccentBtnElement.setAttribute('data-isaccentingsku', 'true');
        noAccentBtnElement.setAttribute('data-accentable', null);
        noAccentBtnElement.setAttribute('data-baseaccentingsku', $('.color-pointer[data-baseaccentingsku]').data('baseaccentingsku'));

        noAccentBtnElement.setAttribute('data-url', dataURl);
        noAccentBtnElement.setAttribute('title', baseColorName);

        swatchCircleDiv.appendChild(imageElemCirecleDiv);
        noAccentBtnElement.appendChild(swatchCircleDiv);
        noAccentBtnElement.appendChild(accentPriceDiv);
        document.querySelector('.wrap-items.accented-product .swiper-wrapper .swiper-slide>div').appendChild(noAccentBtnElement);
    }
}

function fillModalElementAccent(editProductUrl) {
    $('.modal-body').spinner().start();
    $.ajax({
        url: editProductUrl,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            var parsedHtml = parseHtml(data.renderedTemplate);
            $('#editProductModal .modal-body').empty();
            $('#editProductModal .modal-body').html(parsedHtml.body);
            // change modal heading for accents modal
            $('.quick-view-dialog .modal-header h6').html(data.accentheader);
            $('.quick-view-dialog .modal-header h6').addClass("add-your-accent");
            // remove quantity range from modal
            $('.quick-view-dialog .modal-body .edit-productlist').css("display", "block");
            $('.quick-view-dialog .modal-body .edit-productlist .prooduct-image').css("width", "auto");
            $('.quick-view-dialog .modal-body .edit-productlist .update-product').addClass('d-none');
            // creating div to show selected accent alongwith price and color
            let selectedAccentDetails = document.createElement('div');
            selectedAccentDetails.classList.add('selected-accent-details');
            let color = document.createElement('span');
            color.classList.add('color');
            let price = document.createElement('span');
            price.classList.add('price');
            let description = document.createElement('div');
            description.classList.add('description');
            selectedAccentDetails.append(description);
            selectedAccentDetails.append(color);
            selectedAccentDetails.append(price);
            $('.quick-view-dialog .modal-body .edit-productlist').append(selectedAccentDetails);

            $('.selected-accent-details .description').html(data.chooseAccent);
            $('.selected-accent-details .color').html(data.noneAccent);

            var colorPointer = $('.color-pointer[data-accentingskus]');
            if (colorPointer.data('accentable') || colorPointer.data('isaccentingsku')) {
                if ($('.accents-button.no-accents-button').length) {
                    $('.accents-button.no-accents-button').remove();
                }
                accentDefaultButton();
                colorPointer.closest('.attribute').addClass('d-none');
                let accentingColorID = colorPointer.attr('data-accentingskus');
                var baseaccentingSkuColor = colorPointer.data('baseaccentingsku-color');
                if (baseaccentingSkuColor) accentingColorID = $('.color-attribute[data-attr-id-value="' + baseaccentingSkuColor + '"]').attr('data-accentingskus');
                var accentingskus = accentingColorID.split('|');
                var buttonaccent = [];
                var allVarientSKUs = data.product.variationAttributes[0].values;
                allVarientSKUs.forEach(elem => {
                    buttonaccent.push(elem.id);
                });
                buttonaccent.forEach(function (accent) {
                    accentingskus.forEach(function (skus) {
                        if (accent == skus) {
                            var buttonAttr = '[data-attr-accent-value=' + skus + ']';
                            $(buttonAttr).removeClass('d-none');
                        }
                    });
                });
            }
            // var isAccentingSku = colorPointer.attr('data-isaccentingsku')
            else if ($('.color-pointer').data('isaccentingsku')) {
                if ($('.color-attribute.color-pointer').data('baseaccentingsku')) {
                    if ($('.accents-button.no-accents-button').length) {
                        $('.accents-button.no-accents-button').remove();
                    }
                    $('.color-pointer').closest('.attribute').addClass('d-none');
                    let baseaccentingSkuValue = $('.color-attribute.color-pointer[data-baseaccentingsku]').attr('data-baseaccentingsku');
                    $('.color-attribute[data-accentingskus]').each(function (x, elem) {
                        if ($(elem).attr('data-attr-id-value') == baseaccentingSkuValue) {
                            let baseElem = $(this);
                            var buttonUrl = baseElem.attr('data-url');
                            var accentingColor = baseElem.attr('data-accentingskus')
                            var accentingskus = accentingColor.split('|');
                            var buttonaccent = [];

                            var accentColor = $('.swatch-circle.selected').parent('.color-attribute').attr('title');
                            var noAccentImg = $('.accents-button.no-accent').attr('title');
                            document.querySelectorAll('.accented-product button').forEach(elem => buttonaccent.push(elem.getAttribute('data-attr-accent-value')));
                            buttonaccent.forEach(function (accent) {
                                accentingskus.forEach(function (skus) {
                                    if (accent == skus) {
                                        var buttonAttr = '[data-attr-accent-value=' + skus + ']';
                                        $(buttonAttr).removeClass('d-none');
                                    }
                                });
                            });
                            let mainImage = baseElem.attr('data-mainproductimage');
                            let baseColorName = baseElem.attr('title');
                            // let noAccentImage=$('.color-pointer').attr('data-noaccentimage');
                            let noAccentImage = baseElem.attr('data-noaccentimage');
                            // document.querySelector('.accent-preview-img').src=mainImage;
                            if ($('.accents-button.no-accents-button').length == 0) {
                                let noAccentBtnElement = document.createElement('button');
                                let swatchCircleDiv = document.createElement('div');
                                let imageElemCirecleDiv = document.createElement('img');
                                let accentPriceDiv = document.createElement('div');
                                imageElemCirecleDiv.src = noAccentImage;
                                accentPriceDiv.setAttribute('class', 'accent-price');
                                accentPriceDiv.innerHTML = 'No Accent'
                                noAccentBtnElement.setAttribute('data-accentmainimage', mainImage);
                                noAccentBtnElement.setAttribute('class', 'accents-button no-accents-button');
                                noAccentBtnElement.setAttribute('data-isaccentingsku', 'true');
                                noAccentBtnElement.setAttribute('data-url', buttonUrl);
                                noAccentBtnElement.setAttribute('title', baseColorName);
                                swatchCircleDiv.appendChild(imageElemCirecleDiv);
                                noAccentBtnElement.appendChild(swatchCircleDiv);
                                noAccentBtnElement.appendChild(accentPriceDiv);
                                document.querySelector('.wrap-items.accented-product .swiper-wrapper .swiper-slide>div').appendChild(noAccentBtnElement);
                            }
                        }
                    })
                }
            }
            $('#editProductModal .modal-footer').html(parsedHtml.footer);
            $('#editProductModal .modal-footer').addClass('accent-cart-footer');

            $('#editProductModal .modal-header .close .sr-only').text(data.closeButtonText);
            $('#editProductModal .enter-message').text(data.enterDialogMessage);
            $('#editProductModal').attr('store-id', data.storeId);
            $('.update-cart-product-global').html('Apply');
            $('.accents-button.clicked.selected').click();

            $('body').trigger('editproductmodal:ready');
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });

}


/**
 * replaces the content in the modal window for product variation to be edited.
 * @param {string} editProductUrl - url to be used to retrieve a new product model
 */
function fillModalElement(editProductUrl) {
    $('.modal-body').spinner().start();
    $.ajax({
        url: editProductUrl,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            var parsedHtml = parseHtml(data.renderedTemplate);
            $('#editProductModal .modal-body').empty();
            $('#editProductModal .modal-body').html(parsedHtml.body);
            $('#editProductModal .modal-footer').html(parsedHtml.footer);
            $('#editProductModal .modal-header .close .sr-only').text(data.closeButtonText);
            $('#editProductModal .enter-message').text(data.enterDialogMessage);
            $('#editProductModal').attr('store-id', data.storeId);
            $('.hide-accent-on-edit').removeClass('d-none');
            $('[data-quantity="plus"]').click(function (e) {
                // Stop acting like a button
                e.preventDefault();
                // Get the field name
                var fieldName = $(this).attr('data-field');
                // Get its current value
                var currentVal = parseInt($('input[name=' + fieldName + ']').val());
                // If is not undefined
                if (!isNaN(currentVal)) {
                    // Increment
                    let selectedQuantity = currentVal + 1;
                    $('input[name=' + fieldName + ']').val(selectedQuantity);
                    $('.modal.show .update-cart-url').data('selected-quantity', selectedQuantity);
                } else {
                    // Otherwise put a 1 there
                    $('input[name=' + fieldName + ']').val(1);
                }
            });
            // This button will decrement the value till 1
            $('[data-quantity="minus"]').click(function (e) {
                // Stop acting like a button
                e.preventDefault();
                // Get the field name
                var fieldName = $(this).attr('data-field');
                // Get its current value
                var currentVal = parseInt($('input[name=' + fieldName + ']').val());
                // If it isn't undefined or its greater than 1
                if (!isNaN(currentVal) && currentVal > 1) {
                    // Decrement one
                    let selectedQuantity = currentVal - 1;
                    $('input[name=' + fieldName + ']').val(selectedQuantity);
                    $('.modal.show .update-cart-url').data('selected-quantity', selectedQuantity);
                } else {
                    // Otherwise put a 1 there
                    $('input[name=' + fieldName + ']').val(1);
                }
            });

            $('body').trigger('editproductmodal:ready');
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

/**
 * Generates the modal window on the first call.
 *
 */
function getModalHtmlElement() {
    if ($('#editProductModal').length !== 0) {
        $('#editProductModal').remove();
    }
    var htmlString = '<!-- Modal -->' +
        '<div class="modal fade global-modal" id="editProductModal" tabindex="-1" role="dialog">' +
        '<span class="enter-message sr-only" ></span>' +
        '<div class="modal-dialog quick-view-dialog">' +
        '<!-- Modal content-->' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '<h6>Edit Item</h6>' +
        '    <button type="button" class="close pull-right" data-dismiss="modal">' +
        '        <span aria-hidden="true">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">' +
        ' <path fill-rule="evenodd" clip-rule="evenodd" d="M0 0.708333L0.708333 0L8.50522 7.79688L16.0918 0.210327L16.8001 0.918661L9.21355 8.50522L17 16.2917L16.2917 17L8.50522 9.21355L0.919271 16.7995L0.210938 16.0912L7.79688 8.50522L0 0.708333Z" fill="#1B1C1E"/>' +
        '</svg></span>' +
        '        <span class="sr-only"> </span>' +
        '    </button>' +
        '</div>' +
        '<div class="modal-body"></div>' +
        '<div class="modal-footer"></div>' +
        '</div>' +
        '</div>' +
        '</div>';
    $('body').append(htmlString);
}

function editAccentModal() {
    $(document).on('click', '.edit-accent', function () {
        $('.accents-button.clicked.selected').click();
        initializeSwiperScroll();
    });
}

function provideEditAccentModal() {
    $('body').on('click', '.clickable.add-block.add-accent .edit', function (e) {
        e.preventDefault();
        var editProductUrl = $(this).attr('href');
        getModalHtmlElement();
        fillModalElementAccent(editProductUrl);
    });
}

function provideAddAccentModal() {
    $(document).on('click', '.add-accent', function (e) {
        let mainImage = $('.color-pointer[data-mainproductimage]').attr('data-mainproductimage');
        $('.accent-preview-img').attr('src', mainImage);
        $('.accents-button.no-accent .accent-price').empty().append('No Accent');
        $('.accent-step-button-next').empty().append('Apply');
        $('.accent-step-button-next').addClass('disabled');
        $('.accents-button.selected').removeClass('selected');
        $('.selected-accent-option').empty().append('None Selected');
        $('.selected-accent-price').empty();
        initializeSwiperScroll();
    });
}

function removeAccent(e) {
    $('body').on('click', '.accent-remove', function (e) {
        e.preventDefault();
        var form = {
            uuid: $(this).data('uuid'),
            pid: $(this).data('skuid'),
            quantity: 1
        };
        var updateProductUrl = $(this).attr('href');
        if (updateProductUrl) {
            $(this).parents('.card').spinner().start();
            $('body').trigger('cart:beforeUpdate');
            $.ajax({
                url: updateProductUrl,
                type: 'post',
                context: this,
                data: form,
                dataType: 'json',
                success: function () {
                    $('#editProductModal').modal('hide');
                    $.spinner().stop();
                    window.location.reload();
                },
                error: function (err) {
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    } else {
                        $.spinner().stop();
                    }
                }
            });
        }
    });
}

// function initializeSwiperScroll () {
//     var accentswiper = new Swiper(".mySwiper-acc", {
//         direction: "horizontal",
//         slidesPerView: "auto",
//         freeMode: true,
//         scrollbar: {
//           el: ".swiper-scrollbar",
//         },
//         mousewheel: true
//       });
// }

module.exports = {
    base: require('./base'),
    editAccentModal: editAccentModal,
    provideEditAccentModal: provideEditAccentModal,
    provideAddAccentModal: provideAddAccentModal,
    removeAccent: removeAccent
};