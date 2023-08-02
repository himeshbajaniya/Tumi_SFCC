'use strict';

var Handlebars = require('handlebars/dist/handlebars');

function getHandlebarHelpers() {

    Handlebars.registerHelper('calculateRating', function(items) {
        var starVal = items / 5 * 100;
        var temp = "<span class='rating-value' style='width:" + starVal + "%'></span>";
        return new Handlebars.SafeString(temp);
    });

    Handlebars.registerHelper('isUrl', function(str1, str2, suffix) {
        if (typeof str1 === 'string' && typeof str2 === 'string' && typeof suffix === 'string') {
            return str1 + str2 + suffix;
          }
          return str1;
    });

    Handlebars.registerHelper('mainUrl', function(str, suffix) {
        if (window.InstanceType === window.PRODUCTION_SYSTEM || window.InstanceType === window.STAGING_SYSTEM) {
            return str;
        } else {
            var currentInstanceHostName = window.currentInstanceHostName;
            var InstanceTypeHosts = window.InstanceTypeHosts;
            if (InstanceTypeHosts !== null) {
                var InstanceTypeHostNameArr = InstanceTypeHosts.split(',');
                for (var i in InstanceTypeHostNameArr) {
                    if (currentInstanceHostName.indexOf(InstanceTypeHostNameArr[i]) === 0) {
                        return str;
                    }
                }
            }
            if (typeof str === 'string' && typeof suffix === 'string') {
                var slicedStr = str.slice(0, -1);
                return slicedStr + suffix;
            }
            return '';
        }
    });

    Handlebars.registerHelper('productTilePrice', function(final_price, price) {
        var priceDom = '';
        if (parseInt(final_price) !== parseInt(price)) {
            price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
            priceDom += `
                <del>
                    <span class="strike-through list">
                        <span class="value" content="${price}">
                            <span class="sr-only">
                                Price reduced from
                            </span>
                                ${price}
                            <span class="sr-only">
                                to
                            </span>
                        </span>
                    </span>
                </del>`;
        }
        return new Handlebars.SafeString(priceDom);
    });

    Handlebars.registerHelper('productTilePriceCA', function(final_price, price) {
        var priceDom = '';
        if (parseInt(final_price) !== parseInt(price)) {
            price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CAD', currencyDisplay: 'symbol' }).format(price).replace('A', '');
            priceDom += `
                <del>
                    <span class="strike-through list">
                        <span class="value" content="${price}">
                            <span class="sr-only">
                                Price reduced from
                            </span>
                                ${price}
                            <span class="sr-only">
                                to
                            </span>
                        </span>
                    </span>
                </del>`;
        }
        return new Handlebars.SafeString(priceDom);
    });

    Handlebars.registerHelper('each_upto', function(ary, options) {
        var max = $(window).width() <= 1024 ? 1 : 4;
        
        if(!ary || ary.length == 0) {
            return options.inverse(this);
        }
        var result = [];
        for(var i = 0; i < max && i < ary.length; ++i) {
            result.push(options.fn(ary[i]));
        }
        return result.join('');
    });
    Handlebars.registerHelper('SortSwatches', function (v1, v2) {
        for (var i = 0; i < v1?.length; i++) {
            var txt = v1[i].product_url.split('/')[2].split('-');
            var temp = txt[txt.length - 1];
            if (v2 === temp) {
                let swap = v1[0];
                v1[0] = v1[i];
                v1[i] = swap;
            }
        }
        this.swatch_list = v1;
    });

    Handlebars.registerHelper('wishListAddProductRfk', function () {
        return window.wishListAddProductRfk;
    });

    Handlebars.registerHelper('removeWishlistProductRfk', function () {
        return window.removeWishlistProductRfk;
    });

    Handlebars.registerHelper('filterCount', function(v1) {
        if (v1 === 0) {
            return 'disabled';
        }
    });
    Handlebars.registerHelper('isMoreFlag', function(v1) {
        if (v1 < 8) {
            return "isShowMore";
        }
        return "hideShowMore";
    });

    Handlebars.registerHelper('getColorValue', function(keyValue, color) {
        if (keyValue === 'color_group' && color) {
            var colours = {
                "aliceblue":"#f0f8ff", "antiquewhite":"#faebd7", "aqua":"#00ffff", "aquamarine":"#7fffd4", "azure":"#f0ffff",  "beige":"#cbb79f", "bisque":"#ffe4c4", "black":"#222222", "grey":"#999999", "blanchedalmond":"#ffebcd", "blue":"#315dad", "blueviolet":"#8a2be2", "brown":"#7d503d", "burlywood":"#deb887",  "cadetblue":"#5f9ea0", "chartreuse":"#7fff00", "chocolate":"#d2691e", "coral":"#ff7f50", "cornflowerblue":"#6495ed", "cornsilk":"#fff8dc", "crimson":"#dc143c", "cyan":"#00ffff",  "darkblue":"#00008b", "darkcyan":"#008b8b", "darkgoldenrod":"#b8860b", "darkgray":"#a9a9a9", "darkgreen":"#006400", "darkkhaki":"#bdb76b", "darkmagenta":"#8b008b", "darkolivegreen":"#556b2f",  "darkorange":"#ff8c00", "darkorchid":"#9932cc", "darkred":"#8b0000", "darksalmon":"#e9967a", "darkseagreen":"#8fbc8f", "darkslateblue":"#483d8b", "darkslategray":"#2f4f4f", "darkturquoise":"#00ced1",  "darkviolet":"#9400d3", "deeppink":"#ff1493", "deepskyblue":"#00bfff", "dimgray":"#696969", "dodgerblue":"#1e90ff",  "firebrick":"#b22222", "floralwhite":"#fffaf0", "forestgreen":"#228b22", "fuchsia":"#ff00ff",  "gainsboro":"#dcdcdc", "ghostwhite":"#f8f8ff", "gold":"#ffd700", "goldenrod":"#daa520", "gray":"#808080", "green":"#5b805f", "greenyellow":"#adff2f",
                "honeydew":"#f0fff0", "hotpink":"#ff69b4", "indianred ":"#cd5c5c", "indigo":"#4b0082", "ivory":"#fffff0", "khaki":"#f0e68c",  "lavender":"#e6e6fa", "lavenderblush":"#fff0f5", "lawngreen":"#7cfc00", "lemonchiffon":"#fffacd", "lightblue":"#add8e6", "lightcoral":"#f08080", "lightcyan":"#e0ffff", "lightgoldenrodyellow":"#fafad2",  "lightgrey":"#d3d3d3", "lightgreen":"#90ee90", "lightpink":"#ffb6c1", "lightsalmon":"#ffa07a", "lightseagreen":"#20b2aa", "lightskyblue":"#87cefa", "lightslategray":"#778899", "lightsteelblue":"#b0c4de",  "lightyellow":"#ffffe0", "lime":"#00ff00", "limegreen":"#32cd32", "linen":"#faf0e6",  "magenta":"#ff00ff", "maroon":"#800000", "mediumaquamarine":"#66cdaa", "mediumblue":"#0000cd", "mediumorchid":"#ba55d3", "mediumpurple":"#9370d8", "mediumseagreen":"#3cb371", "mediumslateblue":"#7b68ee",        "mediumspringgreen":"#00fa9a", "mediumturquoise":"#48d1cc", "mediumvioletred":"#c71585", "midnightblue":"#191970", "mintcream":"#f5fffa", "mistyrose":"#ffe4e1", "moccasin":"#ffe4b5", "navajowhite":"#ffdead", "navy":"#000080",  "oldlace":"#fdf5e6", "olive":"#808000", "olivedrab":"#6b8e23", "orange":"#de703e", "orangered":"#ff4500", "orchid":"#da70d6",  "palegoldenrod":"#eee8aa",
                "palegreen":"#98fb98", "paleturquoise":"#afeeee", "palevioletred":"#d87093", "papayawhip":"#ffefd5", "peachpuff":"#ffdab9", "peru":"#cd853f", "pink":"#cd576a", "plum":"#dda0dd", "powderblue":"#b0e0e6", "purple":"#884d6d",  "rebeccapurple":"#663399", "red":"#bb2131", "rosybrown":"#bc8f8f", "royalblue":"#4169e1",  "saddlebrown":"#8b4513", "salmon":"#fa8072", "sandybrown":"#f4a460", "seagreen":"#2e8b57", "seashell":"#fff5ee", "sienna":"#a0522d", "silver":"#c0c0c0", "skyblue":"#87ceeb", "slateblue":"#6a5acd", "slategray":"#708090", "snow":"#fffafa", "springgreen":"#00ff7f", "steelblue":"#4682b4",   "tan":"#d2b48c", "teal":"#008080", "thistle":"#d8bfd8", "tomato":"#ff6347", "turquoise":"#40e0d0", "violet":"#ee82ee",   "wheat":"#f5deb3", "white":"#ffffff", "whitesmoke":"#f5f5f5", "yellow":"#ffff00", "yellowgreen":"#9acd32", "metallic": "http://s7d2.scene7.com/is/image/Tumi/swatch-metallic-1", "silver": "https://s7d2.scene7.com/is/image/Tumi/SilverSwatch"
            
            };
            if (colours[color.toLowerCase()].indexOf('#') === 0) {
                return 'background-color:' + colours[color.toLowerCase()];
            } else if (colours[color.toLowerCase()].indexOf('rgb') > -1){
                return 'background:' + colours[color.toLowerCase()];
            } else {
                return 'background-image:url("' + colours[color.toLowerCase()] + '")';
            }
        }
    });
    Handlebars.registerHelper('isToggleShowHide', function(v1) {
        if (v1 > 8) {
            return "isLinkVisible";
        }
        return "isLinkNotVisible";
    });


    Handlebars.registerHelper('isDynamicClass', function(type, text) {
        var splitName = text.replace(/[^a-zA-Z0-9]/g, '');
        return type + splitName;
    });

    Handlebars.registerHelper('colorCountDesktop', function(v1) {
        if (v1 && Object.keys(v1).length > 4 ){
            return `+${Object.keys(v1).length - 4}`;
        }
    });

    Handlebars.registerHelper('colorCountMobile', function(v1) {
        if (v1 && Object.keys(v1).length > 1 ){
            return `+${Object.keys(v1).length - 1}`;
        }
    });

    Handlebars.registerHelper('productUrl', function(v1) {
        var arr = [];
        var txt = v1.split('/')[2].split('-');
        arr.push(txt);
        return txt[txt.length - 1];
    });

    Handlebars.registerHelper('imageUrls', function(arr) {
        var altUrls = [];
        var urls = arr.swatch_list;
        if (urls) {
            altUrls = urls.map(x => x && x.altimage_url);
            return altUrls;
        }
        return null;
    });
    Handlebars.registerHelper('addCompareUrl', function(sku) {
        var pidsLength = $('#pidsLength').val();
        var compareUrl = $('.compared-suggestions').attr('data-compareurl');
        if (parseInt(pidsLength) === 1) {
            return compareUrl + '&pid1=' + sku + '&backUrl=';
        }
        return compareUrl + '&pid2=' + sku + '&backUrl=';
    });

    Handlebars.registerHelper('dollarFormat', function(price) {
        price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
        return price;
    });

    Handlebars.registerHelper('dollarFormatCA', function(price) {
        price =  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CAD', currencyDisplay: 'symbol' }).format(price).replace('A', '');
        return price;
    });

    Handlebars.registerHelper('imageQuery', function(sku) {
        var imgQueryPath =  $('#s7PresetsPlp').val();

        return sku + imgQueryPath;
    });

    Handlebars.registerHelper('selectedSwatch', function(product_url, sku) {
        var product_url = product_url.split('/');
        var splitUrl = product_url[product_url.length - 2].split('-');
        var swatch_sku = splitUrl[splitUrl.length - 1];
        if (swatch_sku === sku) {
            return 'selected';
        }
        return '';
    });
    Handlebars.registerHelper('removeCompareItemUrl', function(sku) {
        var sku = sku;
        var removeCompareItemUrl = $('.product-comparison').attr('data-removeitemurl');
        var comparePids = $('.product-comparison').attr('data-pids').split(',');
        var pids = comparePids.filter(function (pid) {
            return pid !== sku;
        });
        if (pids.length === 2) {
            return removeCompareItemUrl + '&pid0=' + pids[0] + '&pid1=' + pids[1] + '&backUrl=';
        } else if (pids.length === 1) {
            return removeCompareItemUrl + '&pid0=' + pids[0] + '&backUrl=';  
        } else {
            return '';
        }
    });

    Handlebars.registerHelper('isFormatId', function (name) {
        return name.replace(/\=/g, '');
    });
    Handlebars.registerHelper('dataSrcOrSrc', function(index, src) {
        var imgQueryPath =  $('#s7PresetsPlp').val();
        var defaultImage = $('#s7imageNotFound').val();
        if (index < 6) {
            return src + imgQueryPath;
        } else {
          return defaultImage;
        }
    });
    Handlebars.registerHelper('checkAvailability', function(v1) {
        var allSwatchData = window.compareVariationsData;
        var variantAvailability = allSwatchData[v1];
        if (variantAvailability && variantAvailability.available == true) {
            return '';
        } else {
            return 'disabled';
        }
    });
}

