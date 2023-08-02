'use strict';
var focusHelper = require('base/components/focus');
var reflektionCarousel = require('../reflektionCarousel');

function updateBopisForVariation() {
    var isStorePickupEnabledForSite = $('#isStorePickupEnabled').val();
    if (isStorePickupEnabledForSite === 'true') {
        $('.delivery-options-container').removeClass('d-none');
    } else {
        $('.delivery-options-container').addClass('d-none');
    }
}

function updateMonogramForVariation(monogramable) {
    if(monogramable) {
        $('.monogram-item').removeClass('d-none');
    } else {
        $('.monogram-item').addClass('d-none');
    }
}

/**
 * Retrieves the relevant pid value
 * @param {jquery} $el - DOM container for a given add to cart button
 * @return {string} - value to be used when adding product to cart
 */
function getPidValue($el) {
    var pid;

    if ($('#quickViewModal').hasClass('show') && !$('.product-set').length) {
        pid = $($el).closest('.modal-content').find('.product-quickview').attr('data-pid');
    } else if ($('.product-set-detail').length || $('.product-set').length) {
        pid = $($el).closest('.product-detail').find('.product-id').text();
    } else if ($($el).closest('.ctnr-product-item').length) {
        pid = $($el).closest('.product').attr('data-pid');
    } else {
        pid = $('.product-detail:not(".bundle-item")').attr('data-pid');
    }

    return pid;
}

/**
 * Retrieve contextual quantity selector
 * @param {jquery} $el - DOM container for the relevant quantity
 * @return {jquery} - quantity selector DOM container
 */
function getQuantitySelector($el) {
    var quantitySelected;
    if ($el && $('.set-items').length) {
        quantitySelected = $($el).closest('.product-detail').find('.quantity-select');
    } else if ($el && $('.product-bundle').length) {
        var quantitySelectedModal = $($el).closest('.modal-footer').find('.quantity-select');
        var quantitySelectedPDP = $($el).closest('.bundle-footer').find('.quantity-select');
        if (quantitySelectedModal.val() === undefined) {
            quantitySelected = quantitySelectedPDP;
        } else {
            quantitySelected = quantitySelectedModal;
        }
    } else {
        quantitySelected = $('.quantity-select');
    }
    return quantitySelected;
}

function renderIncludedWithPurchase(data) {
    let list = '';
    if (data.product.purchaseAttr.length >= 2) {
        list +=
            `<h3>${data.getResources.purchaseHeading}</h3>
        <p class="description">${data.getResources.purchaseSubtext}</p>
                    <div class="swiper purchase-component">
                        <div class="swiper-wrapper" id="purchase">`;
        Object.keys(data.product.purchaseAttr).forEach(x => {
            list += `<div class="swiper-slide">
                                    <div class="icon">
                                    <img src='${data.product.purchaseAttr[x]['imageUrl']}' alt="${data.product.purchaseAttr[x]['text']}" />
                                    </div>
                                    <div class="sub-text">
                                    <span>${data.product.purchaseAttr[x]['text']}</span>
                                        <a href="${data.product.purchaseAttr[x]['linkUrl']}">${data.product.purchaseAttr[x]['linkText']}</a>
                                    </div>
                                </div>`;
        })
        list += `</div>
                    </div>`;
    }
    return list;
}

/**
 * Retrieves the value associated with the Quantity pull-down menu
 * @param {jquery} $el - DOM container for the relevant quantity
 * @return {string} - value found in the quantity input
 */
function getQuantitySelected($el) {
    return getQuantitySelector($el).val();
}

function accentDefaultButton(baseaccentingsku) {
    let mainImage = $('.color-pointer').attr('data-mainproductimage');
    let dataURl = $('.color-pointer').attr('data-url');
    let baseColorName = $('.color-pointer').attr('title');
    let noAccentImage = $('.color-pointer').attr('data-noaccentimage');
    if (mainImage && document.querySelector('.accent-preview-img')) {
        document.querySelector('.accent-preview-img').src = mainImage;
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

        noAccentBtnElement.setAttribute('data-url', dataURl);
        noAccentBtnElement.setAttribute('title', baseColorName);

        noAccentBtnElement.setAttribute('data-baseaccentingsku', baseaccentingsku || $('.color-pointer').data('baseaccentingsku'));

        swatchCircleDiv.appendChild(imageElemCirecleDiv);
        noAccentBtnElement.appendChild(swatchCircleDiv);
        noAccentBtnElement.appendChild(accentPriceDiv);
        document.querySelector('.wrap-items.accented-product .swiper-wrapper .swiper-slide>div').appendChild(noAccentBtnElement);
    }
};
/**
 * Process the attribute values for an attribute that has image swatches
 *
 * @param {Object} attr - Attribute
 * @param {string} attr.id - Attribute ID
 * @param {Object[]} attr.values - Array of attribute value objects
 * @param {string} attr.values.value - Attribute coded value
 * @param {string} attr.values.url - URL to de/select an attribute value of the product
 * @param {boolean} attr.values.isSelectable - Flag as to whether an attribute value can be
 *     selected.  If there is no variant that corresponds to a specific combination of attribute
 *     values, an attribute may be disabled in the Product Detail Page
 * @param {jQuery} $productContainer - DOM container for a given product
 * @param {Object} msgs - object containing resource messages
 */
function processSwatchValues(attr, $productContainer, msgs) {
    attr.values.forEach(function (attrValue) {
        var $attrValue = $productContainer.find('[data-attr="' + attr.id + '"] [data-attr-value="' +
            attrValue.value + '"]');

        var $swatchButton = $attrValue.parent();

        var $accentedProductContainer = $('#accent_1');
        var $accentableAttrValue = $accentedProductContainer.find('[data-attr="' + attr.id + '"] [data-attr-value="' +
            attrValue.value + '"]');
        // var $accentableButton = $accentableAttrValue.parent();

        var $accentableButton = $('.accents-button.clicked.selected');

        var isCartPage = $('div.cart-page').length > 0;
        if (attrValue.selected) {
            if(!isCartPage){
                $attrValue.addClass('selected');
            }
            $attrValue.parent().addClass('color-pointer');
            $('.color-display-name').text(attrValue.displayValue);
            $attrValue.siblings('.selected-assistive-text').text(msgs.assistiveSelectedText);

            if (attrValue.accentable && attrValue.accentable == true && attrValue.isAccentable !== true) {
                var baseaccentingsku = null;
                if ($('.accents-button.no-accents-button').length && !isCartPage) {
                    baseaccentingsku = $('.accents-button.no-accents-button').data('baseaccentingsku');
                    $('.accents-button.no-accents-button').remove();
                }
                if (!isCartPage && $('.accents-button:not(".no-accents-button")').length) {
                    $('.accent-item').removeClass('d-none');
                    $('.accent-item').addClass('d-block');
                }
                $('.accented-product .accents-button').addClass('d-none');

                $('.accents-button.no-accent img').addClass('default-accent-img');
                $('.accents-button.no-accent .accent-price').empty().append('No Accent');
                $('.accent-step-button-next').empty().append('Apply');
                $('.accents-button.no-accents-button').removeClass('d-none');
                if (!isCartPage) {
                    $('.edit-block-accent').removeClass('d-block');
                    $('.edit-block-accent').addClass('d-none');
                }
                if ($('.add-accent').hasClass('d-none')) {
                    $('.add-accent').removeClass('d-none');
                }
                $('.add-accent').addClass('d-block');
                $('.selected-accent-option').empty().append('');
                $('.selected-accent-price').empty().append('');
                if (!isCartPage) accentDefaultButton(baseaccentingsku);
                if (attrValue.accentingSKUs) {
                    var accentingColor = attrValue.accentingSKUs;
                    var accentingskus = accentingColor.split('|');

                    if (Array.isArray(accentingskus)) {
                        var buttonaccent = [];
                        var accentColor = $('.swatch-circle.selected').parent('.color-attribute').attr('title');
                        var noAccentImg = $('.accents-button.no-accent').attr('title');
                        document.querySelectorAll('.accented-product button').forEach(elem => buttonaccent.push(elem.getAttribute('data-attr-accent-value')));
                        buttonaccent.forEach(function (accent) {
                            accentingskus.forEach(function (skus) {
                                if (accent == skus.trim()) {
                                    // var test = '[data-attr-value=' + skus + ']';
                                    var buttonAttr = '[data-attr-accent-value=' + skus + ']';
                                    $(buttonAttr).removeClass('d-none');
                                    if ($(buttonAttr).hasClass('no-accents-button')) {
                                        document.querySelector('.accent-preview-img').src = $(buttonAttr).attr('data-accentmainimage');
                                    }
                                }
                            });
                        });
                    }
                }
            } else if (!attrValue.isAccentable) {
                $('.accented-product .accents-button').addClass('d-none');
                if (!isCartPage && $('.accents-button:not(".no-accents-button")').length) {
                    $('.accent-item').removeClass('d-block');
                    $('.accent-item').addClass('d-none');
                }
            } else if (attrValue.isAccentable) {
                // else if (!attrValue.isAccentable && attrValue.isAccentable == attrValue.selected){
                // check if this has data-base-accent-sku !== null , and if so enable accents section and edit|remove
                // find the button with base accent sku id to be used as default in modal dialogue
                // remove - find data-base-sku for the selected one and make it as d-block and trigger click

                if ($('.color-attribute.color-pointer').attr('data-baseaccentingsku') !== "null") {

                    $('.accent-item').removeClass('d-none');
                    $('.edit-block-accent').removeClass('d-none');
                    if (!isCartPage) {
                        $('.add-block.add-accent').removeClass('d-block');
                        $('.add-block.add-accent').addClass('d-none');
                    }
                    let baseaccentingSkuValue = $('.color-attribute.color-pointer').attr('data-baseaccentingsku');
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
                                    if (accent == skus.trim()) {
                                        var buttonAttr = '[data-attr-accent-value=' + skus + ']';
                                        $(buttonAttr).removeClass('d-none');
                                        if ($(buttonAttr).hasClass('no-accents-button')) {
                                            document.querySelector('.accent-preview-img').src = $(buttonAttr).attr('data-accentmainimage');
                                        }
                                    }
                                });
                            });
                            let mainImage = baseElem.attr('data-mainproductimage');
                            let baseColorName = $('.color-pointer').attr('title');
                            let noAccentImage = $('.color-pointer').attr('data-noaccentimage');
                            if (!isCartPage) {
                                document.querySelector('.accent-preview-img').src = mainImage;
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

                                noAccentBtnElement.setAttribute('data-url', buttonUrl);
                                if (baseaccentingsku) noAccentBtnElement.setAttribute('data-baseaccentingsku', baseaccentingsku);
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

        } else {
            $attrValue.removeClass('selected');
            $attrValue.parent().removeClass('color-pointer');
            $attrValue.siblings('.selected-assistive-text').empty();
        }

        if (attrValue.url) {
            $swatchButton.attr('data-url', attrValue.url);
            // $accentableButton.attr('data-url',attrValue.url);
        } else {
            $swatchButton.removeAttr('data-url');
            //$accentableButton.removeAttr('data-url');
        }

        // Disable if not selectable
        $attrValue.removeClass('selectable unselectable');

        $attrValue.addClass(attrValue.selectable ? 'selectable' : 'unselectable');
    });
}

