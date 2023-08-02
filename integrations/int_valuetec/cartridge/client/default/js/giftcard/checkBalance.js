'use strict';

/**
 * Updates the Mini-Cart quantity value after the customer has pressed the "Add to Cart" button
 * @param {string} response - ajax response from clicking the add to cart button
 */
 function handlePostCartAdd(response) {
    $('.minicart').trigger('count:update', response);
    var messageType = response.error ? 'alert-danger' : 'alert-success';

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

/**
 * When user add a gift card into a cart, flyout open and shows mini cart items
 *
 * @param {object} form - gift card purchase form
 */

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
        ${data.checkoutLink}
        ${data.cartLink}
        </div>`;

    return miniFlyout;
}


$('body').on('submit', 'form.giftcard-balancecheck', function (e) {
    e.preventDefault();
    var form = $(this);
    var url = form.attr('action');
    form.spinner().start();
    $.ajax({
        url: url,
        type: 'post',
        dataType: 'json',
        data: form.serialize(),
        success: function success(data) {
            form.spinner().stop();
            if (data.error) {
                $('div.check-balance-details p').text("Request Failed");
                $('.check-balance-details').addClass('d-block');  
            }
            if (data.balanceMessage) {
                form.spinner().stop();
                if (!$('.check-balance-details').hasClass('d-none')) $('.check-balance-details').addClass('d-none');
                if ($('.check-balance-details').hasClass('d-block')) $('.check-balance-details').removeClass('d-block');
                if (data.success && data.balanceMessage) {
                    $('div.check-balance-details p').text(data.balanceMessage);
                    $('.check-balance-details').addClass('d-block');
                }
            }
        },
        error: function error(data) {
            console.log(data); // eslint-disable-line no-console
        }
    });
    return false;
});


$('form.giftcard-purchase-form').submit(function (e) {
    e.preventDefault();
    var form = $(this);

    $('body').spinner().start();
    var url = form.attr('action');
    if (url) {
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: form.serialize(),
            success: function (data) {
                handlePostCartAdd(data);
                $('#flyout-minicart').html(minicartFlyout(data));
                $('#miniCartModal').modal('show');
                let initialTouch;
                $('.d-mobile .minicart-flyout').on('touchstart', function (e){
                        initialTouch = e.originalEvent.touches[0].clientY;
                }).on('touchmove', function(e) {
                    const currentTouch = e.originalEvent.changedTouches[0].clientY;
                    if(initialTouch > currentTouch) $('.minicart-flyout').removeClass('minicart-swipe')
                });
                $('body').trigger('product:afterAddToCart', data);
                $.spinner().stop();
                miniCartReportingUrl(data.reportingURL);
                form.spinner().stop();
            },
            error: function () {
                form.spinner().stop();
            }
        });
    }
});
