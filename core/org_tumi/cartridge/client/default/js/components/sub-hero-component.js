'use strict';

module.exports = function () {
    if ($('.sub-hero-category').length > 0) {
        const categorySwiper = new Swiper(".sub-hero-category", {
            slidesPerView: 1.3,
            spaceBetween: 20,
            lazy: true,
            watchSlidesProgress: true,
            freeMode: true,
            breakpoints: {
                645: {
                    slidesPerView: 3.2,
                    spaceBetween: 20,
                },
                1024: {
                    slidesPerView: 4,
                    spaceBetween: 20,
                    slidesPerGroup: 4,
                    navigation: {
                        nextEl: ".sub-categories-next",
                        prevEl: ".sub-categories-prev",
                    },
                },
            },
        });
    }

    if ($('.sub-hero-collection').length > 0) {
        const collectionSwiper = new Swiper(".sub-hero-collection", {
            slidesPerView: 1.3,
            spaceBetween: 20,
            lazy: true,
            watchSlidesProgress: true,
            freeMode: true,
            breakpoints: {
                645: {
                    slidesPerView: 3.2,
                    spaceBetween: 20,
                },
                1024: {
                    slidesPerView: 4,
                    spaceBetween: 20,
                    slidesPerGroup: 4,
                    navigation: {
                        nextEl: ".sub-collections-next",
                        prevEl: ".sub-collections-prev",
                    },
                },
            },
        });
    };
    
    $('.sub-hero-notab .mySwiper').each(function (index) {
        var contentAssetId = $(this)[0].closest('.container').getAttribute('data-creative-name'); 
        var mySwiper = new Swiper('.sub-'+contentAssetId,{
            //Your options here:
             slidesPerView: 1.3,
                spaceBetween: 20,
                lazy: true,
                breakpoints: {
                    645: {
                        slidesPerView: 3.2,
                        spaceBetween: 20,
                    },
                    1024: {
                        slidesPerView: 4,
                        spaceBetween: 20,
                        slidesPerGroup: 4,
                        navigation: {
                            nextEl: ".sub-"+contentAssetId+"-next",
                            prevEl: ".sub-"+contentAssetId+"-prev",
                        },
                    },
                },
        });
    });
};