/**
 * Process attribute values associated with an attribute that does not have image swatches
 *
 * @param {Object} attr - Attribute
 * @param {string} attr.id - Attribute ID
 * @param {Object[]} attr.values - Array of attribute value objects
 * @param {string} attr.values.value - Attribute coded value
 * @param {string} attr.values.url - URL to de/select an attribute value of the product
 * @param {boolean} attr.values.isSelectable - Flag as to whether an attribute value can be
 *     selected.  If there is no variant that corresponds to a specific combination of attribute
 *     values, an attribute may be disabled in the Product Detail Page
 * @param {jQuery} $productContainer - DOM container for a given product
 */
function processNonSwatchValues(attr, $productContainer) {
    var $attr = '[data-attr="' + attr.id + '"]';
    var $defaultOption = $productContainer.find($attr + ' .select-' + attr.id + ' option:first');
    $defaultOption.attr('value', attr.resetUrl);

    attr.values.forEach(function (attrValue) {
        var $attrValue = $productContainer
            .find($attr + ' [data-attr-value="' + attrValue.value + '"]');
        $attrValue.attr('value', attrValue.url)
            .removeAttr('disabled');
        if (attrValue.selected) {
            $attrValue.addClass('selected');
            $attrValue.parent().addClass('color-pointer');
            $('.size').html(attrValue.displayValue);
        } else {
            $attrValue.removeClass('selected');
            $attrValue.parent().removeClass('color-pointer');
        }

        if (!attrValue.selectable) {
            $attrValue.attr('disabled', true);
        }
    });
}

/**
 * Routes the handling of attribute processing depending on whether the attribute has image
 *     swatches or not
 *
 * @param {Object} attrs - Attribute
 * @param {string} attr.id - Attribute ID
 * @param {jQuery} $productContainer - DOM element for a given product
 * @param {Object} msgs - object containing resource messages
 */
function updateAttrs(attrs, $productContainer, msgs) {
    // Currently, the only attribute type that has image swatches is Color.
    var attrsWithSwatches = ['color'];

    attrs.forEach(function (attr) {
        if (attrsWithSwatches.indexOf(attr.id) > -1) {
            processSwatchValues(attr, $productContainer, msgs);
        } else {
            processNonSwatchValues(attr, $productContainer);
        }
    });
}

/**
 * Updates the availability status in the Product Detail Page
 *
 * @param {Object} response - Ajax response object after an
 *                            attribute value has been [de]selected
 * @param {jQuery} $productContainer - DOM element for a given product
 */
function updateAvailability(response, $productContainer) {
    var availabilityValue = '';
    var availabilityMessages = response.product.availability.messages;
    if (!response.product.readyToOrder) {
        availabilityValue = '<li><div>' + response.resources.info_selectforstock + '</div></li>';
    } 

    if (response.product.comingSoon) {
        availabilityValue += '<span class="label">'+ response.product.productAvailability.label + '</span><span class="msg">' + response.product.productAvailability.launchingLabel + '</span>';
    }
    if (response.product.backInStock) {
        availabilityValue += '<span class="label">'+ response.product.productAvailability.label + '</span><span class="msg">' + response.product.productAvailability.expectedToShipLabel + '</span>';
    }

    if (!response.product.productAvailability) {
        $('.product-availability').addClass("d-none")
    } else {
        $('.product-availability').removeClass("d-none")
    }

    $($productContainer).trigger('product:updateAvailability', {
        product: response.product,
        $productContainer: $productContainer,
        message: availabilityValue,
        resources: response.resources
    });
}

/**
 * Generates html for product attributes section
 *
 * @param {array} attributes - list of attributes
 * @return {string} - Compiled HTML
 */
function getAttributesHtml(attributes) {
    if (!attributes) {
        return '';
    }

    var html = '';

    attributes.forEach(function (attributeGroup) {
        if (attributeGroup.ID === 'mainAttributes') {
            attributeGroup.attributes.forEach(function (attribute) {
                html += '<div class="attribute-values">' + attribute.label + ': ' +
                    attribute.value + '</div>';
            });
        }
    });

    return html;
}

/**
 * @typedef UpdatedOptionValue
 * @type Object
 * @property {string} id - Option value ID for look up
 * @property {string} url - Updated option value selection URL
 */

/**
 * @typedef OptionSelectionResponse
 * @type Object
 * @property {string} priceHtml - Updated price HTML code
 * @property {Object} options - Updated Options
 * @property {string} options.id - Option ID
 * @property {UpdatedOptionValue[]} options.values - Option values
 */

/**
 * Updates DOM using post-option selection Ajax response
 *
 * @param {OptionSelectionResponse} optionsHtml - Ajax response optionsHtml from selecting a product option
 * @param {jQuery} $productContainer - DOM element for current product
 */
function updateOptions(optionsHtml, $productContainer) {
    // Update options
    $productContainer.find('.product-options').empty().html(optionsHtml);
}

function initSwiper(carousel) {
    if ($(window).width() < 640) {
        const swiper = new Swiper(carousel, {
            lazy: true,
            pagination: {
                el: ".swiper-pagination",
                clickable: true,
            },
            resizeObserver: true,
            observeParents: true,
            freeMode: false,
        });
        swiper.update();
    }
}

