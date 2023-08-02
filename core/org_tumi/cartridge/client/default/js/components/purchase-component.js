'user strict';

module.exports = function () {
    if ($('.purchase-component')) {
        const swiper = new Swiper('.purchase-component', {
            slidesPerView: 2.2,
            spaceBetween: 16,
            grabCursor: true,
            watchSlidesProgress: false,
            breakpoints: {
                744: {
                    slidesPerView: 4,
                }
            }
        });
    }
};