function handleImageCarouselSwatchSelection($this, masterImage) {
    var querypath = $('#s7PresetsPlp').val();
    var mainImage = masterImage;
    if (!(masterImage.indexOf('https') > -1)){
        mainImage = 'https:' + masterImage;
    }
    var parentId = $this.attr('data-swatch-id');
    $this.parents('.product').find('.primary-image.'+ parentId +' .tile-image').attr('data-master-image', masterImage);
    var alternateMasterImage = $this.attr('data-alt-swatch-image') ? $this.attr('data-alt-swatch-image').split(',') : [];
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
        $this.parents('.product').find('.primary-image.'+ parentId).find('.pagination').remove();
        $this.parents('.product').find('.primary-image.'+ parentId).find('.image-wrapper').remove();
        $this.parents('.product').find('.primary-image.'+ parentId).append(template);
}

function handleColorSwatchesInTile() {
    $(document).on('click', '.product-tile .color-attribute', function (e) {
        e.preventDefault();
        var $this = $(e.target);
        var alternateImage = $this.attr('data-alt-swatch-image');
        var imgQueryPath =  $('#s7PresetsPlp').val();
        if(($this.closest('.image-wrapper').length > 0) && window.innerWidth > 1024){
            imgQueryPath = '?wid=840&hei=1168&fit=hfit&qlt=75';
        }
        $this.closest('.product-tile-footer').find("button div").removeClass("selected");
        $this.addClass('selected');
        var mainImage = $this.closest('.product-tile').find('.primary-image img').attr('data-master-image');
        var productUrl = $this.attr('data-product-url');
        var variantProductId = $this.attr('data-attr-value');
        alternateImage = alternateImage.split('_')[0] + '_main' + imgQueryPath;
        $this.closest('.product-tile').find('.primary-image img').attr('src', alternateImage);
        $this.closest('.product-tile').find('.image-container .primary-image img').attr('data-master-alt-image', mainImage);
        $this.closest('.product-tile').find('.image-container a').attr('href', productUrl);     
        $this.closest('.product').attr('data-pid', variantProductId);
        if ($('.compare-landing').length > 0) {
            var allSwatchData = window.compareVariationsData;
            var variantAvailability = allSwatchData[variantProductId];
            if (variantAvailability && variantAvailability.available == true) {
                $this.closest('.product-tile').find('.add-to-cart').attr('disabled', false);
            } else {
                $this.closest('.product-tile').find('.add-to-cart').attr('disabled', true);
            }
        }
            handleImageCarouselSwatchSelection($this, alternateImage);  
    });
}

module.exports = {
    getHandlebarHelpers: getHandlebarHelpers,
    handleColorSwatchesInTile: handleColorSwatchesInTile
}