function ShowLessViewMore(images) {
    var swiperList = document.querySelectorAll('.product-carousel .swiper-slide');
    if (images.length > 4) {
        $('.swiper-wrapper').append('<button class="button button--secondary-fill w-100 view-more-btn"><div class="view-more">View More</div><div class="show-less">Show Less</div></button>');
        swiperList[3].classList.add('overlay-image');
        for (var i = 4; i < swiperList.length; i++) {
            swiperList[i].classList.add('view-more-image');
        }
    }
    $(document).on('click', '.view-more-btn .view-more', function () {
        $(this).parents().find('.swiper-wrapper').addClass('show-all');
    }).on('click', '.view-more-btn .show-less', function () {
        $(this).parents().find('.swiper-wrapper').removeClass('show-all');
    });
}

/**
 * Dynamically creates Bootstrap carousel from response containing images
 * @param {Object[]} imgs - Array of large product images,along with related information
 * @param {jQuery} $productContainer - DOM element for a given product
 */
function createCarousel(imgs, $productContainer) {
    var carousel = $productContainer.find('.product-carousel');
    $(carousel).empty().append('<div class="swiper-wrapper"></div><div class="swiper-pagination"></div>');
    for (var i = 0; i < imgs.length; i++) {
        $('<div class="swiper-slide"><img src="' + imgs[i].url.replace(/main_T/, 'main') + '&fit=vfit" class="img-fluid" alt="' + imgs[i].alt + ' image number ' + parseInt(imgs[i].index, 10) + '" title="' + imgs[i].title + '" data-src="' + imgs[i].url + '" itemprop="image" /></div>').appendTo($(carousel).find('.swiper-wrapper'));
    }
    var imagesList = carousel.find('img');
    $($(carousel).find('.swiper-slide')).first().addClass('active');
    if ($('.product-carousel').length) {
        initSwiper('.product-carousel');
    }
    ShowLessViewMore(imagesList);
}

/**
 * Parses JSON from Ajax call made whenever an attribute value is [de]selected
 * @param {Object} response - response from Ajax call
 * @param {Object} response.product - Product object
 * @param {string} response.product.id - Product ID
 * @param {Object[]} response.product.variationAttributes - Product attributes
 * @param {Object[]} response.product.images - Product images
 * @param {boolean} response.product.hasRequiredAttrsSelected - Flag as to whether all required
 *     attributes have been selected.  Used partially to
 *     determine whether the Add to Cart button can be enabled
 * @param {jQuery} $productContainer - DOM element for a given product.
 */
function handleVariantResponse(response, $productContainer) {
    var isChoiceOfBonusProducts =
        $productContainer.parents('.choose-bonus-product-dialog').length > 0;
    var isVaraint;
    if (response.product.variationAttributes) {
        updateAttrs(response.product.variationAttributes, $productContainer, response.resources);
        isVaraint = response.product.productType === 'variant';
        if (isChoiceOfBonusProducts && isVaraint) {
            $productContainer.parent('.bonus-product-item')
                .data('pid', response.product.id);

            $productContainer.parent('.bonus-product-item')
                .data('ready-to-order', response.product.readyToOrder);
        }
    }

    // Update primary images
    var primaryImageUrls = response.product.images.large;
    createCarousel(primaryImageUrls, $productContainer);

    // Update pricing
    if (!isChoiceOfBonusProducts) {
        var $priceSelector = $('.prices .price', $productContainer).length ?
            $('.prices .price', $productContainer) :
            $('.prices .price');
        $priceSelector.replaceWith(response.product.price.html);
    }

    // Update promotions
    $productContainer.find('.promotions').empty().html(response.product.promotionsHtml);

    updateAvailability(response, $productContainer);

    if (isChoiceOfBonusProducts) {
        var $selectButton = $productContainer.find('.select-bonus-product');
        $selectButton.trigger('bonusproduct:updateSelectButton', {
            product: response.product,
            $productContainer: $productContainer
        });
    } else {
        // Enable "Add to Cart" button if all required attributes have been selected
        $('button.add-to-cart, button.add-to-cart-global, button.update-cart-product-global').trigger('product:updateAddToCart', {
            product: response.product,
            $productContainer: $productContainer
        }).trigger('product:statusUpdate', response.product);
    }

    // Update attributes
    $productContainer.find('.main-attributes').empty()
        .html(getAttributesHtml(response.product.attributes));
        var productId = response.product.id;
        let bookmarkEle = $('.product-bookmark .bookmark');
       bookmarkEle.attr('data-pid',productId);
        //adding bookmarked if the product is in wishlist page
        let wishlistItem = sessionStorage.getItem('wishlistPidArray');
        if (wishlistItem && wishlistItem.indexOf(productId) > -1) {
            bookmarkEle.addClass('bookmarked');
        }
}

/**
 * @typespec UpdatedQuantity
 * @type Object
 * @property {boolean} selected - Whether the quantity has been selected
 * @property {string} value - The number of products to purchase
 * @property {string} url - Compiled URL that specifies variation attributes, product ID, options,
 *     etc.
 */

/**
 * Updates the quantity DOM elements post Ajax call
 * @param {UpdatedQuantity[]} quantities -
 * @param {jQuery} $productContainer - DOM container for a given product
 */
function updateQuantities(quantities, $productContainer) {
    if ($productContainer.parent('.bonus-product-item').length <= 0) {
        var optionsHtml = quantities.map(function (quantity) {
            var selected = quantity.selected ? ' selected ' : '';
            return '<option value="' + quantity.value + '"  data-url="' + quantity.url + '"' +
                selected + '>' + quantity.value + '</option>';
        }).join('');
        getQuantitySelector($productContainer).empty().html(optionsHtml);
    }
}

function update360AssetID(response) {
    var p360assetID = response.product.p360assetID;
    var p360enable = response.product.p360enable;
    if (p360enable && p360assetID) {
        $('.product_360_view').attr('data-vid', p360assetID );
        if (!p360enable) {
        $('.product_360_enable').addClass('d-none');
        }else {
            $('.product_360_enable').removeClass('d-none');
        }
    } else {
        $('.product_360_view').attr('data-vid', '' );
    }
}
function updateAvailabilityleftInventory(response) {
    var availableToSell = response.product.availableToSell;
    var limitedInventoryThreshold = response.limitedInventoryThreshold;
    if (availableToSell && availableToSell <= limitedInventoryThreshold) {
        $('.product-inventory').removeClass('d-none');
        $('.product-inventory').text(response.getResources.labelText + availableToSell + ' ' + response.getResources.labelInventoryleftText);
    } else {
        $('.product-inventory').empty();
    }
}

function viewAddToCartSticky() {
    let $el = $('.sub-container');
    if ($el.length) {
        const config = {
            rootMargin: '0px',
            threshold: 0
        };
        let observer = new IntersectionObserver((entry) => {
            if (!entry[0].isIntersecting) {
                $('.sticky-container').addClass('active');
            } else {
                $('.sticky-container').removeClass('active');
            }
        }, config);
        observer.observe($el[0]);
    }
}

/**
 * 
 * @param {string} storeHTML store html
 * @param {Object} store store object
 * @returns {string} store html with store data
 */
function createStoreHTML(storeHTML, store, resources, selectedStoreID, index) {
    var hoursHtml = '';
    if (store.storeHours) {
        hoursHtml = '<div class="col-12 px-0">';
        var storeHoursStr = store.storeHours;
        var daysArray = storeHoursStr.split(',');
        daysArray.forEach(function (dayAndHour) {
            var daysAndHourArry = dayAndHour.split(' ');
            hoursHtml += `<div class="row mx-0 days-and-time">
                <div class="col-4 px-0">${daysAndHourArry[0]}</div>
                <div class="col-8 px-0 text-right">${daysAndHourArry[1]}</div>
            </div>`;
        });
        hoursHtml += '</div>';
        if (daysArray.length > 2) {
            hoursHtml += '<div class="col-12 px-0"><a href="javascript:void(0)" id="view-all-days" data-text-show-less="' + resources.textShowLess + '" data-text-view-all="' + resources.textViewDays + '">' + resources.textViewDays + '</a></div>';
        }
    }
    var storeAdress2;
    if(store.address2 != null && store.address2.length > 0) {
        storeAdress2 = store.address2;
    } else {
        storeAdress2 = '';
    }

    var html = `<div class="formcheck-wrap" ${store.inventory === 'OOS' ? 'style=opacity:0.5' : ''}>
        <div class="form-check">
            <input class="form-check-input" ${((selectedStoreID === undefined || selectedStoreID === "null") && index === 0)  ? 'checked=true' : ((selectedStoreID !== undefined || selectedStoreID !== "null") && selectedStoreID === store.ID) ? 'checked=true' : ''} type="radio" name="selected-store" id="store-${store.ID}"
                data-store-id="${store.ID}" value="${store.name}" ${store.inventory === 'OOS' ? 'disabled' : ''}>
            <label class="form-check-label store-pickup-label" for="store-${store.ID}">
                <span>${store.name}</span>
            </label>
            <span>(${store.distance} mi)</span>
        </div>
        <div class="store-details">
            <span>${store.inventory === 'OOS' ? '' : resources.textAvailableTomorrow + ', '}${store.inventory === 'OOS'? resources.textOOS : store.inventory + ' ' + resources.textInStock}</span>
            <a href="javascript:void(0)" class="show-store-link">${resources.textStoreDetails}</a>
            <div class="row mx-0 store-detail-row">
                <div class="col-6 px-0">
                <p class="address">${store.address1}, ${storeAdress2} , ${store.stateCode}, ${store.postalCode}, ${store.phone}</p>
                </div>
                <div class="col-6 px-0"></div>
                ${hoursHtml}
            </div>
        </div>
    </div>`;
    
    storeHTML += html;
    return storeHTML;
}

