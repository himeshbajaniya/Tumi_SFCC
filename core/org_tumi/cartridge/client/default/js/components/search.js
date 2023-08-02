'use strict';

var Handlebars = require('handlebars/dist/handlebars');
var rfkService = require('../reflektion/rfkService');
var handlebarHelpers = require('../handleBar/handleBarHelpers');
var produtTile = require('../search/product-tile');
var bookmark = require('./bookmark');

/**
 * Get cookie value by cookie name from browser
 * @param {string} cookieName - name of the cookie
 * @returns {string} cookie value of the found cookie name
 */
 function getCookie(cookieName) {
    var name = cookieName + '=';
    var decodedCookie = decodeURIComponent(document.cookie);
    var cookieArray = decodedCookie.split(';');
    for (var i = 0; i < cookieArray.length; i++) {
        var cookieItem = cookieArray[i];
        while (cookieItem.charAt(0) === ' ') {
            cookieItem = cookieItem.substring(1);
        }
        if (cookieItem.indexOf(name) === 0) {
            return cookieItem.substring(name.length, cookieItem.length);
        }
    }
    return '';
}

function noProductFound(total_item) {
    $('.search-results-count').text(total_item);
    $('.no-product-available').remove();
    $('.viewing-list').removeClass('d-none');
    if (total_item === 0) {
        var noProductFound = $('#noProductFound').val();
        var noProduct = `<div class="no-product-available text-center">${noProductFound}</div>`;
        $(noProduct).insertBefore('.product-grid.productTileTemplates');
        $('.viewing-list').addClass('d-none');
    }
}

function addFilterToPlpFiltersRequestDataObj(e, plpFiltersRequestDataObj) {

    var filterName = $(e.target).attr('id') ? $(e.target).attr('id').split('___')[1] : $(e.target).attr('id');
    var rfkType = $(e.target).closest('.value').attr('data-rfk-filter');
    var flag = 0;
    for (var i in plpFiltersRequestDataObj.data.filter) {
        if (plpFiltersRequestDataObj.data.filter[rfkType] === plpFiltersRequestDataObj.data.filter[i]) {
            var count = 0;
            for (var k in plpFiltersRequestDataObj.data.filter[rfkType].value) {
                if (plpFiltersRequestDataObj.data.filter[rfkType].value[k] === filterName) {
                    count = 1;
                    flag = 2;
                }
            }
            if (count === 0) {
                var valLength = plpFiltersRequestDataObj.data.filter[rfkType].value.length;
                plpFiltersRequestDataObj.data.filter[rfkType].value[valLength] = filterName;
                flag = 1;
            }
        }
    }
    if (flag === 0)
    {
        if(!(plpFiltersRequestDataObj.data.filter)) {
            plpFiltersRequestDataObj.data.filter = {};
        }
        plpFiltersRequestDataObj.data.filter[rfkType] = {};
        plpFiltersRequestDataObj.data.filter[rfkType].value = [filterName];
    }
    plpFiltersRequestDataObj.data.context.browser.device = window.deviceType;
    plpFiltersRequestDataObj.data.context.geo.ip = window.ipAddress;
    plpFiltersRequestDataObj.data.context.user.uuid = window.customerUUID ? window.customerUUID : getCookie('__ruid');

    return plpFiltersRequestDataObj;
}

function removeFilterFromPlpFiltersRequestDataObj(e, plpFiltersRequestDataObj) {

    var filterName = $(e.target).attr('id') ? $(e.target).attr('id').split('___')[1] : $(e.target).attr('id');
    var rfkType = $(e.target).closest('.value').attr('data-rfk-filter');
    if (!(filterName) && !(rfkType)) {
        var filterName = $(e.target).closest('.selected-tile').attr('data-name');
        var rfkType = $(e.target).closest('.selected-tile').attr('data-rfk-filter');
    }
    for (var i in plpFiltersRequestDataObj.data.filter[rfkType].value) {
        if (plpFiltersRequestDataObj.data.filter[rfkType].value[i] === filterName) {
            plpFiltersRequestDataObj.data.filter[rfkType].value.splice(i,1);
        }
    }
    if (plpFiltersRequestDataObj.data.filter[rfkType].value.length === 0) {
        delete plpFiltersRequestDataObj.data.filter[rfkType];
    }
    if (Object.keys(plpFiltersRequestDataObj.data.filter).length === 0) {
        delete plpFiltersRequestDataObj.data.filter;
    }
    plpFiltersRequestDataObj.data.context.browser.device = window.deviceType;
    plpFiltersRequestDataObj.data.context.geo.ip = window.ipAddress;
    plpFiltersRequestDataObj.data.context.user.uuid = window.customerUUID ? window.customerUUID : getCookie('__ruid');

    return plpFiltersRequestDataObj;
}

function getplpFiltersRequestDataObj(e) {

    var plpFiltersRequestData = window.plpFiltersRequestData;
    if(!plpFiltersRequestData) {
        var plpRequestData = rfkService.buildRfkCategoryRequestData();
        window.plpFiltersRequestData = plpRequestData;
        plpFiltersRequestData = window.plpFiltersRequestData;
    }
    var plpFiltersRequestDataObj = JSON.parse(plpFiltersRequestData);
    // $('.selected-filter-container').show();

    if (($(e.target).is(':checked'))) {
        var plpFiltersRequestDataObj = addFilterToPlpFiltersRequestDataObj(e, plpFiltersRequestDataObj);
    } else {
        var plpFiltersRequestDataObj = removeFilterFromPlpFiltersRequestDataObj(e, plpFiltersRequestDataObj);
    }
    plpFiltersRequestDataObj.data.context.browser.device = window.deviceType;
    plpFiltersRequestDataObj.data.context.geo.ip = window.ipAddress;
    plpFiltersRequestDataObj.data.context.user.uuid = window.customerUUID ? window.customerUUID : getCookie('__ruid');

    return plpFiltersRequestDataObj;
}

