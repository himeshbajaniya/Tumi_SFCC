'use strict';

$(document).ready(function () {
    $(document).on('click', '.section-mob-header', function() {
        var $curObj = $(this).closest('.section-container');
        if($($curObj).hasClass('active')) {
            $($curObj).removeClass('active');
        } else {
            $('.section-container').removeClass('active');
            $($curObj).addClass('active');
        }
    });

    let serviceSecondaryBtn = $('#superior-quality').next().find('.button--secondary');
    $(serviceSecondaryBtn).click(function(e){
        e.preventDefault();
        $('#tumi-diff-superior-modal').modal('show');
    })

    const collectionSwiperTwoColumn = new Swiper(".tumi-diff-two-cols-swiper", {
        slidesPerView: 1,
        watchSlidesProgress: false,
        grabCursor: true,
        pagination: {
            el: ".swiper-pagination",
            type: 'bullets',
            clickable: true,
        },
        breakpoints: {
            1024: {
                watchSlidesProgress: true,
                grabCursor: false,
                navigation: {
                    nextEl: ".two-col-next",
                    prevEl: ".two-col-prev",
                },
            },
        },
    });

    const collectionSwipers = new Swiper(" .tumi-sub-hero-collection", {
        slidesPerView: 2.5,
        spaceBetween: 16,
        breakpoints: {
            645: {
                slidesPerView: 4.5,
            },
            1024: {
                slidesPerView: 5,
                spaceBetween: 20,
                navigation: {
                    nextEl: ".collections-next",
                    prevEl: ".collections-prev",
                },
                
            },
        },
    });    

    const customerServiceContentCards = new Swiper('.container[data-creative-name="customer-service-why-tumi"] .sub-hero-collection', {
        slidesPerView: 1.3,
        spaceBetween: 20,
        grabCursor: true,
        watchSlidesProgress: false,
        observer: true,
        observeParents: true,
        breakpoints: {
            645: {
                slidesPerView: 3.2,
                spaceBetween: 20,
                grabCursor: true,
                watchSlidesProgress: false,
            },
            1024: {
                slidesPerView: 3,
                spaceBetween: 20,
                slidesPerGroup: 3,
                watchSlidesProgress: true,
                grabCursor: false,
                navigation: {
                    nextEl: ".collections-next",
                    prevEl: ".collections-prev",
                },
                
            },
        },
    });

    const needHelpSwipers = new Swiper('.container[data-creative-name="customer-service-still-need-help"] .sub-hero-collection', {
        slidesPerView: 2.3,
        spaceBetween: 20,
        grabCursor: true,
        watchSlidesProgress: false,
        observer: true,
        observeParents: true,
        breakpoints: {
            645: {
                slidesPerView: 4.2,
                spaceBetween: 20,
                grabCursor: true,
                watchSlidesProgress: false,
            },
            1024: {
                slidesPerView: 5,
                spaceBetween: 20,
                slidesPerGroup: 4,
                watchSlidesProgress: true,
                grabCursor: false,
                navigation: {
                    nextEl: ".collections-next",
                    prevEl: ".collections-prev",
                },
                
            },
        },
    });

    const stillNeedHelpSwiper = new Swiper(".gifting-premium-service-swiper", {
        slidesPerView: "2.5",
        spaceBetween: 16,

        breakpoints: {
            768: {
                slidesPerView: "4",
            },
            1024: {
                slidesPerView: "4",
            },
        },
    });
});