/**
 * Takes store data and returns html with store data
 * @param {Array} stores array of store objectes
 * @returns {string} store html with dynamic data
 */
function getStoreHTML(stores, resources, selectedStoreID) {
    var i;
    var storeHTML = '';
    for (i = 0; i < stores.length; i++) {
        storeHTML = createStoreHTML(storeHTML, stores[i], resources, selectedStoreID, i);
    }
    return storeHTML;
}

/**
 * It takes user location wheather it would be geolocation or postal code and make the ajax call to fetch store data
 * @param {Object} location location object
 */
function showStore(location) {
    var isCartPage = $('input[name=page-name]').val();
    var selectedStoreID = $('#findAStore').attr('instore-id');
    var pid = isCartPage ? $('#findAStore').attr('pid') : getPidValue($('button.add-to-cart, button.add-to-cart-global'));
    var findStoreUrl = $('#zip-code-submit').attr('data-findstore-url');
    var url = Object.hasOwnProperty.call(location, 'postalCode') && location.postalCode ?
        findStoreUrl + '&products=' + pid + '&postalCode=' + location.postalCode :
        findStoreUrl + '&products=' + pid + '&lat=' + location.latitude + '&long=' + location.longitude;
    $.spinner().start();
    $.ajax({
        url: url,
        method: 'GET',
        success: function (data) {
            if (data.stores.length && data.storeWithInventory) {
                if (!isCartPage) {
                    $('.pickup-instore-label').html('<span>' + data.stores[0].name + '</span>');
                }
                $('.delivery-options-container').removeClass('d-none');
                $('#pickup-in-store').attr('disabled', false);
                $('#pickup-in-store').attr('data-store-id', data.stores[0].ID);
                $('.store-result-wrap').html(getStoreHTML(data.stores, data.resources, selectedStoreID));
                $('#number-of-store').html(data.stores.length);
                $('#pick-up-store, #cancel-store, .store-count').addClass('active');
            } else {
                var postalCodeMsg = $('.postalcode-msg');
                var IsFindStoreVisible = $("#findAStore").is(':visible');
                if(!IsFindStoreVisible) {
                    if (!isCartPage) {
                        $('.pickup-instore-label').html('<span>Pick Up in Store</span>');
                    }
                    
                    if(!data.storeWithInventory) {
                        $('.delivery-options-container').addClass('d-none');
                    }
                    $('#pickup-in-store').attr('disabled', true);
                    $('#pickup-in-store').attr('data-store-id', '');
                }
                if(data.stores.length === 0) {
                    postalCodeMsg.html(postalCodeMsg.attr('data-wrong-postal'));
                }
                $('.store-result-wrap').html('');
                $('#pick-up-store, #cancel-store, .store-count').removeClass('active');
            }
            $.spinner().stop();
        },
        error: function (err) {
            $.spinner().stop();
            console.log(err);
        }
    });
}

/**
 * It is call back for positions of geolocation
 * @param {Object} position postion object of geolocation
 */
function showPosition(position) {
    var geoPosition = {
      coords: {
         latitude: position.coords.latitude,
         longitude: position.coords.longitude
      }
    }
    sessionStorage.setItem('geoPosition', JSON.stringify(geoPosition));
    var location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
    }
    showStore(location);
}

/**
 * Runs when any error will happen regarding geolocation
 * @param {string} error error string
 */
function showError(error) {
    console.log(error);
}

/**
 * Store related front end management done here
 */
function getStores() {
    var geoPosition = JSON.parse(sessionStorage.getItem('geoPosition'));
    var sessionStore = JSON.parse(window.sessionStorage.getItem('store'));
    if (sessionStore && Object.hasOwnProperty.call(sessionStore, 'store') && sessionStore.store) {
        $('.pickup-instore-label').html('<span>' + sessionStore.store.name + '</span>');
        $('#pickup-in-store').attr('disabled', false);
        $('#pickup-in-store').attr('data-store-id', sessionStore.store.ID);
    } else {
        if (navigator.geolocation && geoPosition === null) {
            navigator.geolocation.getCurrentPosition(showPosition, showError);
        }  
        else {
            showPosition(geoPosition)
        }
    }
};
function s7spinview (response) {
    let spinWrapper = $(".product_360_view");
    if (((typeof s7viewers === "undefined") || typeof s7viewers === "function" && typeof s7viewers.SpinViewer === 'undefined' || typeof s7viewers.SpinViewer === 'undefined') && (response && response.p360src)) {
        var scriptElm = document.createElement('script');
        scriptElm.setAttribute('src', response.p360src);
        spinWrapper.append(scriptElm);
    }
    let $el = $('#s7_spinview');
    let $vid =(response && response.product && response.product.p360assetID) ? response.product.p360assetID : spinWrapper.attr("data-vid");
    if ($el.length && $vid) {
        let SpinViewImage = new IntersectionObserver((entry, self) => {
            if (entry[0].isIntersecting && response != undefined) {
                $.ajax({
                    url: response.p360imageUrl + $vid,
                    method: 'POST',
                    success: function () {
                        var spinView = new s7viewers.SpinViewer();
                        spinView.setParam("serverurl",response.p360serverurl);
                        spinView.setParam("asset", response.p360Folder + $vid);
                        spinView.setParam("config", response.p360config);
                        spinView.setParam("contenturl", response.p360contenturl);
                        spinView.setParam("config2", response.p360config2);
                        spinView.setParam("stagesize", response.sizeAttributesfor360View);
                        spinView.setContainerId("s7_spinview");
                        spinView.init();
                        spinWrapper.find('.spinWrapper').show();
                    },
                    error: function () {
                        $el.empty();
                        spinWrapper.find('.spinWrapper').hide();
                    }
                });
                self.unobserve(spinWrapper[0]);
            }
        });
        SpinViewImage.observe(spinWrapper[0]);
    } else {
        $el.empty();
        spinWrapper.find('.spinWrapper').hide();
    }
};

function updateSwiperonPurchase () {
    if ($('.purchase-component')) {
        const swiper = new Swiper('.purchase-component', {
            slidesPerView: 2.2,
            spaceBetween: 16,
            freeMode: true,
            resizeObserver: true,
            observeParents: true,
            lazy: true,
            breakpoints: {
                744: {
                    slidesPerView: 4,
                }
            }
        });
    }
}
/**
 * updates the product URL when we change the varient 
 * @param {string} productUrl - the Url for the selected variation value
 */
function redirectioUrlPDP(productUrl) {
    window.history.pushState({}, '', productUrl);
}

/**
 * updates the product view when a product attribute is selected or deselected or when
 *         changing quantity
 * @param {string} selectedValueUrl - the Url for the selected variation value
 * @param {jQuery} $productContainer - DOM element for current product
 */