function getHandleBarTemplate(response) {
    if (response) {
        handlebarHelpers.getHandlebarHelpers();
        var template = Handlebars.compile($('#producttile-handlebar').html());
        const templateScript = template(response);
        $('.productTileTemplates').append(templateScript);
        var filterTemplate = Handlebars.compile($('#filter-template').html());
        const filterSearch = filterTemplate(response);
        $('.refinements').html(filterSearch);
    }
}

function loadAlternateViewsImage() {
    $(document).ready(function () {
        var $attrContainer = $('.product-comparison .products-detail');
        $attrContainer.find('.compare-attr-detail-product').each(function (i) {
            var pid = $(this).attr('data-sceneproductid');
            var $this = $(this);
            var altImg = ``;
            var altImages = $($('div.image-container')[i]).attr('data-alt-images')
            if(altImages !== undefined && altImages !== '') {
                var imageUrls = altImages.split(',');
                var imgQueryPath =  $('#s7PresetsPlp').val() !== 'null' ? $('#s7PresetsPlp').val() : '';
                if (imageUrls.length > 0) {
                    altImg = altImg + `<div class='product-tile'><div class='image-container'><div class="primary-image ${pid}" data-id="${pid}">
                    <img class="tile-image active" src="${imageUrls[0]}${imgQueryPath}" data-src="${imageUrls[0]}${imgQueryPath}" data-master-image="${imageUrls[0]}${imgQueryPath}" alt="" title=""/>
                    <div class="dark-overlay-plp"></div>`;
                    if (imageUrls.length - 1 > 0) {
                        altImg += `<div class="image-wrapper">`;
                        for( var i = 0; i < imageUrls.length; i++) {
                            altImg += `<div class="image-carousel" data-swatch-id="span_${i}" data-final-image="${imageUrls[i]}${imgQueryPath}"></div>`;
                        }
                        altImg += `</div><div class="pagination">`;
                        for( var i = 0; i < imageUrls.length; i++) {
                            altImg += `<span id="span_${i}" class=""></span>`;
                        }
                        altImg += `</div>`;
                    }
                    altImg = altImg + `</div></div></div>`;
                }
            } else {
                altImg += `<div class='product-tile no-alt-image'><div class='image-container'><div class="primary-image ${pid}" data-id="${pid}">
                    <img class="tile-image active" src="https://cdn.media.amplience.net/i/tumi/image?w=420&h=580" data-src="" data-master-image="" alt="" title=""/>
                    <div class="dark-overlay-plp"></div>
                    <div class="image-wrapper"></div>
                    <div class="pagination"></div>
                    </div></div></div>`;
            }
        $this.find('.alternate-image-swiper-wrapper').html(altImg);
        });
        var pidsLength = $('#pidsLength').val();
        if (parseInt(pidsLength) === 1) {
            $('.remove-item').hide();
        }
    });
}

function getComparedProdcutTile() {
    var response = window.rfkCompareProductTileDataResults;
    if (response) {
        handlebarHelpers.getHandlebarHelpers();
        for (var i in response.content.product.value) {
            var template = Handlebars.compile($('#compare-products-tiles').html());
            const templateScript = template(response.content.product.value[i]);
            $('.compare-products-tiles[data-pid = "' + response.content.product.value[i].sku + '"]').append(templateScript);
        }
        loadAlternateViewsImage();
        produtTile.handleImageCarousel();
        produtTile.updateMouseMove();
    }
}

function getCompareSuggestion() {
    var response = window.rfkCompareSuggestionsResults;
    if (response) {
        handlebarHelpers.getHandlebarHelpers();
        var template = Handlebars.compile($('#compare-products-suggestion').html());
        const templateScript = template(response);
        $('.compare-products-suggestion').append(templateScript);
    }
}

function updateToggleShowMoreFiler() {
    $(document).on('click', '.isShowMoreLink', function (e) {
        var $this = $(e.target);
        $this.parent('.isLinkVisible').parent('.list-of-filters').addClass('active').find('.hideShowMore').css('display', 'inline-block');
    });

    $(document).on('click', '.isShowLessLink', function (e) {
        var $this = $(e.target);
        $this.parent('.isLinkVisible').parent('.list-of-filters').removeClass('active').find('.hideShowMore').css('display', 'none');
    });
}


//compare-products-suggestion

function gridGenerator () {
    let gridBreakerPositions = $('#gridBreakerPositions').val();
    if(gridBreakerPositions !== 'null' && gridBreakerPositions !== undefined) {
        var gridBreakerPositionsObj = JSON.parse(gridBreakerPositions);
        Object.keys(gridBreakerPositionsObj).forEach(function (key) {
            if(gridBreakerPositionsObj[key]['ID'] === 'grid-breaker-slot-1') {
                if ($(window).width() > 640) {
                    var firstSlot = $('.slot-1');
                    if (firstSlot.length > 0 && $('.temp_'+parseInt(gridBreakerPositionsObj[key]['Position'])).length > 0) {
                        firstSlot.removeClass('d-none');
                        firstSlot.insertAfter($('.temp_'+parseInt(gridBreakerPositionsObj[key]['Position'])));
                    }
                }
            }
            if(gridBreakerPositionsObj[key]['ID'] === 'grid-breaker-slot-2') {
                if ($(window).width() > 1025) {
                    var secondSlot = $('.slot-2');
                    if (secondSlot.length > 0 && $('.temp_'+parseInt(gridBreakerPositionsObj[key]['Position'])).length > 0) {  
                        secondSlot.removeClass('d-none').addClass('tile-vertical');
                        secondSlot.insertAfter($('.temp_'+parseInt(gridBreakerPositionsObj[key]['Position'])));
                    }
                }
            }
            if(gridBreakerPositionsObj[key]['ID'] === 'grid-breaker-slot-3') {
                if ($(window).width() > 1025) {
                    var thirdSlot = $('.slot-3');
                    if (thirdSlot.length > 0 && $('.temp_'+parseInt(gridBreakerPositionsObj[key]['Position'])).length > 0) {  
                        thirdSlot.removeClass('d-none').addClass('two-tile-horizontal');
                        thirdSlot.insertAfter($('.temp_'+parseInt(gridBreakerPositionsObj[key]['Position'])));
                    }
                }
            }
            if(gridBreakerPositionsObj[key]['ID'] === 'grid-breaker-slot-4') {
                if ($(window).width() > 1025) {
                    var thirdSlot = $('.slot-4');
                    if (thirdSlot.length > 0 && $('.temp_'+parseInt(gridBreakerPositionsObj[key]['Position'])).length > 0) {  
                        thirdSlot.removeClass('d-none').addClass('three-tile-horizontal');
                        thirdSlot.insertAfter($('.temp_'+parseInt(gridBreakerPositionsObj[key]['Position'])));
                    }
                }
            }
            if(gridBreakerPositionsObj[key]['ID'] === 'grid-breaker-slot-5') {
                var fifthSlot = $('.slot-5');
                if (fifthSlot.length > 0 && $('.temp_'+parseInt(gridBreakerPositionsObj[key]['Position'])).length > 0) { 
                    fifthSlot.removeClass('d-none').addClass('skinny-tile-horizontal');
                    fifthSlot.insertAfter($('.temp_'+parseInt(gridBreakerPositionsObj[key]['Position'])));
                }
            }
        });
        // grid();
    }
}

