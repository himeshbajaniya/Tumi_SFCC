'use strict';

function displayMessageAndRemoveFromCart(data) {
    $.spinner().stop();
    var status = data.success ? 'alert-success' : 'alert-danger';

    if ($('.add-to-wishlist-messages').length === 0) {
        $('body').append('<div class="add-to-wishlist-messages "></div>');
    }
    $('.add-to-wishlist-messages')
        .append('<div class="add-to-wishlist-alert text-center ' + status + '">' + data.msg + '</div>');

    setTimeout(function () {
        $('.add-to-wishlist-messages').remove();
    }, 1500);
}

function getWishlistItem() {
    let wishlistItem = sessionStorage.getItem('wishlistPidArray');
    if (wishlistItem) {
        $('.saved-item-icon').removeClass('d-none');
        wishlistItem = wishlistItem.split(',');
        wishlistItem.map(function (i, wid) {
            $('[data-wid = ' + i + ']').addClass('bookmarked');
        });
    } else {
        $('.saved-item-icon').addClass('d-none');
    }
}
module.exports = {
    getWishlistItem: getWishlistItem,
    bookmark: function () {
        const stickyNotificationTemplate = document.createElement('div');
        stickyNotificationTemplate.innerHTML = `
    <div class="saved-item-notification">
    <div class="container">
        <div class="row">
            <div class="col-sm-7 col-8 align-items-center d-flex">
            <img class="product-image-url desktop-specific" src="" alt=""/>
            <a href="javascript:void(0)" class="mobile-specific"><svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M0 0H16V20L8 16.2017L0 20V0Z" fill="#1B1C1E"/>
            </svg></a>
                <p class="desktop-specific">This item has been added to your Saved Items</p>
                <p class="mobile-specific">Added to your Saved Items</p>
            </div>
            <div class="col-sm-5 col-4 text-right btn-wrapper">
                <a href="javascript:void(0)" class="button button--primary desktop-specific view-saved-items-button">view saved items</a>
                <a href="javascript:void(0)" class="mobile-specific view-saved-items-button">view</a>
                <a href="javascript:void(0)"  class="remove-notification"><svg width="17" height="18" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M0 1.20833L0.708333 0.5L8.50715 8.29881L16.0937 0.71224L16.8021 1.42057L9.21548 9.00715L17 16.7917L16.2917 17.5L8.50715 9.71548L0.921224 17.3014L0.212891 16.5931L7.79881 9.00715L0 1.20833Z" fill="#1b1c1e"/>
                </svg></a>
            </div>
        </div>
    </div>
    </div>`;

        $(document).on('wishlist:add', function () {
            $(document).ready(function () {
                var wid = localStorage.getItem('currWishlistID') || '';
                if (wid !== '' && wid !== null) {
                    $('.bookmark[data-pid = "' + wid + '"]').trigger('click');
                    if ($('.cart-page').length > 0) {
                        $('.product-move .move-to-wishlist[data-pid = "' + wid + '"]').trigger('click');
                    }
                }
            });
        });

        $(document).trigger('wishlist:add');

        $(document).on('click', '.bookmark, .product-move .move-to-wishlist', function (e) {
            e.preventDefault();
            var current = e.currentTarget;
            var isBookmarked = $(current).hasClass('bookmarked');
            if (isBookmarked) {
                //remove product
                var pid = $(this).attr('data-pid');
                var url = $(this).attr('data-removeurl') + '?pid=' + pid;
                var isLoggedIn = false;
                var loggedInStatusURL = $('#pageHeader').data('loggedinstatusurl');
                $.get(loggedInStatusURL).done(function (data) {
                    isLoggedIn = data.isAuthenticated;
                    if (isLoggedIn) {
                        $.ajax({
                            url: url,
                            type: 'post',
                            dataType: 'json',
                            data: {
                                pid: pid,
                                optionId: optionId,
                                optionVal: optionVal
                            },
                            success: function (data) {
                                $(current).removeClass('bookmarked').addClass('bookkmark');
                                localStorage.removeItem('currWishlistID');
                                // eslint-disable-line no-restricted-globals
                                var wishlistPidArray = data.wishlistPidArray;
                                sessionStorage.setItem('wishlistPidArray', wishlistPidArray);
                                if (sessionStorage.wishlistPidArray.split(',')[0] == '') {
                                    $('.saved-item-icon').addClass('d-none');
                                }
                            },
                            error: function (err) {
                                console.log('error sfl move'); // eslint-disable-line no-console
                            }
                        });
                    } else {
                        $('#requestLoginModal').find('.login-info').addClass('d-none');
                        $('#requestLoginModal').find('.bookmark-info').removeClass('d-none');
                        $('#requestLoginModal').modal('show');
                        localStorage.setItem('currWishlistID', current.getAttribute('data-pid'));
                    }
                });
            }
            else {
                var pid = $(this).attr('data-pid');
                var url = $(this).attr('href') + '?pid=' + pid;
                var optionId = $(this).closest('.product-info').find('.lineItem-options-values').data('option-id');
                var optionVal = $(this).closest('.product-info').find('.lineItem-options-values').data('value-id');
                optionId = optionId || null;
                optionVal = optionVal || null;
                if (!url || !pid) {
                    return;
                }
                var isLoggedIn = false;
                var loggedInStatusURL = $('#pageHeader').data('loggedinstatusurl');
                $.get(loggedInStatusURL).done(function (data) {
                    isLoggedIn = data.isAuthenticated;
                    if (isLoggedIn) {
                        $.ajax({
                            url: url,
                            type: 'post',
                            dataType: 'json',
                            data: {
                                pid: pid,
                                optionId: optionId,
                                optionVal: optionVal
                            },
                            success: function (data) {
                                if (data.error) {
                                    console.log(data.error);
                                }
                                else {
                                    var wishlistPidArray = data.wishlistPidArray;
                                    sessionStorage.setItem('wishlistPidArray', wishlistPidArray);
                                    if (sessionStorage.wishlistPidArray.split(',')[0] != '') {
                                        $('.saved-item-icon').removeClass('d-none');
                                    }
                                    $('header').after(stickyNotificationTemplate);
                                    document.querySelector('.product-image-url').src = data.productDetails.imageUrl;
                                    $('.view-saved-items-button').attr('href', data.wishlistLandingUrl);
                                    // let pageScroll = window.pageYOffset
                                    let  domRect = document.querySelector('.header').getBoundingClientRect();
                                    let  domRectTop = domRect.y + domRect.height;

                                    if (domRectTop < 1) {
                                        $('.saved-item-notification').css('top', '0');
                                    } else {
                                        $('.saved-item-notification').css('top', domRectTop);
                                    }

                                    $('.remove-notification').on('click', function () {
                                        $('.saved-item-notification').css('display', 'none');
                                    });
                                    $('.saved-item-notification').css('display', 'block').delay(4000).fadeOut();
                                    if (!($('.cart-page').length > 0)) {
                                        $(current).addClass('bookmarked');
                                    }
                                    localStorage.removeItem('currWishlistID');
                                    // eslint-disable-line no-restricted-globals
                                }
                                if ($('.cart-page').length > 0) {
                                    $(current).addClass('cart-delete-confirmation-btn');
                                    $(current).removeClass('move-to-wishlist');
                                    var wid = pid || '';
                                    $('.cart-delete-confirmation-btn[data-pid = "' + wid + '"]').trigger('click');
                                    displayMessageAndRemoveFromCart(data);
                                    location.reload();
                                }
                            },
                            error: function (err) {
                                console.log('error sfl move'); // eslint-disable-line no-console
                            }
                        });
                    } else {
                        $('#requestLoginModal').find('.login-info').addClass('d-none');
                        $('#requestLoginModal').find('.bookmark-info').removeClass('d-none');
                        $('#requestLoginModal').modal('show');
                        localStorage.setItem('currWishlistID', current.getAttribute('data-pid'));
                    }
                });
            }

        });
    },
    bookmarked: function () {
        getWishlistItem();
    },

    signout: function () {
        $(document).on('click', '.signout-button', function () {
            sessionStorage.removeItem('wishlistPidArray');
            getWishlistItem();
        });
    },

    sortByMenu: function () {

        const $menu = $('.sort-filter,.dropdown-menu-right');
        $(document).mouseup(e => {
            if (!$menu.is(e.target) && $menu.has(e.target).length === 0) // if the target of the click isn't the container... nor a descendant of the container
            {
                $menu.removeClass('show');
            }
        });

        $('.dropdown-toggle,.remove-sort-modal').on('click', () => {
            $menu.toggleClass('show');
        });
    }
}

