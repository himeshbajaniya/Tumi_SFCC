'use strict';

var $compareBar = $('.compare-bar-wrapper');
var productsForComparison = [];
var compareButtonText = $('button.compare').text();

var lastKnownUrl = location.href;

var maxSlots = parseInt($('.compare-bar').data('max-slots'), 10);
if ($(window).width() < 640) {
    maxSlots = maxSlots - 1;
}

/**
 * @typedef ProductComparisonList
 * @type Object
 * @property {string} pid - ID for product to compare
 * @property {string} imgSrc - Image URL for selected product
 */

/**
 * Compiles the HTML for a single slot
 *
 * @param {ProductComparisonList} product - Selected product to compare
 * @param {number} idx - Slot number (zero-based)
 * @return {string} - HTML for a single slot
 */
function compileSlot(product, idx) {
    var pid = product.pid;
    var name = 'pid' + idx;

    return '' +
        '<div class="col-6 col-sm-4 selected-product">' +
            '<div class="slot" data-pid="' + pid + '">' +
                '<div class="img-wrapper"><img alt="' + product.altText + '" src="' + product.imgSrc + '"></div>' +
                '<div class="content"><p class="product-category">' + product.categoryName + '</p><p class="product-title">' + product.categoryTitle + '</p>' +
                '<a class="close" aria-label="remove ' + product.altText + ' from compare list">' +
                    'Remove Item' +
                '</a><a class="close-mobile" aria-label="remove"></a></div>' +
            '</div>' +
            '<input type="hidden" name="' + name + '" value="' + pid + '">' +
        '</div>\n';
}

/**
 * Draw and render the Compare Bar product slots
 *
 * @param {ProductComparisonList []} productsToCompare - List of ID's of the products to compare
 */
function redrawCompareSlots(productsToCompare) {
    var html = productsToCompare.map(function (product, idx) {
        return compileSlot(product, idx);
    }).join('');

    // Render empty slots
    if (productsToCompare.length < maxSlots) {
        var numAvailableSlots = maxSlots - productsToCompare.length;

        for (var i = 0; i < numAvailableSlots; i++) {
            if (i === 0 && productsToCompare.length < 2) {
                html += '<div class="col-6 col-sm-4 selected-product"><div class="slot">' +
                    '<div class="min-products-msg">' + $('.compare-bar').data('min-products-msg') +
                    '</div></div></div>';
            } else {
                html += '<div class="col-6 col-sm-4 selected-product"><div class="slot"></div></div>';
            }
        }
    }

    $('.compare-bar .product-slots').empty().append(html);
}

/**
 * Enables/disables the Compare button, depending on whether at least two products have been
 * selected for comparison
 *
 * @param {number} numProducts - Number of products selected for comparison
 */
function setCompareButton(numProducts) {
    if (numProducts > 0) {
        $('button.compare').text(compareButtonText + '(' + numProducts + ')');
    } else {
        $('button.compare').text(compareButtonText);
    }
    if (numProducts < 2) {
        $('button.compare').attr('disabled', true).removeClass('active');
    } else {
        $('button.compare').attr('disabled', false).addClass('active');
    }
}

/**
 * Returns a copy of a list of products to compare
 *
 * @param {ProductComparisonList []} productsToCompare - List of ID's of the products to compare
 * @return {ProductComparisonList []} List of ID's of the products to compare
 */
function copyProducts(productsToCompare) {
    return productsToCompare.map(function (product) {
        var proxy = {};

        Object.keys(product).forEach(function (key) {
            proxy[key] = product[key];
        });

        return proxy;
    });
}

/**
 * Handles the selection of a product for comparison
 *
 * @param {ProductComparisonList []} products - List of ID's of the products to compare
 * @param {string} pid - ID for product to compare
 * @param {string} imgSrc - Image URL for selected product
 * @param {string} altText - Alt text for selected product image
 * @return {ProductComparisonList []} List of ID's of the products to compare
 */
function selectProduct(products, pid, imgSrc, altText, categoryName, categoryTitle) {
    var productsToCompare = copyProducts(products) || [];

    if (productsToCompare.length < maxSlots) {
        productsToCompare.push({
            pid: pid,
            imgSrc: imgSrc,
            altText: altText,
            categoryName: categoryName,
            categoryTitle: categoryTitle
        });

        if (productsToCompare.length === maxSlots) {
            $('input[type=checkbox]:not(:checked)').attr('disabled', true);
        }

        redrawCompareSlots(productsToCompare);
        setCompareButton(productsToCompare.length);
        $compareBar.show();
    }

    return productsToCompare;
}

/**
 * Handles the deselection of a product
 *
 * @param {ProductComparisonList []} products - List of ID's of the products to compare
 * @param {string} pid - ID for product to compare
 * @return {ProductComparisonList []} List of ID's of the products to compare
 */
function deselectProduct(products, pid) {
    var productsToCompare = copyProducts(products) || [];

    productsToCompare = productsToCompare.filter(function (product) {
        return product.pid !== pid;
    });

    if (productsToCompare.length === 0) {
        $compareBar.hide();
    }

    $('input#compare_' + pid).prop('checked', false);
    $('input[type=checkbox]:not(:checked)').removeAttr('disabled');

    redrawCompareSlots(productsToCompare);
    setCompareButton(productsToCompare.length);
    return productsToCompare;
}