function appendingSortByAttrInShowMoreDiv(response) {
    var gridFooter = $('.rfk-grid-footer');
    gridFooter.attr('data-page-number',response.page_number);
    gridFooter.attr('data-page-total',response.total_page);
    gridFooter.attr('data-page-total-item',response.total_item);
    $('.product-count').text(response.n_item);
    $('.total-product-count').text(response.total_item);
    if (response.page_number >= response.total_page) {
        gridFooter.addClass('d-none');
    } else {
        gridFooter.removeClass('d-none');
    }
}

/**
 * Update DOM elements with Ajax results
 *
 * @param {Object} $results - jQuery DOM element
 * @param {string} selector - DOM element to look up in the $results
 * @return {undefined}
 */
function updateDom($results, selector) {
    var $updates = $results.find(selector);
    $(selector).empty().html($updates.html());
}

/**
 * Keep refinement panes expanded/collapsed after Ajax refresh
 *
 * @param {Object} $results - jQuery DOM element
 * @return {undefined}
 */
function handleRefinements($results) {
    $('.refinement.active').each(function () {
        $(this).removeClass('active');
        var activeDiv = $results.find('.' + $(this)[0].className.replace(/ /g, '.'));
        activeDiv.addClass('active');
        activeDiv.find('button.title').attr('aria-expanded', 'true');
    });

    updateDom($results, '.refinements');
}

/**
 * Parse Ajax results and updated select DOM elements
 *
 * @param {string} response - Ajax response HTML code
 * @return {undefined}
 */
function parseResults(response) {
    var $results = $(response);
    var specialHandlers = {
        '.refinements': handleRefinements
    };

    // Update DOM elements that do not require special handling
    [
        '.grid-header',
        '.header-bar',
        '.header.page-title',
        '.product-grid',
        '.show-more',
        '.filter-bar'
    ].forEach(function (selector) {
        updateDom($results, selector);
    });

    Object.keys(specialHandlers).forEach(function (selector) {
        specialHandlers[selector]($results);
    });
}

/**
 * This function retrieves another page of content to display in the content search grid
 * @param {JQuery} $element - the jquery element that has the click event attached
 * @param {JQuery} $target - the jquery element that will receive the response
 * @return {undefined}
 */
function getContent($element, $target) {
    var showMoreUrl = $element.data('url');
    $.ajax({
        url: showMoreUrl,
        method: 'GET',
        success: function (response) {
            $target.append(response);
        },
        error: function () {
            console.log('error');
        }
    });
}

/**
 * Update sort option URLs from Ajax response
 *
 * @param {string} response - Ajax response HTML code
 * @return {undefined}
 */
function updateSortOptions(response) {
    var $tempDom = $('<div>').append($(response));
    var sortOptions = $tempDom.find('.grid-footer').data('sort-options').options;
    sortOptions.forEach(function (option) {
        $('option.' + option.id).val(option.url);
    });
}
function getrfkParseData() {
    var getrfkUrl = $('#getrfkSearchResults').val();
    $.ajax({
        url: getrfkUrl,
        method: 'GET',
        success: function (response) {
            defaultSearchContent(response);
        },
        error: function () {
            console.log('error');
        }
    });
}

function defaultSearchContent (data) {
    $('#searchModal .modal-content').spinner().start();
    var defaultSearchSuggestionData = window.defaultSearchSuggestionData;
    var trendingTitle = $('.trending-title').attr('data-loading');
    var popularTitle = $('.popular-title').attr('data-loading');
    if (!defaultSearchSuggestionData) {
        window.resultSearchSuggestionData = data.dataString;
        resultSearchSuggestionData = window.resultSearchSuggestionData;
        var resultSearchSuggestionDataObj = JSON.parse(resultSearchSuggestionData);
        resultSearchSuggestionDataObj.data.context.browser.device = window.deviceType;
        resultSearchSuggestionDataObj.data.context.geo.ip = window.ipAddress;
        resultSearchSuggestionDataObj.data.context.user.uuid = window.customerUUID ? window.customerUUID : getCookie('__ruid');
        resultSearchSuggestionData = JSON.stringify(resultSearchSuggestionDataObj);
        sessionStorage.setItem('reflktionUrl', data.reflktionUrl);
        var reflektionHeaders = JSON.stringify(data.headers);
        sessionStorage.setItem('reflektionHeaders', reflektionHeaders);
        $.ajax({
            url: data.reflktionUrl,
            type: 'post',
            headers: data.headers,
            data: resultSearchSuggestionData,
            success: function (response) {
                createSearchTemplate(response);
                $('#searchModal .modal-content').spinner().stop();
                $('.trending-title').text(trendingTitle);
                $('.popular-title').text(popularTitle);
                var parsedData = JSON.parse(data.dataString);
                if (response.total_item > response.n_item) {
                    $('.view-all-results').removeClass('d-none');
                    var _results = $('.view-all-results').attr('data-querystring');
                    _results = _results + '?q=' + parsedData.data.query.keyphrase.value[0] + '&lang=' + data.locale;
                    $('.view-all-results').attr('href', _results);
                    window.defaultSearchQuery = parsedData.data.query.keyphrase.value[0];
                } else {
                    $('.view-all-results').addClass('d-none');
                }
                window.defaultSearchSuggestionData = JSON.stringify(response);
                $('.trending-title').attr('data-searchData', response.autocomplete);
                $('.trending-title').attr('data-autocomplete', response.autocomplete);
            },
            error: function (error) {
                $('#searchModal .modal-content').spinner().stop();
            }
        });
    } else {
        createSearchTemplate(defaultSearchSuggestionData);
        $('#searchModal .modal-content').spinner().stop();
    }
}

