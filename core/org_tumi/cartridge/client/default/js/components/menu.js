"use strict";
var keyboardAccessibility = require("base/components/keyboardAccessibility");

var clearSelection = function (element) {
    $(element)
        .closest(".dropdown")
        .children(".dropdown-menu")
        .children(".top-category")
        .detach();
    $(element)
        .closest(".dropdown.show")
        .children(".nav-link")
        .attr("aria-expanded", "false");
    $(element)
        .closest(".dropdown.show")
        .children(".dropdown-menu")
        .attr("aria-hidden", "true");
    $(element).closest(".dropdown.show").removeClass("show");
    $("div.menu-group > ul.nav.navbar-nav > li.nav-item > a").attr(
        "aria-hidden",
        "false"
    );
    $(element).closest("li").detach();
};

$('.saved-item-icon a').on('click', function(e) {
    e.preventDefault();
    if ($('.accountheader .user a[data-toggle="modal"]').data('target') === '#requestLoginModal') {
        $('#requestLoginModal').modal('show');
        $('.bookmark-info,.login-info').toggleClass('d-none');
    } else {
        location.href=$(this).attr('href');
    }
});

module.exports = function () {
    // navigation effect code

    let header = document.querySelector(".header");
    let prevScrollpos = window.pageYOffset;

    // calculate height of the header(nav) section

    const height = document.querySelector(".header").offsetHeight;
    var scrolled = false;
    window.addEventListener("scroll", () => {
        let currentScrollPos = window.pageYOffset;
        let collectionSticky = $('.collection-sticky');
        let searchSticky = $('.category-banner');

        if (($('.saved-item-notification').css('display') === 'block')) {
            $('.saved-item-notification').css('display','none');
        }
        let  menuPos = document.querySelector('.header').getBoundingClientRect();
        let  menuPosTop = menuPos.y + menuPos.height;

        if(window.innerWidth > 1023) {
            $('.header-menu-nav-links.show .header-menu-sub-menu').css('top', menuPosTop+'px');
            $('.header-menu-nav-links.show .menu-close').css('top', (menuPosTop + 25)+'px');
        }

        if(currentScrollPos < 82 && window.innerWidth > 1023) {
            $(header).removeClass('header-fixed');
        }

        // to make sure this effect only wokrs in desktop and larger screen and not in mobile and tablet view
        if (!scrolled && window.innerWidth > 1023 && !$('.header-menu-nav-links').hasClass('show')) {
            scrolled = true;
            $(header).removeClass('header-fixed');
            if (prevScrollpos > currentScrollPos) {
                header.style.top = "0";
                if(currentScrollPos !== 0) { $(header).addClass('header-fixed'); }
                $('.sticky-container, .category-banner, .cart-error-messaging.cart-error').attr('style', '');
                   if (collectionSticky.length > 0) {
                      collectionSticky.addClass('cs-header');
                   }
                   if (searchSticky.length > 0) {
                        searchSticky.addClass('fixed');
                    }
            } else {
                header.style.top = 0 - (height + 2) + "px";
                $('.sticky-container, .category-banner, .cart-error-messaging.cart-error').attr('style', 'top:0;');
                if (collectionSticky.length > 0) {
                    collectionSticky.removeClass('cs-header');  
                 }
                 if (searchSticky.length > 0) {
                    searchSticky.removeClass('fixed');  
                 }
            }
            scrolled = false;
        }
        prevScrollpos = currentScrollPos;
    });

    //navgation scroll part ends

    /* Menu desktop script */
    const body = document.body;
    const menuMainLinks = $(".d-desktop .header-menu-nav-links");
    const navEle = $(".d-desktop .header-menu");
    const navCloseEle = $(".menu-close");
    menuMainLinks
        .on("mouseenter", function () {
            if (window.innerWidth > 1023) {
                let  menuPos = document.querySelector('.header').getBoundingClientRect();
                let  menuPosTop = menuPos.y + menuPos.height;
                $(this).addClass("show");
                navEle.addClass("header-menu-active");
                $(this).find('.header-menu-sub-menu').css('top', menuPosTop+'px');
                $(this).find('.menu-close').css('top', (menuPosTop + 25)+'px');
                imageLazyLoadHp();
            }
        })
        .on("mouseleave", function (e) {
            if (window.innerWidth > 1023) {
            $(this).removeClass("show");
            navEle.removeClass("header-menu-active")
            $(this).find('.header-menu-sub-menu').removeAttr('style');
            }
        })
        .on("focusin", function () {
            if (window.innerWidth > 1023) {
                if (!$(this).hasClass('show')) {
                    $('.header-menu-nav-links').removeClass('show');
                    navEle.removeClass("header-menu-active");
                }
            }
        })
        .on('keydown', function (e) {
            var key = e.charCode || e.keyCode || 0;
            if ((key === 32 || key === 40 || key === 0) && window.innerWidth > 1023) {
                $(this).addClass("show");
                navEle.addClass("header-menu-active");
                $('.header-menu-sub-menu-links').setAttribute('tabindex', '1');
            }
        })
        .on('keyup', function (e) {
            var key = e.which;
            if ((key === 9) && window.innerWidth > 1023) {
                let  menuPos = document.querySelector('.header').getBoundingClientRect();
                let  menuPosTop = menuPos.y + menuPos.height;
                $(this).find('.header-menu-sub-menu').css('top', menuPosTop+'px');
                $(this).find('.menu-close').css('top', (menuPosTop + 25)+'px');
                $(this).addClass("show");
                navEle.addClass("header-menu-active");
                $('.header-menu-sub-menu-links').setAttribute('tabindex', '1');
            }
        });
        $('.search-products').on("focusin", function () {
            $('.header-menu-nav-links').removeClass('show');
            navEle.removeClass("header-menu-active");
        });
    const menuMainLinksTab = $(".d-tablet .header-menu-nav-links > a");
    const menuMainLiTab = $(".header-menu-nav-links");
    const navEleTab = $(".d-tablet .header-menu");
    menuMainLinksTab.on("click", function (e) {
        e.preventDefault();
        menuMainLiTab.removeClass("show");
        $(this).parent().addClass("show");
        navEleTab.addClass("header-menu-active");
        return false;
    })
    navCloseEle.on("click", function () {
        menuMainLinks.removeClass("show");
        navEle.removeClass("header-menu-active");
        menuMainLiTab.removeClass("show");
        navEleTab.removeClass("header-menu-active");
        body.classList.remove('lock-scroll');
    });

    /* Header Hamburger Toggle Script */
    const menuTrigger = $(".header-menu-toggle");
    const menu = $(".header-menu");
    menuTrigger.on("click", (e) => {
        e.preventDefault();
        let  menuPos = document.querySelector('.header').getBoundingClientRect();
        let  menuPosTop = menuPos.y + menuPos.height;
        menu.css('top', menuPosTop+'px');
        menu.toggleClass("header-menu-active");
        const scrollPosition = window.pageYOffset;
        $("body").toggleClass("lock-scroll");
        $(".header-menu-toggle").toggleClass("active");
        $(".header-menu-sub-menu").removeClass("active");
        $('.menu-template1 .tab-content').removeClass('tab-show');
        imageLazyLoadHp();

        if(document.body.className.indexOf('lock-scroll') > -1) {
            document.body.style.top = `-${scrollPosition}px`;
        } else {
            const scrollY = document.body.style.top;
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
    });

    const headerMenuNav = $(".header-menu-nav-links > a:not('#personalization, .no-sub-menu')");
    headerMenuNav.on("click", function (e) {
        if (window.innerWidth < 1023) {
            e.preventDefault();
            $(this)
                .closest(".header-menu-nav-links")
                .find(".header-menu-sub-menu")
                .addClass("active");
            

            var accesoriesContainer = $('.header-menu-sub-menu.accessories ul li.menu-sub-one');
            if (accesoriesContainer) {
                $(accesoriesContainer).each(function () {
                    $(this).on('click', function (event) {
                        event.preventDefault();
                        if ($(event.target).hasClass('dropdown-link')) {
                            window.location.href = $(event.target).parents('a').attr('href');
                        } else if ($(event.target).hasClass('category-button')) {
                            window.location.href = $(event.target).attr('href');
                        }
                        $(event.target).find('.dropdown-level-two').addClass('show');
                        const goBack = $(".header-menu-sub-menu-title.back");
                        goBack.on("click", function (e) {
                            e.preventDefault();
                            $(this).closest('.dropdown-level-two').removeClass('show');
                        });
                    });
                });
            }
        }
    });

    /* Colloection Mobile click event */
    $('.menu-template1 .nav-item').on('click', function() {
        if (window.innerWidth < 1023) {
            $('.menu-template1 .tab-content').addClass('tab-show');
        }
    });

    $('.menu-template1 .back').on('click', function() {
        if (window.innerWidth < 1023) {
            $('.menu-template1 .tab-content').removeClass('tab-show');
        }
    });

    const goBack = $(".header-menu-sub-menu-title:not(.back)");
    goBack.on("click", function (e) {
        if (window.innerWidth < 1023) {
            e.preventDefault();
            $(this).closest(".header-menu-sub-menu").removeClass("active");
        }
    });
 
    var waitForFinalEvent = (function () {
        var timers = {};
        return function (callback, ms, uniqueId) {
            if (!uniqueId) {
                uniqueId = "Don't call this twice without a uniqueId";
            }
            if (timers[uniqueId]) {
                clearTimeout(timers[uniqueId]);
            }
            timers[uniqueId] = setTimeout(callback, ms);
        };
    })();

    $(window).on('resize', function () {
        waitForFinalEvent(
            function () {
                //var win = $(this); //this = window
                //if (win.width() > 1023) {
                    $(".header-menu-sub-menu,.header-menu-toggle").removeClass("active");
                    menuMainLiTab.removeClass("show");
                    menu.removeClass("header-menu-active");
                //}
            },
            100,
            ""
        );
    });

    /* END Header Hamburger Toggle Script */

    var isDesktop = function (element) {
        return (
            $(element).parents(".menu-toggleable-left").css("position") !==
            "fixed"
        );
    };

    var headerBannerStatus =
        window.sessionStorage.getItem("hide_header_banner");
    $(".header-banner .close").on("click", function () {
        $(".header-banner").addClass("d-none");
        window.sessionStorage.setItem("hide_header_banner", "1");
    });

    if (!headerBannerStatus || headerBannerStatus < 0) {
        $(".header-banner").removeClass("d-none");
    }

    keyboardAccessibility(
        ".main-menu .nav-link, .main-menu .dropdown-link",
        {
            40: function (menuItem) {
                // down
                if (menuItem.hasClass("nav-item")) {
                    // top level
                    $(".navbar-nav .show")
                        .removeClass("show")
                        .children(".dropdown-menu")
                        .removeClass("show");
                    menuItem
                        .addClass("show")
                        .children(".dropdown-menu")
                        .addClass("show");
                    menuItem.find("ul > li > a").first().focus();
                } else {
                    menuItem
                        .removeClass("show")
                        .children(".dropdown-menu")
                        .removeClass("show");
                    if (!(menuItem.next().length > 0)) {
                        // if this is the last menuItem
                        menuItem
                            .parent()
                            .parent()
                            .find("li > a") // set focus to the first menuitem
                            .first()
                            .focus();
                    } else {
                        menuItem.next().children().first().focus();
                    }
                }
            },
            39: function (menuItem) {
                // right
                if (menuItem.hasClass("nav-item")) {
                    // top level
                    menuItem
                        .removeClass("show")
                        .children(".dropdown-menu")
                        .removeClass("show");
                    $(this).attr("aria-expanded", "false");
                    menuItem.next().children().first().focus();
                } else if (menuItem.hasClass("dropdown")) {
                    menuItem
                        .addClass("show")
                        .children(".dropdown-menu")
                        .addClass("show");
                    $(this).attr("aria-expanded", "true");
                    menuItem.find("ul > li > a").first().focus();
                }
            },
            38: function (menuItem) {
                // up
                if (menuItem.hasClass("nav-item")) {
                    // top level
                    menuItem
                        .removeClass("show")
                        .children(".dropdown-menu")
                        .removeClass("show");
                } else if (menuItem.prev().length === 0) {
                    // first menuItem
                    menuItem
                        .parent()
                        .parent()
                        .removeClass("show")
                        .children(".nav-link")
                        .attr("aria-expanded", "false");
                    menuItem
                        .parent()
                        .children()
                        .last()
                        .children() // set the focus to the last menuItem
                        .first()
                        .focus();
                } else {
                    menuItem.prev().children().first().focus();
                }
            },
            37: function (menuItem) {
                // left
                if (menuItem.hasClass("nav-item")) {
                    // top level
                    menuItem
                        .removeClass("show")
                        .children(".dropdown-menu")
                        .removeClass("show");
                    $(this).attr("aria-expanded", "false");
                    menuItem.prev().children().first().focus();
                } else {
                    menuItem
                        .closest(".show")
                        .removeClass("show")
                        .closest("li.show")
                        .removeClass("show")
                        .children()
                        .first()
                        .focus()
                        .attr("aria-expanded", "false");
                }
            },
            27: function (menuItem) {
                // escape
                var parentMenu = menuItem.hasClass("show")
                    ? menuItem
                    : menuItem.closest("li.show");
                parentMenu.children(".show").removeClass("show");
                parentMenu
                    .removeClass("show")
                    .children(".nav-link")
                    .attr("aria-expanded", "false");
                parentMenu.children().first().focus();
            },
        },
        function () {
            return $(this).parent();
        }
    );

    $('.dropdown:not(.disabled) [data-toggle="dropdown"]')
        .on("click", function (e) {
            if (!isDesktop(this)) {
                $(".modal-background").show();
                // copy parent element into current UL
                var li = $(
                    '<li class="dropdown-item top-category" role="button"></li>'
                );
                var link = $(this)
                    .clone()
                    .removeClass("dropdown-toggle")
                    .removeAttr("data-toggle")
                    .removeAttr("aria-expanded")
                    .attr("aria-haspopup", "false");
                li.append(link);
                var closeMenu = $('<li class="nav-menu"></li>');
                closeMenu.append($(".close-menu").first().clone());
                $(this)
                    .parent()
                    .children(".dropdown-menu")
                    .prepend(li)
                    .prepend(closeMenu)
                    .attr("aria-hidden", "false");
                // copy navigation menu into view
                $(this).parent().addClass("show");
                $(this).attr("aria-expanded", "true");
                $(link).focus();
                $("div.menu-group > ul.nav.navbar-nav > li.nav-item > a").attr(
                    "aria-hidden",
                    "true"
                );
                e.preventDefault();
            }
        })
        .on("mouseenter", function () {
            if (isDesktop(this)) {
                var eventElement = this;
                $(".navbar-nav > li").each(function () {
                    if (!$.contains(this, eventElement)) {
                        $(this)
                            .find(".show")
                            .each(function () {
                                clearSelection(this);
                            });
                        if ($(this).hasClass("show")) {
                            $(this).removeClass("show");
                            $(this)
                                .children("ul.dropdown-menu")
                                .removeClass("show");
                            $(this)
                                .children(".nav-link")
                                .attr("aria-expanded", "false");
                        }
                    }
                });
                // need to close all the dropdowns that are not direct parent of current dropdown
                $(this).parent().addClass("show");
                $(this).siblings(".dropdown-menu").addClass("show");
                $(this).attr("aria-expanded", "true");
            }
        })
        .parent()
        .on("mouseleave", function () {
            if (isDesktop(this)) {
                $(this).removeClass("show");
                $(this).children(".dropdown-menu").removeClass("show");
                $(this).children(".nav-link").attr("aria-expanded", "false");
            }
        });

    $(".navbar>.close-menu>.close-button").on("click", function (e) {
        e.preventDefault();
        $(".menu-toggleable-left").removeClass("in");
        $(".modal-background").hide();

        $(".navbar-toggler").focus();

        $(".main-menu").attr("aria-hidden", "true");
        $(".main-menu").siblings().attr("aria-hidden", "false");
        $("header").siblings().attr("aria-hidden", "false");
    });

    $(".navbar-nav").on("click", ".back", function (e) {
        e.preventDefault();
        clearSelection(this);
    });

    $(".navbar-nav").on("click", ".close-button", function (e) {
        e.preventDefault();
        $(".navbar-nav").find(".top-category").detach();
        $(".navbar-nav").find(".nav-menu").detach();
        $(".navbar-nav").find(".show").removeClass("show");
        $(".menu-toggleable-left").removeClass("in");

        $(".main-menu").siblings().attr("aria-hidden", "false");
        $("header").siblings().attr("aria-hidden", "false");

        $(".modal-background").hide();
    });

    $(".navbar-toggler").click(function (e) {
        e.preventDefault();
        $(".main-menu").toggleClass("in");
        $(".modal-background").show();

        $(".main-menu").removeClass("d-none");
        $(".main-menu").attr("aria-hidden", "false");
        $(".main-menu").siblings().attr("aria-hidden", "true");
        $("header").siblings().attr("aria-hidden", "true");

        $(".main-menu .nav.navbar-nav .nav-link").first().focus();
    });

    keyboardAccessibility(
        ".navbar-header .user",
        {
            40: function ($popover) {
                // down
                if ($popover.children("a").first().is(":focus")) {
                    $popover.next().children().first().focus();
                } else {
                    $popover.children("a").first().focus();
                }
            },
            38: function ($popover) {
                // up
                if ($popover.children("a").first().is(":focus")) {
                    $(this).focus();
                    $popover.removeClass("show");
                } else {
                    $popover.children("a").first().focus();
                }
            },
            27: function () {
                // escape
                $(".navbar-header .user .popover").removeClass("show");
                $(".user").attr("aria-expanded", "false");
            },
            9: function () {
                // tab
                $(".navbar-header .user .popover").removeClass("show");
                $(".user").attr("aria-expanded", "false");
            },
        },
        function () {
            var $popover = $(".user .popover li.nav-item");
            return $popover;
        }
    );

    $(".navbar-header .user").on("mouseenter focusin", function () {
        if ($(".navbar-header .user .popover").length > 0) {
            $(".navbar-header .user .popover").addClass("show");
            $(".user").attr("aria-expanded", "true");
        }
    });

    $(".navbar-header .user").on("mouseleave", function () {
        $(".navbar-header .user .popover").removeClass("show");
        $(".user").attr("aria-expanded", "false");
    });
    $("body").on("click", "#myaccount", function () {
        event.preventDefault();
    });

    if ($('.global-banner').find('.offersSwiper').length !== 0) {
        var offerDelay = $('.offersSwiper').attr('data-delay') || 3000;
        var offersSwiper = new Swiper(".offersSwiper", {
            direction: "vertical",
            // effect: 'fade',
            lazy: true,
            slidesPerView: 1,
            loop: true,
            autoplay: {
                delay: offerDelay,
            }
        });
    }

    $(".global-banner-close").on('click', function(e) {
        e.preventDefault();
        $(".global-banner-close").closest('.global-banner').remove();
        sessionStorage.setItem('globalBanner', 'hide');
    });


    function imageLazyLoadHp () {
        var lazyloadImg = document.querySelectorAll("img[data-src]");
        var imgObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var image = entry.target;
                    image.src = image.dataset.src;
                    imgObserver.unobserve(image);
                }
            });
        });

        lazyloadImg.forEach(function(image) {
            imgObserver.observe(image);
        });
    }

    $('.accountheader, .password-edit').on('click', function() {
        imageLazyLoadHp();
    });
};