/**
 * Clears the Compare Bar and hides it
 * @return {undefined}
 */
function clearCompareBar() {
    productsForComparison.forEach(function (product) {
        $(this).trigger('compare:deselected', { pid: product.pid });
    });

    productsForComparison = [];
    $('.compare input').prop('checked', false);
    $('.compare input[type=checkbox]:not(:checked)').removeAttr('disabled');
    updateCompareLocalStorage(productsForComparison);
    $compareBar.hide();
}

/**
 * Update form action url to not have query string
 * @returns {undefined}
 */
function updateSubmitUrl() {
    var form = $('.compare-products-form');
    var targetUrl = form.attr('action');
    var urlParts = targetUrl.split('?');
    if (urlParts[1]) {
        urlParts[1].split('&').forEach(function (keyValue) {
            var splittedValues = keyValue.split('=');
            var key = decodeURIComponent(splittedValues[0]);
            var value = decodeURIComponent(splittedValues[1]);
            if (key && value) {
                if (form.find('[name="' + key + '"]').length === 0) {
                    form.append('<input type="hidden" name="' + key + '" value="' + value + '" />');
                }
            }
        });
        form.attr('action', urlParts[0]);
    }

    if(window.location.href.indexOf("Wishlist-Show") > 0) {
        form.append('<input type="hidden" name="isFromWhishlist" value="true" />');
    }
}

/**
 * @returns {string} returns cgid or q of particular page
 */
function getCgidORQName() {
    var cgidOrQName = $('#cgidName').val();
    if (cgidOrQName === 'null' || cgidOrQName === undefined) {
        cgidOrQName = $('#qName').val();
    }
    return cgidOrQName;
}