function attributeSelect(selectedValueUrl, $productContainer) {
    if (selectedValueUrl) {
        $('.delivery-options-container').addClass('d-none');
        $('body').trigger('product:beforeAttributeSelect', {
            url: selectedValueUrl,
            container: $productContainer
        });
        var isCartPage = $('input[name=page-name]').val();
        var storeId = $('#editProductModal').attr('store-id');
        if (isCartPage && storeId) {
            selectedValueUrl += '&storeId=' + storeId;
        }
        $.ajax({
            url: selectedValueUrl,
            method: 'GET',
            success: function (data) {
                handleVariantResponse(data, $productContainer);
                //adding bookmarked if the product is in wishlist page
                let bookMark = $('.product-bookmark .bookmark');
                bookMark.attr('data-pid');
                let wishlistItem = sessionStorage.getItem('wishlistPidArray');
                if (wishlistItem && wishlistItem.indexOf(bookMark) > -1) {
                    bookMark.addClass('bookmarked');
                } else {
                    bookMark.removeClass('bookmarked');
                }

                if (wishlistItem) {
                    wishlistItem = wishlistItem.split(',');
                    wishlistItem.map(function (i) {
                        $('.product-bookmark [data-pid = ' + i + ']').addClass('bookmarked');
                    });
                }
                updateOptions(data.product.optionsHtml, $productContainer);
                updateQuantities(data.product.quantities, $productContainer);
                $('body').trigger('product:afterAttributeSelect', {
                    data: data,
                    container: $productContainer
                });
                updateAvailabilityleftInventory(data);
                update360AssetID(data);
                s7spinview(data);
                $('.error-msg-add-to-cart').empty();
                $('#editProductModal .modal-footer-error').empty();
                $('#services-included-with-purchase').html(renderIncludedWithPurchase(data));
                updateSwiperonPurchase();
                updateMonogramForVariation(data.product.monogramable || data.product.isPremium);
                if (data.product.isPremium === false) {
                    $('.monogram-option-selection').addClass('d-none');
                    $('.classic-both').removeClass('d-none');
                    $('.monogram-option-selection').removeClass('hide-premium-mono');
                } else {
                    $('.monogram-option-selection').removeClass('d-none');
                    $('.classic-both').addClass('d-none');
                    $('.monogram-option-selection').addClass('hide-premium-mono');
                }
                $('#rfkPDPRequestData').val(data.rfkPDPRequestData);
                reflektionCarousel.renderTemplate();
                $.spinner().stop();
                var isStorePickupEnabledForSite = $('#isStorePickupEnabled').val();
                if (!isCartPage && isStorePickupEnabledForSite === 'true') {
                    getStores();
                }
                if ($('.product-detail').length > 0 && data.prod_url) {
                    redirectioUrlPDP(data.prod_url);
                }
            },
            error: function () {
                $.spinner().stop();
            }
        });
    }
}

/**
 * get the defaultValueUrl on page load
 * @param {string} defaultValueUrl - the Url for the default variation value
 * @param {jQuery} $productContainer - DOM element for current product
 */
function defaultVariantattributeSelect(defaultValueUrl, $productContainer) {
    if (defaultValueUrl) {
        $.ajax({
            url: defaultValueUrl,
            method: 'GET',
            success: function (data) {
                if (data.defaultVariationUrl) {
                    attributeSelect(data.defaultVariationUrl, $productContainer);
                }
            },
            error: function () {
                $.spinner().stop();
            }
        });
    }
}
/**
 * Retrieves url to use when adding a product to the cart
 *
 * @return {string} - The provided URL to use when adding a product to the cart
 */
function getAddToCartUrl() {
    return $('.add-to-cart-url').val();
}

/**
 * Parses the html for a modal window
 * @param {string} html - representing the body and footer of the modal window
 *
 * @return {Object} - Object with properties body and footer.
 */
function parseHtml(html) {
    var $html = $('<div>').append($.parseHTML(html));

    var body = $html.find('.choice-of-bonus-product');
    var footer = $html.find('.modal-footer').children();

    return {
        body: body,
        footer: footer
    };
}

/**
 * Retrieves url to use when adding a product to the cart
 *
 * @param {Object} data - data object used to fill in dynamic portions of the html
 */