function renderedSearchResults (searchField) {
    var resultSearchSuggestionData = window.resultSearchSuggestionData;
    var resultSearchSuggestionDataObj = JSON.parse(resultSearchSuggestionData);
    resultSearchSuggestionDataObj.data.query.keyphrase.value = [searchField];
    resultSearchSuggestionDataObj.data.context.browser.device = window.deviceType;
    resultSearchSuggestionDataObj.data.context.geo.ip = window.ipAddress;
    resultSearchSuggestionDataObj.data.context.user.uuid = window.customerUUID ? window.customerUUID : getCookie('__ruid');
    var updatedResultSearchSuggestionDataObj = JSON.stringify(resultSearchSuggestionDataObj);
    var reflktionUrl = sessionStorage.getItem('reflktionUrl');
    var reflektionHeaders = sessionStorage.getItem('reflektionHeaders');
    $.ajax({
        url: reflktionUrl,
        type: 'post',
        headers: JSON.parse(reflektionHeaders),
        data: updatedResultSearchSuggestionDataObj,
        success: function (response) {
            $('.popular-categories .listofcategories ul').empty();
            $('.trending-items .trending-items-list').empty();
            if (!response.suggestion.category.length && !response.suggestion.keyphrase.length) {
                $('.popular-title').html('');
            }
            if (response.n_item === 0) {
                $('.trending-items h3.trending-title').html('');
            }
            if (response.total_item > response.n_item) {
                $('.view-all-results').removeClass('d-none');
                var _results = $('.view-all-results').attr('data-querystring');
                _results = _results + '?q=' + searchField;
                $('.view-all-results').attr('href', _results);
            } else {
                $('.view-all-results').addClass('d-none');
            }
            createSearchTemplate(response);
        },
        error: function (error) {
            console.log(error);
        }
    });
}

function updateDefaultSearchTemplate () {
    // sessionStorage.setItem('defaultSearchSuggestionData', '');
    window.defaultSearchSuggestionData = null;
    getrfkParseData();
}

function createSearchTemplate(data) {
    var sourceCategory = $('#searchcategory-handlebar').html();
    var sourceTrending = $('#searchtrending-handlebar').html();
    var templateCategory = Handlebars.compile(sourceCategory);
    var templateTrending = Handlebars.compile(sourceTrending);
    const templateScript = templateCategory(data);
    const templateCategoryScript = templateTrending(data);
    $('.popular-categories .listofcategories').html(templateScript);
    $('.trending-items .trending-items-list').html(templateCategoryScript);
}

function updateFilterData (activeStateFilters) {
    $('.selected-filter-wrapper .selected-filter-tile').empty();
    var filterData = JSON.parse(window.plpFiltersRequestData).data.filter;
    var count = 0;
    for (var i in filterData) {
        if (filterData && filterData[i] && filterData[i].value.length > 0) {
            $('.filter_'+i).text(`(${filterData[i].value.length})`);
        } else {
            $('.filter_'+i).text('');
        }
        var k = 0;
        var count = count + filterData[i].value.length;
        for (var j in filterData[i].value) {
            var filterName = filterData[i].value[k];
            var filter = filterData[i].value[k];
            filterName = filterName.replace(/\=/g, '');
            var splitName = $('.'+i).children('.' + filterName).text();
            // var splitName = filterName.replace(/[^a-zA-Z0-9]/g, '');
            if (splitName) {
                var rfkType = i;
                $('.'+ rfkType + "" + filterName).prop('checked', true);
                var filterDom = `<span class="selected-tile ${rfkType}_${filter}" data-rfk-filter="${rfkType}" data-name="${filter}">${splitName}<span class="clear-btn"></span></span></span>`;        
                $('.selected-filter-wrapper .selected-filter-tile').append(filterDom);
            }
            k++;
        }
    }
    if (count > 0) {
        $('.filter-count').text(`(${count})`);
    } else {
        $('.filter-count').text('');
    }

    if (filterData && Object.keys(filterData).length > 0) {
        $('.clear-all.rfk-reset').addClass('d-inline');
    } else {
        $('.clear-all.rfk-reset').removeClass('d-inline');
    }
    for (var i in activeStateFilters) {
        $('#' + activeStateFilters[i] + '.card-header').addClass('active activeState');
        $('#' + activeStateFilters[i] + '.card-header').next().toggleClass("active");
    }
}

function getActiveStateForFilter () {
    var activeState = $('.activeState');
    var temp = [];
    var k = 0;
    for (var i in activeState) {
        if ($('.activeState')[k]) {
            temp.push($('.activeState')[k].id);
            k++;
        }
    }
    return temp;
}