function updateCompareLocalStorage(productsForComparison) {
    var comparePid = '';
    if (productsForComparison.length > 0) {
        for (var i = 0; i < productsForComparison.length -1; i += 1) {
            comparePid += productsForComparison[i].pid + ',';
        }
        comparePid += productsForComparison[productsForComparison.length-1].pid;
    }
    var cgidOrQName = getCgidORQName();
    if (comparePid !== '' && cgidOrQName !== 'null' && cgidOrQName !== undefined) {
        localStorage.setItem('compare_'+ cgidOrQName, comparePid);
    }
    if (comparePid === '') {
        localStorage.removeItem('compare_'+ cgidOrQName);
    }
}
module.exports = {
    
    /**
     * Handles Compare checkbox click
     */
    handleCompareClick: function () {
        $('div.page').on('click', '.compare input[type=checkbox]', function () {
            var checked = $(this).is(':checked');
            var pid = $(this).attr('data-pid');
            var categoryName = $(this).attr('data-categoryname');
            var categoryTitle = $(this).attr('data-categorytitle');
            var imgSrc = $(this).attr('data-imgsrc');
            var altText = $(this).attr('data-alttext');

            if (checked) {
                productsForComparison = selectProduct(productsForComparison, pid, imgSrc, altText, categoryName, categoryTitle);
                $(this).trigger('compare:selected', { 
                    pid: pid,
                    imgSrc: imgSrc,
                    altText: altText,
                    categoryName: categoryName,
                    categoryTitle: categoryTitle
                });
            } else {
                productsForComparison = deselectProduct(productsForComparison, pid);
                $(this).trigger('compare:deselected', { pid: pid });
            }
            updateCompareLocalStorage(productsForComparison);
        });

        $(document).ready( function () {
            var cgidOrQName = getCgidORQName();
            if (cgidOrQName !== 'null' && cgidOrQName !== undefined) {
                var comparepids = localStorage.getItem('compare_'+ cgidOrQName);
                if (comparepids !== '' && comparepids !== undefined && comparepids !== 'null' && comparepids !== null) {
                    var pids = comparepids.split(',');
                    for (var i in pids) {
                        $('.compare input[type=checkbox][data-pid = "' + pids[i] + '"]').trigger('click');
                    }
                }
            }
        });
    },

    /**
     * Handles the Clear All link
     */
    handleClearAll: function () {
        $('.compare-bar a.clear-all').on('click', function (e) {
            e.preventDefault();
            clearCompareBar();
        });
    },

    /**
     * Handles deselection of a product on the Compare Bar
     */
    deselectProductOnCompareBar: function () {
        $('.compare-bar').off('click', '.close').on('click', '.close', function (e) {
            var pid = $(e.target).closest('.slot').attr('data-pid');
            productsForComparison = deselectProduct(productsForComparison, pid);
            $(this).trigger('compare:deselected', { pid: pid });
            updateCompareLocalStorage(productsForComparison);
        });
    },

    deselectProductOnCompareBarMobile: function () {
        $('.compare-bar').off('click', '.close-mobile').on('click', '.close-mobile', function (e) {
            var pid = $(e.target).closest('.slot').attr('data-pid');
            productsForComparison = deselectProduct(productsForComparison, pid);
            $(this).trigger('compare:deselected', { pid: pid });
            updateCompareLocalStorage(productsForComparison);
        });
    },

    /**
     * Selects products for comparison based on the checked status of the Compare checkboxes in
     * each product tile.  Used when user goes back from the Compare Products page.
     */
    selectCheckedProducts: function () {
        // $('.product-grid').ready(function () {
            // if (location.hash) {
            //     location.hash.replace('#', '').split(',').forEach(function (id) {
            //         $('input#' + id).prop('checked', 'checked');
            //     });
            // }
            // $('.compare input:checked').each(function () {
            //     var pid = $(this).closest('.product').attr('data-pid');
            //     var categoryName = $(this).closest('.product-tile')
            //             .find('.product-tile-title').text();
            //     var categoryTitle = $(this).closest('.product-tile')
            //             .find('.pdp-link a').text();
            //     var imgSrc = $(this).closest('.product-tile')
            //         .find('.tile-image')
            //         .prop('src');
            //     var altText = $(this).closest('.product-tile')
            //         .find('.tile-image')
            //         .attr('alt');

            //     productsForComparison = selectProduct(productsForComparison, pid, imgSrc, altText, categoryName, categoryTitle);
            //     $(this).trigger('compare:selected', { pid: pid });
            // });
        // });
    },

    /**
     * Sets the "backUrl" property to the last attribute selected URL to ensure that when the user
     * goes back from the Compare Products page, the previously selected attributes are still
     * selected and applied to the previous search.
     */
    setBackUrl: function () {
        $('.search-results').on('click', '.refinements a', function () {
            $('input[name="backUrl"]').val($(this).prop('href'));
        });
    },

    /**
     * Sets the history.pushState for history.back() to work from the Compare Products page.
     */
    setPushState: function () {
        $('.compare-products-form').on('submit', function () {
            updateSubmitUrl();
            var x= 6;  
            var selectedProducts = $('.compare input:checked').map(function () { return this.id; }).get().join(',');
            history.pushState({}, document.title, lastKnownUrl + '#' + selectedProducts);
            location.hash = selectedProducts;

            $(this).find('input[name="cgid"]').attr('value', $('input.category-id').val());
        });
    },
    catchFilterChange: function () {
        $('.container').on('click', '.refinements li a, .refinement-bar a.reset', function (e) {
            e.preventDefault();
            clearCompareBar();
        });
    },
    listenToFilterChange: function () {
        $('body').on('search:filter', function (e, data) {
            lastKnownUrl = data.currentTarget.href;
        });
    },

    handleMeasurementClick: function () {
        $('div.page').on('click', '.measurement-selection input[type=radio]', function () {
            var measurementType = $(this).attr('data-id');
            var $basicSpecification = $('.content.basicspecifications')
            var $basicSpecificationsMetric = $('.content.basicspecificationsmetric');

            for(var i=0; i < $basicSpecification.length ; i++) {
                var $attrInchContent = $($basicSpecification[i]).find('.content-attr');
                var $attrCMContent = $($basicSpecificationsMetric[i]).find('.content-attr');
                var cmContent = $($attrCMContent).html()
                var inchContent = $($attrInchContent).html();
                $($attrInchContent).html(cmContent)
                $($attrCMContent).html(inchContent)
            }
        });
    },

    handleRemoveProductClick: function () {
        $('div.page').on('click', '.compare-product-romove', function (e) {
            e.preventDefault();
            var searchPID = $(this).attr('data-pid');

            var $productContainer = $('.product-comparison .compare-detail-product[data-pid="' + searchPID + '"]');
            if ($('.product-comparison .compare-detail-product').length == 1) {
                window.history.back();
                return;
            }
            var $productAttrContainer = $('.product-comparison .compare-attr-detail-product[data-pid="' + searchPID + '"]');
            $productContainer.remove();
            $productAttrContainer.remove();
            $('.product-compared-suggestions').removeClass('invisible');
        });
    },

    defaultFunctionality: function () {
        $('#imperial').prop('checked', true);
    },


    updateRatingValue: function () {
        var starVal = $('.rating-value').attr('data-rating') / 5 * 100;
        $('.rating-value').css('width',starVal + '%');
    },

    updateMouseMove: function () {
        $(document).on('mouseenter', '.compare-attr-detail-product .image-container .image-carousel', function (e) {
            var $this = $(e.target);
            var alternateMasterImage = $this.attr('data-final-image');
            var activeItem = $this.attr('data-swatch-id');
            $this.closest('.product-tile').find('.image-wrapper').show();
            $this.closest('.product-tile').find('.pagination span#' + activeItem).addClass('active');
            $this.closest('.product-tile').find('.primary-image img').attr('src', alternateMasterImage);
        });

        $(document).on('mouseout', '.compare-attr-detail-product .image-container .primary-image', function (e) {
            var $this = $(e.target);
            var masterImage = $this.attr('data-master-image');
            $this.closest('.product-tile').find('.primary-image img').attr('src', masterImage);
            $this.closest('.product-tile').find('.pagination span').removeClass('active');
        });
    }
};