function chooseBonusProducts(data) {
    $('.modal-body').spinner().start();

    if ($('#chooseBonusProductModal').length !== 0) {
        $('#chooseBonusProductModal').remove();
    }
    var bonusUrl;
    if (data.bonusChoiceRuleBased) {
        bonusUrl = data.showProductsUrlRuleBased;
    } else {
        bonusUrl = data.showProductsUrlListBased;
    }

    var htmlString = '<!-- Modal -->' +
        '<div class="modal fade" id="chooseBonusProductModal" tabindex="-1" role="dialog">' +
        '<span class="enter-message sr-only" ></span>' +
        '<div class="modal-dialog choose-bonus-product-dialog" ' +
        'data-total-qty="' + data.maxBonusItems + '"' +
        'data-UUID="' + data.uuid + '"' +
        'data-pliUUID="' + data.pliUUID + '"' +
        'data-addToCartUrl="' + data.addToCartUrl + '"' +
        'data-pageStart="0"' +
        'data-pageSize="' + data.pageSize + '"' +
        'data-moreURL="' + data.showProductsUrlRuleBased + '"' +
        'data-bonusChoiceRuleBased="' + data.bonusChoiceRuleBased + '">' +
        '<!-- Modal content-->' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '    <span class="">' + data.labels.selectprods + '</span>' +
        '    <button type="button" class="close pull-right" data-dismiss="modal">' +
        '        <span aria-hidden="true">&times;</span>' +
        '        <span class="sr-only"> </span>' +
        '    </button>' +
        '</div>' +
        '<div class="modal-body"></div>' +
        '<div class="modal-footer"></div>' +
        '</div>' +
        '</div>' +
        '</div>';
    $('body').append(htmlString);
    $('.modal-body').spinner().start();

    $.ajax({
        url: bonusUrl,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            var parsedHtml = parseHtml(response.renderedTemplate);
            $('#chooseBonusProductModal .modal-body').empty();
            $('#chooseBonusProductModal .enter-message').text(response.enterDialogMessage);
            $('#chooseBonusProductModal .modal-header .close .sr-only').text(response.closeButtonText);
            $('#chooseBonusProductModal .modal-body').html(parsedHtml.body);
            $('#chooseBonusProductModal .modal-footer').html(parsedHtml.footer);
            $('#chooseBonusProductModal').modal('show');
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

/**
 * Updates the Mini-Cart quantity value after the customer has pressed the "Add to Cart" button
 * @param {string} response - ajax response from clicking the add to cart button
 */
function handlePostCartAdd(response) {
    $('.minicart').trigger('count:update', response);
    var messageType = response.error ? 'alert-danger' : 'alert-success';
    // show add to cart toast
    if (response.newBonusDiscountLineItem &&
        Object.keys(response.newBonusDiscountLineItem).length !== 0) {
        chooseBonusProducts(response.newBonusDiscountLineItem);
    } else {
        if ($('.add-to-cart-messages').length === 0) {
            $('body').append(
                '<div class="add-to-cart-messages"></div>'
            );
        }

        $('.add-to-cart-messages').append(
            '<div class="alert ' + messageType + ' add-to-basket-alert text-center" role="alert">' +
            response.message +
            '</div>'
        );

        setTimeout(function () {
            $('.add-to-basket-alert').remove();
        }, 5000);
    }
}

/**
 * Retrieves the bundle product item ID's for the Controller to replace bundle master product
 * items with their selected variants
 *
 * @return {string[]} - List of selected bundle product item ID's
 */
function getChildProducts() {
    var childProducts = [];
    $('.bundle-item').each(function () {
        childProducts.push({
            pid: $(this).find('.product-id').text(),
            quantity: parseInt($(this).find('label.quantity').data('quantity'), 10)
        });
    });

    return childProducts.length ? JSON.stringify(childProducts) : [];
}

/**
 * Retrieve product options
 *
 * @param {jQuery} $productContainer - DOM element for current product
 * @return {string} - Product options and their selected values
 */
function getOptions($productContainer) {
    var options = $productContainer
        .find('.product-option')
        .map(function () {
            var $elOption = $(this).find('.options-select');
            var urlValue = $elOption.val();
            var selectedValueId = $elOption.find('option[value="' + urlValue + '"]')
                .data('value-id');
            return {
                optionId: $(this).data('option-id'),
                selectedValueId: selectedValueId
            };
        }).toArray();

    return JSON.stringify(options);
}

/**
 * Makes a call to the server to report the event of adding an item to the cart
 *
 * @param {string | boolean} url - a string representing the end point to hit so that the event can be recorded, or false
 */
function miniCartReportingUrl(url) {
    if (url) {
        $.ajax({
            url: url,
            method: 'GET',
            success: function () {
                // reporting urls hit on the server
            },
            error: function () {
                // no reporting urls hit on the server
            }
        });
    }
}

function minicartFlyout(data) {
    let miniFlyout = '';
    let cartItems = data.cart.items;
    if (cartItems.length > 1) {
        for (let item of cartItems) {
            let miniCartLineItem = item;
            if (!item.isPremiumMonogramLetter && !item.parentProductLineItemID) {
            miniFlyout += `<div class="image-content">
            <div class="item-image">
            <img class="product-image"
            src="${miniCartLineItem.images.small[0].url}"
            alt="${miniCartLineItem.images.small[0].alt}"
            title="${miniCartLineItem.images.small[0].title}">
            </div>
            <div class="product-content">`;
            if (miniCartLineItem.collection) {
                miniFlyout += `<h6>${miniCartLineItem.collection}</h6>`;
            }
            miniFlyout += `<span class="product-title">${miniCartLineItem.productName}</span>
                    <span>${miniCartLineItem.renderedPrice}</span>`;

            Object.keys(miniCartLineItem.variationAttributes).forEach(x => {
                const displayValue = miniCartLineItem.variationAttributes[x].displayValue.toLowerCase();
                const valueCapitalize = displayValue.charAt(0).toUpperCase() + displayValue.slice(1);
                miniFlyout += `<p class="line-item-attributes">${miniCartLineItem.variationAttributes[x].displayName}: ${valueCapitalize}</p>`;
            });
            if (miniCartLineItem.monogramable && miniCartLineItem.monogramLineItem) {
                var mColor = miniCartLineItem.monogramLineItem.color;
                if(mColor && mColor.split('_').length > 0) {
                    mColor = 'color:#'+mColor.split('_')[1];
                }
                miniFlyout += `<p><span class="icon">${miniCartLineItem.monogramLineItem.character.replace(/\(/g, '<span class="numberFormat">').replace(/\)/g, '</span>')}</span> Embossed Monogram</p>`;
            }
            if (miniCartLineItem.isAccentingSku) {
                miniFlyout += '<p class = "accenting"><span class="icon-accent"></span> Atlantic Accents</p>';
            }
            if (miniCartLineItem.isPremiumMonogrammedPLI && miniCartLineItem.associatedLetter && miniCartLineItem.associatedLetter.length >= 2) {
                miniFlyout += `<p><span class="icon" >${miniCartLineItem.associatedLetter.splice(-2).join('').replace(/\(/g, '<span class="numberFormat">').replace(/\)/g, '</span>')}</span> Metal Monogram</p>`;
            }
        }
            miniFlyout += `</div>
            </div>`;
        }
        
    } else {
        let miniCartLineItem = data.cart.items[data.cart.items.length - 1];
        miniFlyout += `<div class="image-content">
            <div class="item-image">
            <img class="product-image"
            src="${miniCartLineItem.images.small[0].url}"
            alt="${miniCartLineItem.images.small[0].alt}"
            title="${miniCartLineItem.images.small[0].title}">
            </div>
            <div class="product-content">`;
        if (miniCartLineItem.collection) {
            miniFlyout += `<h6>${miniCartLineItem.collection}</h6>`;
        }
        miniFlyout += `<span class="product-title">${miniCartLineItem.productName}</span>
            <span>${miniCartLineItem.renderedPrice}</span>`;
    
        Object.keys(miniCartLineItem.variationAttributes).forEach(x => {
            const displayValue = miniCartLineItem.variationAttributes[x].displayValue.toLowerCase();
            const valueCapitalize = displayValue.charAt(0).toUpperCase() + displayValue.slice(1);
            miniFlyout += `<p class="line-item-attributes">${miniCartLineItem.variationAttributes[x].displayName}: ${valueCapitalize}</p>`;
        });
        if (miniCartLineItem.monogramable && miniCartLineItem.monogramLineItem) {
            // var mColor = miniCartLineItem.monogramLineItem.color;
            // if(mColor && mColor.split('_').length > 0) {
            //     mColor = 'color:#'+mColor.split('_')[1];
            // }
            miniFlyout += `<p><span class="icon">${miniCartLineItem.monogramLineItem.character.replace(/\(/g, '<span class="numberFormat">').replace(/\)/g, '</span>')}</span> Embossed Monogram</p>`;
        }
        if (miniCartLineItem.isPremiumMonogrammedPLI && miniCartLineItem.associatedLetter && miniCartLineItem.associatedLetter.length >= 2) {
            miniFlyout += `<p><span class="icon" >${miniCartLineItem.associatedLetter.slice(-2).join('').replace(/\(/g, '<span class="numberFormat">').replace(/\)/g, '</span>')}</span> Metal Monogram</p>`;
        }
        //  miniFlyout += `<p><svg width="28" height="16" viewBox="0 0 28 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        // <rect width="28" height="16" fill="#C4C4C4"/>
        // </svg> Atlantic Accents</p>`;
        miniFlyout += `</div>
        </div>`;
    }
    miniFlyout += `
        <div>
        <a class="button button--primary w-100" href="${data.cart.miniCartUrls.checkoutUrl}" title="">
        ${data.cart.miniCartResources.Checkout}
        </a>
        <a class="button button--secondary w-100" href="${data.cart.miniCartUrls.viewMyCartUrl}" title="">
        ${data.cart.miniCartResources.viewMyCart}
        </a>
        </div>`;

    return miniFlyout;
}

var getDefaultVariationUrl = function () {
    let $productContainer;

    $productContainer = $('.product-detail');
    let variationUrl = $('#getDefaultVariationUrl').val();
    if (variationUrl) {
        defaultVariantattributeSelect(variationUrl, $productContainer);
    }
};

/**
 * handle attribute selection during page load and attribute click
 * @param {Object} param0 Collection of attribute level info such as url, container and tracking information
 * @param {function} cb Callback function
 */
var handleAttributeSelection = function () {
    let variationUrl;
    let selectedVariation;
    let $productContainer;

    $productContainer = $('.product-detail');
    selectedVariation = $('.product-detail.product-wrapper').data('selected-variant-pid');
    if (!selectedVariation) {
        variationUrl = $('#defaultVariationUrl').val();
        attributeSelect(variationUrl, $productContainer);
    } else {
        attributeSelect(selectedVariation, $productContainer);
    }
};


/**
 * GTM - Triggered by Add to Button, add product info into object
 * @param {Object} items - current cart items
 * @param {function} stockObj - object contains cart items' stock values
 * @param {Object} upcObj - object contains cart items' upc values
 * @param {function} breadcrumbObj - object contains cart items' breadcrombs values
 * @param {function} pdpUrlObj - object contains cart items' PDP URL values
 * @returns {[Object]} - cartProducts array of objects
 */
function getCartProducts(items, stockObj, upcObj, breadcrumbObj, pdpUrlObj) {
    var products = [];
    try {
        for (let item of items) {
            var product = {};
            var pid = item.id;
            product.sku = item.id;
            product.name = item.productName;
            product.category = breadcrumbObj[pid];
            product.oldPrice = (item.price.list === null) ? item.price.sales.value : item.price.list.value;
            product.price = item.price.sales ? item.price.sales.value : null;
            product.url = pdpUrlObj[pid];
            product.stock = stockObj[pid];
            product.upc = upcObj[pid]
            product.category = item.collection;
            product.quantity = item.quantity;
    
            products.push(product);
        }
        return products;
    } catch (e) {
        return products;
    }
}

/**
 * Generate GTM cart data using responce data
 * @param {Object} data Collection of attribute level info such as url, container and tracking information
 * @returns dataLayerJson object
 */
function generateCartDataLayerJson(data) {
    window.dataLayer = window.dataLayer || [];
    var dataLayerJson = window.dataLayer[0]
    var stockObj = data.stockObj;
    var upcObj = data.upcObj;
    var breadcrumbObj = data.breadcrumbObj;
    var pdpUrlObj = data.pdpUrlObj;

    try {   
        var shippingCost = data.cart.totals.totalShippingCost === 'Free' ? 0.0 : (data.cart.totals.totalShippingCost * 1)
        var subTotalStr = data.cart.totals.subTotal;
        var subTotal = subTotalStr.slice(1, subTotalStr.length).replace(',', '') * 1;
        var totalTaxStr = data.cart.totals.totalTax;
        var totalTax = totalTaxStr.slice(1, totalTaxStr.length).replace(',', '') * 1;

        dataLayerJson.cartID = data.pliUUID;
        dataLayerJson.cartCurrency = data.currency;
        dataLayerJson.cartSubtotal = subTotal;
        dataLayerJson.cartSubtotal_Include_Tax = subTotal + totalTax;
        dataLayerJson.cart_Tax = totalTax;
        
        dataLayerJson.cart_total = subTotal + totalTax + shippingCost;
        dataLayerJson.cart_delivery_cost = shippingCost;
        var cartProducts = getCartProducts(data.cart.items, stockObj, upcObj, breadcrumbObj, pdpUrlObj);
        dataLayerJson.cartProducts = cartProducts;
        dataLayerJson.cartProductsFinal = cartProducts;

    } catch(e) {
        return;
    }

}

module.exports = {
    attributeSelect: attributeSelect,
    viewAddToCartSticky: viewAddToCartSticky,
    methods: {
        editBonusProducts: function (data) {
            chooseBonusProducts(data);
        }
    },
    s7spinview:s7spinview,
    findStoreByLocationOrZipCode: function () {
        $(document).on('click', '#zip-code-submit', function (e) {
            e.preventDefault();
            var postalCode = $('input[name=postalCode]').val();
            var regex = /^[-\/#&+\w\s]*$/;
            var postalCodeMsg = $('.postalcode-msg');
            if (!regex.test(postalCode)) {
                e.preventDefault();
                postalCodeMsg.html(postalCodeMsg.attr('data-wrong-postal'));
                 return false;
            }

            if (postalCode) {
                var geocoder = new google.maps.Geocoder();
                geocoder.geocode( { address:postalCode }, function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        var latitude = results[0].geometry.location.lat();
                        var longitude = results[0].geometry.location.lng();
                        var location = {
                            latitude: latitude,
                            longitude: longitude
                        }
                        $('.postalcode-msg').empty();
                        showStore(location);
                    } else {
                        postalCodeMsg.html(postalCodeMsg.attr('data-wrong-postal'));
                    }
                });  
            } else {
                postalCodeMsg.html(postalCodeMsg.attr('data-empty'));
            }           
        });

        $(document).on('click', '.current-location a', function (e) {
            e.preventDefault();
            var geoPosition = JSON.parse(sessionStorage.getItem('geoPosition'));
            if (navigator.geolocation && geoPosition === null) {
                navigator.geolocation.getCurrentPosition(showPosition, showError);
            }  
            else {
                showPosition(geoPosition)
            }
        });

        $('.change-store').on('click', function () {
            $('#findAStore').attr('pid', $(this).attr('pid'));
            $('#findAStore').attr('instore-id', $(this).attr('data-instore-id').toString());
            $('#findAStore').attr('find-store-url', $(this).parent().children('input').attr('data-find-store-url'));
            var geoPosition = JSON.parse(sessionStorage.getItem('geoPosition'));
            if (navigator.geolocation && geoPosition === null) {
                navigator.geolocation.getCurrentPosition(showPosition, showError);
            }
            else {
                showPosition(geoPosition)
            }
        });

        $('#pick-up-store').on('click', function () {
            if ($('input[name=selected-store]:checked').val()) {
                $('.pickup-instore-label').html('<span>' + $('input[name=selected-store]:checked').val() + '</span>');
                $('#pickup-in-store').attr('checked', 'checked');
                $('#pickup-in-store').attr('data-store-id', $('input[name=selected-store]:checked').attr('data-store-id'));
                $('#findAStore').modal('hide');
            }
            // $('.monogram-option-selection').addClass('d-none');
            // $('.classic-both').removeClass('d-none');
        });

        $('.find-store-btn').on('click', function (e) {
            e.preventDefault();
            $('.instorePickupSection').css('display', 'block');
        });
    },

    focusChooseBonusProductModal: function () {
        $('body').on('shown.bs.modal', '#chooseBonusProductModal', function () {
            $('#chooseBonusProductModal').siblings().attr('aria-hidden', 'true');
            $('#chooseBonusProductModal .close').focus();
        });
    },

    onClosingChooseBonusProductModal: function () {
        $('body').on('hidden.bs.modal', '#chooseBonusProductModal', function () {
            $('#chooseBonusProductModal').siblings().attr('aria-hidden', 'false');
        });
    },

    trapChooseBonusProductModalFocus: function () {
        $('body').on('keydown', '#chooseBonusProductModal', function (e) {
            var focusParams = {
                event: e,
                containerSelector: '#chooseBonusProductModal',
                firstElementSelector: '.close',
                lastElementSelector: '.add-bonus-products'
            };
            focusHelper.setTabNextFocus(focusParams);
        });
    },

    colorAttribute: function () {
        $(document).on('click', '[data-attr="color"] button', function (e) {
            e.preventDefault();

            if ($(this).attr('disabled')) {
                return;
            }
            var isCartPage = $('div.cart-page').length > 0;
            if (!isCartPage && e.currentTarget.classList.contains('accents-button')) {
                return;
            }
            var $productContainer = $(this).closest('.set-item');
            if ($('.compare-products-tiles').length) {
                $productContainer = $(this).closest('.compare-products-tiles');
            } else {
                $productContainer = $(this).closest('.product-detail');
            }

            attributeSelect($(this).attr('data-url'), $productContainer);
        });
    },

    selectAttribute: function () {
        $(document).on('click', 'button.size-selector', function (e) {
            e.preventDefault();
            var sizeURL = $(e.currentTarget).attr('value');
            var $productContainer = $(this).closest('.set-item');
            if (!$productContainer.length) {
                $productContainer = $(this).closest('.product-detail');
            }
            attributeSelect(sizeURL, $productContainer);
        });
    },

    availability: function () {
        $(document).on('change', '.quantity-select', function (e) {
            e.preventDefault();

            var $productContainer = $(this).closest('.product-detail');
            if (!$productContainer.length) {
                $productContainer = $(this).closest('.modal-content').find('.product-quickview');
            }

            if ($('.bundle-items', $productContainer).length === 0) {
                attributeSelect($(e.currentTarget).find('option:selected').data('url'),
                    $productContainer);
            }
        });
    },

    addToCart: function () {
        $('.d-mobile #miniCartModal').on('hidden.bs.modal', function() {
            $('.minicart-flyout').addClass('minicart-swipe');
            $('.d-mobile .minicart-flyout').off('touchstart').off('touchmove')
        });
        
        $(document).on('click', 'button.add-to-cart, button.add-to-cart-global', function () {
            var addToCartUrl;
            var pid;
            var pidsObj;
            var setPids;
            var tumiJson = $('.monogram-item.edit-monogram').attr('data-form');
            $.spinner().start()
            $('body').trigger('product:beforeAddToCart', this);

            if ($('.set-items').length && $(this).hasClass('add-to-cart-global')) {
                setPids = [];

                $('.product-detail').each(function () {
                    if (!$(this).hasClass('product-set-detail')) {
                        setPids.push({
                            pid: $(this).find('.product-id').text(),
                            qty: $(this).find('.quantity-select').val(),
                            options: getOptions($(this))
                        });
                    }
                });
                pidsObj = JSON.stringify(setPids);
            }

            pid = getPidValue($(this));

            var $productContainer = $(this).closest('.product-detail');
            if (!$productContainer.length) {
                $productContainer = $(this).closest('.quick-view-dialog').find('.product-detail');
            }
            addToCartUrl = getAddToCartUrl();
            var storeId = $('#pickup-in-store').is(':checked') ? $('#pickup-in-store').attr('data-store-id') : null;
            var form = {
                pid: pid,
                pidsObj: pidsObj,
                childProducts: getChildProducts(),
                quantity: 1,
                storeId: storeId,
                personalizationData: tumiJson
            };
            if (!$('.bundle-item').length) {
                form.options = getOptions($productContainer);
            }

            $(this).trigger('updateAddToCartFormData', form);
            if (addToCartUrl) {
                $.ajax({
                    url: addToCartUrl,
                    method: 'POST',
                    data: form,
                    success: function (data) {
                        handlePostCartAdd(data);
                        $('#flyout-minicart').html(minicartFlyout(data));
                        if(data.error && data.message) {
                            $('.error-msg-add-to-cart').html(data.message);
                            $('#miniCartModal').modal('hide');
                        }else {
                        $('#miniCartModal').modal('show');
                        }
                        let initialTouch;
                        $('.d-mobile .minicart-flyout').on('touchstart', function (e){
                                initialTouch = e.originalEvent.touches[0].clientY;
                        }).on('touchmove', function(e) {
                            const currentTouch = e.originalEvent.changedTouches[0].clientY;
                            if(initialTouch > currentTouch) $('.minicart-flyout').removeClass('minicart-swipe')
                        });
                        miniCartReportingUrl(data.reportingURL);
                        generateCartDataLayerJson(data);
                        if ($('.cart-details .product-add-to-cart .add-to-cart').length) {
                            location.reload();
                        }
                        $('body').trigger('product:afterAddToCart', data);
                        $.spinner().stop();
                    },
                    error: function () {
                        $.spinner().stop();
                    }
                });
            }
        });
    },
    selectBonusProduct: function () {
        $(document).on('click', '.select-bonus-product', function () {
            var $choiceOfBonusProduct = $(this).parents('.choice-of-bonus-product');
            var pid = $(this).data('pid');
            var maxPids = $('.choose-bonus-product-dialog').data('total-qty');
            var submittedQty = parseInt($choiceOfBonusProduct.find('.bonus-quantity-select').val(), 10);
            var totalQty = 0;
            $.each($('#chooseBonusProductModal .selected-bonus-products .selected-pid'), function () {
                totalQty += $(this).data('qty');
            });
            totalQty += submittedQty;
            var optionID = $choiceOfBonusProduct.find('.product-option').data('option-id');
            var valueId = $choiceOfBonusProduct.find('.options-select option:selected').data('valueId');
            if (totalQty <= maxPids) {
                var selectedBonusProductHtml = '' +
                    '<div class="selected-pid row" ' +
                    'data-pid="' + pid + '"' +
                    'data-qty="' + submittedQty + '"' +
                    'data-optionID="' + (optionID || '') + '"' +
                    'data-option-selected-value="' + (valueId || '') + '"' +
                    '>' +
                    '<div class="col-sm-11 col-9 bonus-product-name" >' +
                    $choiceOfBonusProduct.find('.product-name').html() +
                    '</div>' +
                    '<div class="col-1"><i class="fa fa-times" aria-hidden="true"></i></div>' +
                    '</div>';
                $('#chooseBonusProductModal .selected-bonus-products').append(selectedBonusProductHtml);
                $('.pre-cart-products').html(totalQty);
                $('.selected-bonus-products .bonus-summary').removeClass('alert-danger');
            } else {
                $('.selected-bonus-products .bonus-summary').addClass('alert-danger');
            }
        });
    },
    removeBonusProduct: function () {
        $(document).on('click', '.selected-pid', function () {
            $(this).remove();
            var $selected = $('#chooseBonusProductModal .selected-bonus-products .selected-pid');
            var count = 0;
            if ($selected.length) {
                $selected.each(function () {
                    count += parseInt($(this).data('qty'), 10);
                });
            }

            $('.pre-cart-products').html(count);
            $('.selected-bonus-products .bonus-summary').removeClass('alert-danger');
        });
    },
    enableBonusProductSelection: function () {
        $('body').on('bonusproduct:updateSelectButton', function (e, response) {
            $('button.select-bonus-product', response.$productContainer).attr('disabled',
                (!response.product.readyToOrder || !response.product.available));
            var pid = response.product.id;
            $('button.select-bonus-product', response.$productContainer).data('pid', pid);
        });
    },
    showMoreBonusProducts: function () {
        $(document).on('click', '.show-more-bonus-products', function () {
            var url = $(this).data('url');
            $('.modal-content').spinner().start();
            $.ajax({
                url: url,
                method: 'GET',
                success: function (html) {
                    var parsedHtml = parseHtml(html);
                    $('.modal-body').append(parsedHtml.body);
                    $('.show-more-bonus-products:first').remove();
                    $('.modal-content').spinner().stop();
                },
                error: function () {
                    $('.modal-content').spinner().stop();
                }
            });
        });
    },
    addBonusProductsToCart: function () {
        $(document).on('click', '.add-bonus-products', function () {
            var $readyToOrderBonusProducts = $('.choose-bonus-product-dialog .selected-pid');
            var queryString = '?pids=';
            var url = $('.choose-bonus-product-dialog').data('addtocarturl');
            var pidsObject = {
                bonusProducts: []
            };

            $.each($readyToOrderBonusProducts, function () {
                var qtyOption =
                    parseInt($(this)
                        .data('qty'), 10);

                var option = null;
                if (qtyOption > 0) {
                    if ($(this).data('optionid') && $(this).data('option-selected-value')) {
                        option = {};
                        option.optionId = $(this).data('optionid');
                        option.productId = $(this).data('pid');
                        option.selectedValueId = $(this).data('option-selected-value');
                    }
                    pidsObject.bonusProducts.push({
                        pid: $(this).data('pid'),
                        qty: qtyOption,
                        options: [option]
                    });
                    pidsObject.totalQty = parseInt($('.pre-cart-products').html(), 10);
                }
            });
            queryString += JSON.stringify(pidsObject);
            queryString = queryString + '&uuid=' + $('.choose-bonus-product-dialog').data('uuid');
            queryString = queryString + '&pliuuid=' + $('.choose-bonus-product-dialog').data('pliuuid');
            $.spinner().start();
            $.ajax({
                url: url + queryString,
                method: 'POST',
                success: function (data) {
                    $.spinner().stop();
                    if (data.error) {
                        $('#chooseBonusProductModal').modal('hide');
                        if ($('.add-to-cart-messages').length === 0) {
                            $('body').append('<div class="add-to-cart-messages"></div>');
                        }
                        $('.add-to-cart-messages').append(
                            '<div class="alert alert-danger add-to-basket-alert text-center"' +
                            ' role="alert">' +
                            data.errorMessage + '</div>'
                        );
                        setTimeout(function () {
                            $('.add-to-basket-alert').remove();
                        }, 3000);
                    } else {
                        $('.configure-bonus-product-attributes').html(data);
                        $('.bonus-products-step2').removeClass('hidden-xl-down');
                        $('#chooseBonusProductModal').modal('hide');

                        if ($('.add-to-cart-messages').length === 0) {
                            $('body').append('<div class="add-to-cart-messages"></div>');
                        }
                        $('.minicart-quantity').html(data.totalQty);
                        $('.add-to-cart-messages').append(
                            '<div class="alert alert-success add-to-basket-alert text-center"' +
                            ' role="alert">' +
                            data.msgSuccess + '</div>'
                        );
                        setTimeout(function () {
                            $('.add-to-basket-alert').remove();
                            if ($('.cart-page').length) {
                                location.reload();
                            }
                        }, 1500);
                    }
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    },
    autoplayVideo: function () {
        if (typeof s7viewers === "undefined") {
            var autoPlayVideo = document.querySelector(".autoplay-video");
            var scriptElm = document.createElement('script');
            scriptElm.setAttribute('src', 'https://tumi.scene7.com/s7viewers/html5/js/VideoViewer.js');
            autoPlayVideo.appendChild(scriptElm);
        }
        let $el = $('#product-video');
        let $vid = $el.attr("data-vid");
        if ($el.length) {
            const config = {
                rootMargin: '-500px 0px 0px 0px',
                threshold: 0
            };
            let productVideo = new IntersectionObserver((entry, self) => {
                if (entry[0].isIntersecting) {
                    $.ajax({
                        url: 'https://tumi.scene7.com/is/image/Tumi/' + $vid + '_video-AVS',
                        method: 'POST',
                        success: function () {
                            var videoViewer = new s7viewers.VideoViewer();
                            videoViewer.setParam("serverurl", "https://s7d9.scene7.com/is/image/");
                            videoViewer.setParam("videoserverurl", "https://s7d9.scene7.com/is/content/");
                            videoViewer.setParam("asset", "Tumi/" + $vid + "_video-AVS");
                            videoViewer.setParam("config", "Scene7SharedAssets/Universal_HTML5_Video_social");
                            videoViewer.setParam("contenturl", "https://s7d9.scene7.com/skins/");
                            videoViewer.setParam("playback", "native");
                            videoViewer.setContainerId("product-video");
                            videoViewer.init();
                        }
                    });
                    self.unobserve($el[0]);
                }
            }, config);
            productVideo.observe($el[0]);
        }
    },
    clickVariationAttributes: function () {
        handleAttributeSelection();
        getDefaultVariationUrl();
    },

    updateRatingValue: function () {
        var starVal = $('.rating-value').attr('data-rating') / 5 * 100;
        $('.rating-value').css('width',starVal + '%');
    },

    pdpPopstate: function () {
        if ($('.product-detail').length > 0) {
            $(window).on("popstate", function () {
                location.reload();
            });
        }
    },


    getPidValue: getPidValue,
    getQuantitySelected: getQuantitySelected,
    miniCartReportingUrl: miniCartReportingUrl,
    minicartFlyout: minicartFlyout
};