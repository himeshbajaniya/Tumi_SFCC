"use strict";

var videoElem = $(".hero-banner .lazy-video");

module.exports = {
    heroSwiperInitialize : function () {
        if ($('.hero-swiper')) {
            const categorySwiper = new Swiper(".hero-swiper", {
                autoplay: {
                    delay: 5000
                },
                navigation: {
                    nextEl: ".hero-slide-next",
                    prevEl: ".hero-slide-prev",
                },
            });
        }
    },

    videoLoad : function () {
        if(videoElem) {
            videoElem.map(function(i,e){
                if (window.innerWidth > 640) {
                    $(e).find("source")[0].src = $(e).attr('data-dv');
                    $(e)[0].load();
                }
                else {
                    $(e).find("source")[0].src = $(e).attr('data-mv');
                    $(e)[0].load();
                }
            })
        }
    }
}
