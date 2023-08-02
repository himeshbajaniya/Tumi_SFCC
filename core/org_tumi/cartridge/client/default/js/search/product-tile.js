'use strict';

var Handlebars = require('handlebars/dist/handlebars');
var handlebarHelpers = require('../handleBar/handleBarHelpers');
var bookmark = require('../components/bookmark');

function getHandlebars() {

    var sampleData = window.rfkPLPSearchResults;
    var serchParam = window.location.search.indexOf('q=');
    if (sampleData.errors || sampleData.total_item === 0 && serchParam < 1) {
        var noProduct = `<div class="no-product-available text-center">This page is currently unavailable.</div>`;
        $(noProduct).replace('.no-product-available');
    } else {
        if ($('.productTileTemplates').length > 0 && $('#producttile-handlebar').length > 0) {
            handlebarHelpers.getHandlebarHelpers();
            var filterTemplate = Handlebars.compile($('#filter-template').html());
            const filterSearch = filterTemplate(sampleData);
            $('.refinements').append(filterSearch);
            handlebarHelpers.handleColorSwatchesInTile();
            bookmark.getWishlistItem();
        }
    }
}

function handleImageCarousel() {
    var allItemsInClass = $('.productTileTemplates').find('.primary-image');
    var arrayIDs = new Array();
    $.each(allItemsInClass, function() {
        arrayIDs.push($(this).attr('data-id'));
    });
    var j = 0;
    allItemsInClass.each(function(){
        var querypath = $('#s7PresetsPlp').val();
        var mainImage = 'https:' + $(this).find('.tile-image').attr('data-master-image');
        var alternateMasterImage = $(this).attr('data-alt-images') ? $(this).attr('data-alt-images').split(',') : [];
        for (var i in alternateMasterImage){
            alternateMasterImage[i] = alternateMasterImage[i]+querypath;
        }
        var template = '<div class="image-wrapper">';

            if (alternateMasterImage.length !== 0) {
                alternateMasterImage.splice(0, 0, mainImage);
            } else {
                template = template + `<div class="image-carousel" data-final-image=${mainImage}></div>`;
            }
            for (var i in alternateMasterImage){
                if (i >= 4) {
                    break;
                }
                template = template + `<div class="image-carousel" data-swatch-id="span_${i}" data-final-image=${alternateMasterImage[i]}></div>`;
            }
            template = template + '</div><div class="pagination">';
            for (var k in alternateMasterImage){
                if (k >= 4) {
                    break;
                }
                template = template + `<span id="span_${k}"></span>`;
            }
            template = template + '</div>';
            $('.primary-image.'+ arrayIDs[j]).find('.pagination').remove();
            $('.primary-image.'+ arrayIDs[j]).find('.image-wrapper').remove();
            $('.primary-image.'+ arrayIDs[j]).append(template);
        j++;
    });
}

function updateMouseMove () {
    $(document).on('mouseenter', '.productTileTemplates .image-container .image-carousel', function (e) {
        var $this = $(e.target);
        var alternateMasterImage = $this.attr('data-final-image');
        var activeItem = $this.attr('data-swatch-id');
        $this.closest('.product-tile').find('.image-wrapper').show();
        $this.closest('.product-tile').find('.pagination span#' + activeItem).addClass('active');
        $this.closest('.product-tile').find('.primary-image img').attr('src', alternateMasterImage);
    });

    $(document).on('mouseout', '.productTileTemplates .image-container .primary-image', function (e) {
        var $this = $(e.target);
        var masterImage = $this.attr('data-master-image');
        $this.closest('.product-tile').find('.primary-image img').attr('src', masterImage);
        $this.closest('.product-tile').find('.pagination span').removeClass('active');
    });
}

function imageLazyLoadPlp () {
    var lazyloadImages = document.querySelectorAll("img[data-src]");
    var imageObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                var image = entry.target;
                image.src = image.dataset.src;
                imageObserver.unobserve(image);
            }
        });
    });

    lazyloadImages.forEach(function(image) {
        imageObserver.observe(image);
    });
}

function swiperInit () {
    if ($('.service-hightlights-swiper')) {
        var swiper = new Swiper(".service-hightlights-swiper", {
            slidesPerView: "2.3",
            spaceBetween: 16,

            breakpoints: {
                768: {
                    slidesPerView: "4",
                },
                1024: {
                    slidesPerView: "4",
                    spaceBetween: 18,
                },
            },
        });
    }
}


module.exports = {
    swiperInit: swiperInit,
    getHandlebars: getHandlebars,
    handleImageCarousel: handleImageCarousel,
    updateMouseMove: updateMouseMove,
    imageLazyLoadPlp: imageLazyLoadPlp
}