module.exports = {
    getCookie: getCookie,
    getHandleBarTemplate: getHandleBarTemplate,
    getComparedProdcutTile: getComparedProdcutTile,
    getCompareSuggestion: getCompareSuggestion,
    gridGenerator: gridGenerator,
    updateToggleShowMoreFiler: updateToggleShowMoreFiler,

    updatingComparePidsInLocalStorage: function () {
        var pids = $('.product-comparison').attr('data-pids');
        var cgidOrQ = $('#cgidOrQ').val();
        if (pids !== undefined && pids !== 'null' && cgidOrQ !== undefined && cgidOrQ !== 'null') {
            localStorage.setItem('compare_' + cgidOrQ, pids);
        }
    },

    filter: function () {
        // Display refinements bar when Menu icon clicked
        $('.container').on('click', 'button.filter-results', function () {
            $('.refinement-bar, .modal-background').show();
            $('.refinement-bar').siblings().attr('aria-hidden', true);
            $('.refinement-bar').closest('.row').siblings().attr('aria-hidden', true);
            $('.refinement-bar').closest('.tab-pane.active').siblings().attr('aria-hidden', true);
            $('.refinement-bar').closest('.container.search-results').siblings().attr('aria-hidden', true);
            $('.refinement-bar .close').focus();
        });
    },

    closeRefinements: function () {
        // Refinements close button
        $('.container').on('click', '.refinement-bar button.close, .modal-background', function () {
            $('.refinement-bar, .modal-background').hide();
            $('.refinement-bar').siblings().attr('aria-hidden', false);
            $('.refinement-bar').closest('.row').siblings().attr('aria-hidden', false);
            $('.refinement-bar').closest('.tab-pane.active').siblings().attr('aria-hidden', false);
            $('.refinement-bar').closest('.container.search-results').siblings().attr('aria-hidden', false);
            $('.btn.filter-results').focus();
        });
    },

    resize: function () {
        // Close refinement bar and hide modal background if user resizes browser
        $(window).resize(function () {
            $('.refinement-bar, .modal-background').hide();
            $('.refinement-bar').siblings().attr('aria-hidden', false);
            $('.refinement-bar').closest('.row').siblings().attr('aria-hidden', false);
            $('.refinement-bar').closest('.tab-pane.active').siblings().attr('aria-hidden', false);
            $('.refinement-bar').closest('.container.search-results').siblings().attr('aria-hidden', false);
        });
    },

    sort: function () {
        // Handle sort order menu selection
        $('.container').on('change', '[name=sort-order]', function (e) {
            e.preventDefault();

            $.spinner().start();
            $(this).trigger('search:sort', this.value);
            $.ajax({
                url: this.value,
                data: { selectedUrl: this.value },
                method: 'GET',
                success: function (response) {
                    $('.product-grid').empty().html(response);
                    $.spinner().stop();
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    },

    rfkLazyLoad: function () {
        let $el = $('.rfk-grid-footer');
        var pageNumber = $el.attr('data-page-number');
        var lazyLoadThreshold = $('#lazyLoadThreshold').val();
        if (parseInt(pageNumber) < parseInt(lazyLoadThreshold) && $el.length) {
            const config = {
                rootMargin: '0px',
                threshold: 0
            };
            let observer = new IntersectionObserver((entry) => {
                pageNumber = $el.attr('data-page-number');
                if (parseInt(pageNumber) < parseInt(lazyLoadThreshold)) {
                    if (entry[0].isIntersecting) {
                        $('.rfk-show-more button').trigger('click');
                    }
                }
            }, config);
        observer.observe($el[0]);
        }
    },

    rfkSort: function () {
        // Handle sort order menu selection
        $('.container').on('change', '[name=rfk-sort-order]', function (e) {
            e.preventDefault();

            $.spinner().start();
            var rfkCategorySortByRequestData = window.plpFiltersRequestData;
            if(!rfkCategorySortByRequestData) {
                var rfkCategorySortByRequestData = rfkService.buildRfkCategoryRequestData();
                window.plpFiltersRequestData = rfkCategorySortByRequestData;
                rfkCategorySortByRequestData = window.plpFiltersRequestData;
            }
            var gridFooter = $('.rfk-grid-footer');
            var sortName = $(this).attr('data-sort-name');
            var sortOrder = $(this).attr('data-sort-order');
            var rfkCategorySortByRequestDataObject = JSON.parse(rfkCategorySortByRequestData);
            if (!(rfkCategorySortByRequestDataObject.data.sort.value)) {
                rfkCategorySortByRequestDataObject.data.sort.value = [
                    {
                        "name": '',
                        "order": ''
                    }
                ]
            }
            rfkCategorySortByRequestDataObject.data.context.browser.device = window.deviceType;
            rfkCategorySortByRequestDataObject.data.context.geo.ip = window.ipAddress;
            rfkCategorySortByRequestDataObject.data.context.user.uuid = window.customerUUID ? window.customerUUID : getCookie('__ruid');
            rfkCategorySortByRequestDataObject.data.sort.value[0].name = sortName;
            rfkCategorySortByRequestDataObject.data.sort.value[0].order = sortOrder;
            if ($('.rfk-filter-active').length === 0) {
                delete rfkCategorySortByRequestDataObject.data.filter;
            }
            var reflktionUrl = rfkService.reflektionUrl();
            var reflektionHeaders = JSON.stringify(rfkService.reflektionHeaders());
            $.ajax({
                url: reflktionUrl,
                type: 'post',
                headers: JSON.parse(reflektionHeaders),
                data: JSON.stringify(rfkCategorySortByRequestDataObject),
                success: function (response) {
                    window.plpFiltersRequestData = JSON.stringify(rfkCategorySortByRequestDataObject);
                    var activeStateFilters = getActiveStateForFilter();
                    $('.productTileTemplates').empty();
                    getHandleBarTemplate(response);
                    updateFilterData(activeStateFilters);
                    $('.rfk-sort-order-dropdown').removeClass('show');
                    gridFooter.attr('data-sort-name',sortName);
                    gridFooter.attr('data-sort-order',sortOrder);
                    appendingSortByAttrInShowMoreDiv(response);
                    produtTile.handleImageCarousel();
                    noProductFound(response.total_item);
                    bookmark.getWishlistItem();
                    $.spinner().stop();
                },
                error: function (error) {
                    console.log(error);
                    $.spinner().stop();
                }
            });
        });
    },

    showMore: function () { //removine the ajax call to replace
        // Show more products
        $('.container').on('click', '.show-more button', function (e) {
            e.stopPropagation();
            var showMoreUrl = $(this).data('url');
            e.preventDefault();
            $.spinner().start();
            $(this).trigger('search:showMore', e);
            $.ajax({
                url: showMoreUrl,
                data: { selectedUrl: showMoreUrl },
                method: 'GET',
                success: function (response) {
                    $('.grid-footer').replaceWith(response);
                    updateSortOptions(response);
                    $.spinner().stop();
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    },

    rfkShowMore: function () { //removine the ajax call to replace
        // Show more products
        $('.container').on('click', '.rfk-show-more button', function (e) {
            e.stopPropagation();
            var plpRequestData = window.plpFiltersRequestData;
            if(!plpRequestData) {
                var rfkCategoryShowMoreRequestData = rfkService.buildRfkCategoryRequestData();
                window.plpFiltersRequestData = rfkCategoryShowMoreRequestData;
                plpRequestData = window.plpFiltersRequestData;
            }
            var gridFooter = $('.rfk-grid-footer');
            var parsePlpRequestObj = JSON.parse(plpRequestData);
            var pageNumber = gridFooter.attr('data-page-number');
            var totalNoofPages = gridFooter.attr('data-page-total');
            var pageSize = gridFooter.attr('data-page-size');
            var totalNoofItems = gridFooter.attr('data-page-total-item');
            var currentProCount = $('.product-count').text();
            var reflktionUrl = rfkService.reflektionUrl();
            var reflektionHeaders = JSON.stringify(rfkService.reflektionHeaders());
            if(gridFooter.hasClass('sortby-show-more')) {
                parsePlpRequestObj.data.sort.value[0].name = gridFooter.attr('data-sort-name');
                parsePlpRequestObj.data.sort.value[0].order = gridFooter.attr('data-sort-order');
            }
            parsePlpRequestObj.data.context.browser.device = window.deviceType;
            parsePlpRequestObj.data.context.geo.ip = window.ipAddress;
            parsePlpRequestObj.data.context.user.uuid = window.customerUUID ? window.customerUUID : getCookie('__ruid');
            if ($('.rfk-filter-active').length === 0) {
                delete parsePlpRequestObj.data.filter;
            }
            parsePlpRequestObj.data.page_number = parseInt(pageNumber) + 1;
            if (parseInt(pageNumber) < parseInt(totalNoofPages)) {
                e.preventDefault();
                $.spinner().start();
                $(this).trigger('search:showMore', e);
                $.ajax({
                    url: reflktionUrl,
                    type: 'post',
                    headers: JSON.parse(reflektionHeaders),
                    data: JSON.stringify(parsePlpRequestObj),
                    success: function (response) {
                        var activeStateFilters = getActiveStateForFilter();
                        getHandleBarTemplate(response);
                        gridFooter.attr('data-page-number',parseInt(pageNumber) + 1);
                        gridFooter.attr('data-page-total-item',response.total_item);
                        gridFooter.attr('data-page-total',response.total_page);
                        gridFooter.attr('data-page-size',response.n_item);
                        $('.total-product-count').text(parseInt(response.total_item));
                        if ((parseInt(pageNumber) + 1) >= parseInt(totalNoofPages)) {
                            gridFooter.addClass('d-none');
                            $('.product-count').text(parseInt(totalNoofItems));
                        } else {
                            $('.product-count').text((parseInt(currentProCount)) + parseInt(pageSize));
                        }
                        updateFilterData(activeStateFilters);
                        noProductFound(response.total_item);
                        produtTile.handleImageCarousel();
                        produtTile.imageLazyLoadPlp();
                        bookmark.getWishlistItem();
                        $.spinner().stop();
                        var searchPhrase = $('#qName').val() ? $('#qName').val() : $('#cgidName').val();
                        if (searchPhrase) {
                            var skus = [];
                            var products = response.content.product.value
                            products.filter(function (product) {
                                skus.push(product.sku)
                            });
                            $('body').trigger('widget:click', {
                                eventType: searchPhrase,
                                modSearchTerm: response.autocomplete ? response.autocomplete : '',
                                rfkId: response.widget.rfkid,
                                skus: skus,
                                index: parsePlpRequestObj.data.page_number
                            });
                        }
                    },
                    error: function (error) {
                        console.log(error);
                        $.spinner().stop();
                    }
                });
            }
        });
    },

    rfkResetFilter: function () {
        $('.container').on(
            'click',
            '.selected-filter-container .rfk-reset, .bottom-filter-container .rfk-reset',
            function (e) {
            e.preventDefault();
            e.stopPropagation();
            var plpFiltersRequestData = window.plpFiltersRequestData;
            if(!plpFiltersRequestData) {
                window.plpFiltersRequestData = plpRequestData;
                plpFiltersRequestData = window.plpFiltersRequestData;
            }
            var plpFiltersRequestDataObj = JSON.parse(plpFiltersRequestData);
            delete plpFiltersRequestDataObj.data.filter;
            plpFiltersRequestDataObj.data.context.browser.device = window.deviceType;
            plpFiltersRequestDataObj.data.context.geo.ip = window.ipAddress;
            plpFiltersRequestDataObj.data.context.user.uuid = window.customerUUID ? window.customerUUID : getCookie('__ruid');
            var reflktionUrl = rfkService.reflektionUrl();
            var reflektionHeaders = JSON.stringify(rfkService.reflektionHeaders());
            $.spinner().start();
            $.ajax({
                url: reflktionUrl,
                type: 'post',
                headers: JSON.parse(reflektionHeaders),
                data: JSON.stringify(plpFiltersRequestDataObj),
                success: function (response) {
                    window.plpFiltersRequestData = JSON.stringify(plpFiltersRequestDataObj);
                    var activeStateFilters = getActiveStateForFilter();
                    $('.productTileTemplates').empty();
                    getHandleBarTemplate(response);
                    updateFilterData(activeStateFilters);
                    noProductFound(response.total_item);
                    $('.rfk-grid-footer').addClass('rfk-filter-active');
                    appendingSortByAttrInShowMoreDiv(response);
                    produtTile.handleImageCarousel();
                    bookmark.getWishlistItem();
                    $.spinner().stop();
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    },

    rfkResetSelectedFilterItem: function () {
        $('.container').on(
            'click',
            '.selected-filter-container .clear-btn',
            function (e) {
            e.preventDefault();
            e.stopPropagation();
            var plpFiltersRequestData = window.plpFiltersRequestData;
            if(!plpFiltersRequestData) {
                var plpRequestData = rfkService.buildRfkCategoryRequestData();
                window.plpFiltersRequestData = plpRequestData;
                plpFiltersRequestData = window.plpFiltersRequestData;
            }
            var plpFiltersRequestDataObj = JSON.parse(plpFiltersRequestData);
            var filterName = $(e.target).closest('.selected-tile').attr('data-name');
            var splitName = filterName.replace(/[^a-zA-Z0-9]/g, '');
            var rfkType = $(e.target).closest('.selected-tile').attr('data-rfk-filter');
            var plpFiltersRequestDataObj = removeFilterFromPlpFiltersRequestDataObj(e,plpFiltersRequestDataObj);
            var reflktionUrl = rfkService.reflektionUrl();
            var reflektionHeaders = JSON.stringify(rfkService.reflektionHeaders());
            $.spinner().start();
            $.ajax({
                url: reflktionUrl,
                type: 'post',
                headers: JSON.parse(reflektionHeaders),
                data: JSON.stringify(plpFiltersRequestDataObj),
                success: function (response) {
                    var activeStateFilters = getActiveStateForFilter();
                    $('.productTileTemplates').empty();
                    window.plpFiltersRequestData = JSON.stringify(plpFiltersRequestDataObj);
                    getHandleBarTemplate(response);
                    updateFilterData(activeStateFilters);
                    noProductFound(response.total_item);
                    $('.rfk-grid-footer').addClass('rfk-filter-active');
                    appendingSortByAttrInShowMoreDiv(response);
                    produtTile.handleImageCarousel();
                    bookmark.getWishlistItem();
                    $.spinner().stop();
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    },

    rfkApplyFilter: function () {
        $('.container').on(
            'click',
            '.refinements li input',
        function (e) {
            e.preventDefault();
            e.stopPropagation();
            var plpFiltersRequestDataObj = getplpFiltersRequestDataObj(e);
            var reflktionUrl = rfkService.reflektionUrl();
            var reflektionHeaders = JSON.stringify(rfkService.reflektionHeaders());
            // var filterName = $(e.target).attr('name');
            // var splitName = filterName.replace(/[^a-zA-Z0-9]/g, '');
            // var rfkType = $(e.target).closest('.value').attr('data-rfk-filter');
            $.spinner().start();
            $.ajax({
                url: reflktionUrl,
                type: 'post',
                headers: JSON.parse(reflektionHeaders),
                data: JSON.stringify(plpFiltersRequestDataObj),
                success: function (response) {
                    window.plpFiltersRequestData = JSON.stringify(plpFiltersRequestDataObj);
                    var activeStateFilters = getActiveStateForFilter();
                    $('.productTileTemplates').empty();
                    getHandleBarTemplate(response);
                    updateFilterData(activeStateFilters);
                    noProductFound(response.total_item);
                    $('.rfk-grid-footer').addClass('rfk-filter-active');
                    appendingSortByAttrInShowMoreDiv(response);
                    produtTile.handleImageCarousel();
                    produtTile.imageLazyLoadPlp();
                    bookmark.getWishlistItem();
                    $.spinner().stop();
                    var searchPhrase = $('#qName').val() ? $('#qName').val() : $('#cgidName').val();
                    if (searchPhrase) {
                        var skus = [];
                        var products = response.content.product.value
                        products.filter(function (product) {
                            skus.push(product.sku)
                        });
                        $('body').trigger('widget:click', {
                            eventType: searchPhrase,
                            modSearchTerm: response.autocomplete ? response.autocomplete : '',
                            rfkId: response.widget.rfkid,
                            skus: skus,
                            index: plpFiltersRequestDataObj.data.page_number
                        });
                    }
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    },

    applyFilter: function () {
        // Handle refinement value selection and reset click
        $('.container').on(
            'click',
            '.refinements li button, .refinement-bar button.reset, .filter-value button, .swatch-filter button',
            function (e) {
                e.preventDefault();
                e.stopPropagation();

                $.spinner().start();
                $(this).trigger('search:filter', e);
                $.ajax({
                    url: $(this).data('href'),
                    data: {
                        page: $('.grid-footer').data('page-number'),
                        selectedUrl: $(this).data('href')
                    },
                    method: 'GET',
                    success: function (response) {
                        parseResults(response);
                        $.spinner().stop();
                    },
                    error: function () {
                        $.spinner().stop();
                    }
                });
            });

            // Left FIlters Section Toggle
            $(".refinement-bar").on('click', '.refinements .card-header', function(){
                $(this).toggleClass('active  activeState');
                $(this).closest(".refinement").find(".card-body").toggleClass("active");
            });

            $('.close-filters').on('click', function(){
                $('.refinement-bar.active').removeClass('active');
                $('.btn-filter-text').text('Show Filters');
                $('.selected-filter-container').addClass('active');
            })
    },

    showContentTab: function () {
        // Display content results from the search
        $('.container').on('click', '.content-search', function () {
            if ($('#content-search-results').html() === '') {
                getContent($(this), $('#content-search-results'));
            }
        });

        // Display the next page of content results from the search
        $('.container').on('click', '.show-more-content button', function () {
            getContent($(this), $('#content-search-results'));
            $('.show-more-content').remove();
        });
    },

    openSearchTile: function () {
        $(document).on('click', '.search-products', function (e) {
            e.preventDefault();
            $('#searchModal').modal('show');
            updateDefaultSearchTemplate();
            $('#searchModal').on('shown.bs.modal', function () {
                $('.search-field-reflektion').trigger('focus');
            });
            $('#searchModal').on('hidden.bs.modal', function () {
                $('.site-search').find('form')[0].reset();
            });
            var rfkId = $('.search-field-reflektion').attr('data-rfkidEvent');
            $('body').trigger('widget:appear', {
                fType: 'previewSearch', 
                rfkId: rfkId
            });
        });
    },

    getReflektionSuggesstion: function () {
        var searchInput = document.querySelector('.search-field-reflektion');
        var trendingTitle = $('.trending-title').attr('data-loading');
        var popularTitle = $('.popular-title').attr('data-loading');
        var trendingUploadTitle = $('.trending-title').attr('data-update');
        var popularUploadTitle = $('.popular-title').attr('data-update');
        var noRfkResponse = $('.trending-title').attr('data-noresponse');
        var regExpValue = new RegExp('^[!@#\$%\^\&*\)\(+=._-]+$');
        if (searchInput) {
            searchInput.addEventListener("keyup", function (event) {
                $('.clear-search-text').show();
                var searchField = $(this).val();
                if (searchField.length) {
                    renderedSearchResults(searchField);
                    $('.trending-title').text(trendingUploadTitle +' "'+ searchField +'"');
                    $('.trending-title').attr('data-searchData', searchField);
                    $('.popular-title').text(popularUploadTitle);
                    if(regExpValue.test(searchField)) {
                        $('.popular-title').text('');
                        $('.trending-title').text(noRfkResponse +' "'+ searchField+'"');
                        window.defaultSearchSuggestionData = null;
                    }
                } else if (searchField === '' && (event.keyCode == 8 || event.keyCode == 46)) {
                    updateDefaultSearchTemplate();
                    $('.trending-title').text(trendingTitle);
                    $('.popular-title').text(popularTitle);
                }
            });
        }
    },

    onHoverSearchList: function () {
        $(document).on('mouseover', '.listofcategories a:not(".no-ajax")', function (e) {
            e.preventDefault();
            var hoverData = $(this).text();
            var curr = $(this);
            hoverData = hoverData.toString();
            var resultSearchSuggestionData = window.resultSearchSuggestionData;
            var resultSearchSuggestionDataObj = JSON.parse(resultSearchSuggestionData);
            resultSearchSuggestionDataObj.data.query.keyphrase.value = [hoverData];
            resultSearchSuggestionDataObj.data.context.browser.device = window.deviceType;
            resultSearchSuggestionDataObj.data.context.geo.ip = window.ipAddress;
            resultSearchSuggestionDataObj.data.context.user.uuid = window.customerUUID ? window.customerUUID : getCookie('__ruid');
            var updatedResultSearchSuggestionDataObj = JSON.stringify(resultSearchSuggestionDataObj);
            var reflktionUrl = sessionStorage.getItem('reflktionUrl');
            var trendingUploadTitle = $('.trending-title').attr('data-update');
            var reflektionHeaders = sessionStorage.getItem('reflektionHeaders');
            $.ajax({
                url: reflktionUrl,
                type: 'post',
                headers: JSON.parse(reflektionHeaders),
                data: updatedResultSearchSuggestionDataObj,
                success: function (response) {
                    var sourceTrending = $('#searchtrending-handlebar').html();
                    var templateTrending = Handlebars.compile(sourceTrending);
                    const templateScript = templateTrending(response);
                    $('.trending-items .trending-items-list').html(templateScript);
                    $('.trending-title').text(trendingUploadTitle +' "'+ hoverData+'"');
                    $('.trending-title').attr('data-searchData', hoverData);
                    $('.trending-title').attr('data-autocomplete', response.autocomplete);
                    if (response.total_item > response.n_item) {
                        $('.view-all-results').removeClass('d-none');
                        var _results = $('.view-all-results').attr('data-querystring');
                        _results = _results + '?q=' + hoverData;
                        $('.view-all-results').attr('href', _results);
                    } else {
                        $('.view-all-results').addClass('d-none');
                    }
                    curr.addClass('no-ajax');
                    curr.attr('data-pjson', JSON.stringify(response));
                },
                error: function (error) {
                    console.log(error);
                }
            });
        }); 
    },

    onHoverSearchListWithoutAjax: function () {
        $(document).on('mouseover', '.listofcategories a.no-ajax', function (e) {
            e.preventDefault();
            var $this = $(this).text();
            var trendingUploadTitle = $('.trending-title').attr('data-update');
            var $data = JSON.parse($(this).attr('data-pjson'));
            var sourceTrending = $('#searchtrending-handlebar').html();
            var templateTrending = Handlebars.compile(sourceTrending);
            const templateScript = templateTrending($data);
            $('.trending-items .trending-items-list').html(templateScript);
            $('.trending-title').text(trendingUploadTitle +' "'+ $this+'"');
            $('.trending-title').attr('data-searchData', $this);
            $('.trending-title').attr('data-autocomplete', $data.autocomplete);
            if ($data.total_item > $data.n_item) {
                $('.view-all-results').removeClass('d-none');
                var _results = $('.view-all-results').attr('data-querystring');
                _results = _results + '?q=' + $this;
                $('.view-all-results').attr('href', _results);
            }
        });
    },

    clearSearchField: function () {
        $(document).on('click', '.clear-search-text', function () {
            var defaultData = window.defaultSearchSuggestionData;
            var trendingTitle = $('.trending-title').attr('data-loading');
            var popularTitle = $('.popular-title').attr('data-loading');
            var searchQuery = window.defaultSearchQuery;
            defaultData = JSON.parse(defaultData);
            $('.search-field-reflektion').val('');
            $('.popular-categories .listofcategories').empty();
            $('.trending-items .trending-items-list').empty();
            $('.trending-title').text(trendingTitle);
            $('.popular-title').text(popularTitle);
            createSearchTemplate(defaultData);
            if (defaultData.total_item > defaultData.n_item) {
                $('.view-all-results').removeClass('d-none');
                var _results = $('.view-all-results').attr('data-querystring');
                _results = _results + '?q=' + searchQuery;
                $('.view-all-results').attr('href', _results);
            }
            $(this).hide();
        });
    }
};
