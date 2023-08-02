'user strict';

module.exports = {
    contentBanner : function() {
    if ($('.content-banner-swiper')) {
        const swiper = new Swiper(".content-banner-swiper", {
            slidesPerView: 1,
            grabCursor: true,
            watchSlidesProgress: false,
            pagination: {
                el: '.swiper-pagination',
                type: 'bullets',
                clickable: true
            },
            breakpoints: {
                1024: {
                    watchSlidesProgress: true,
                    grabCursor: false,
                    navigation: {
                        nextEl: ".swiper-button-next",
                        prevEl: ".swiper-button-prev",
                    },
                },
            },
        });
    }
}
}
