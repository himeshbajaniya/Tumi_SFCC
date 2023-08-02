"use strict";

module.exports = function () {
    if ($('.tumi-service-swiper')) {
        var swiper = new Swiper(".tumi-service-swiper", {
            slidesPerView: "2.5",
            spaceBetween: 16,

            breakpoints: {
                768: {
                    slidesPerView: "4",
                },
                1024: {
                    slidesPerView: "0",
                },
            },
        });
    }
};
