'use strict';

module.exports = {
    rfkEvents: function () {
        $('body').on('previewSearchWidget:click', function(e, response) {
            
            var type = '';
            var titleBasedValues = {};
            var popularCategories = $('#popularCategories').val();
            var categories = $('#categories').val();
            var didYouMeanLabel = $('#didYouMeanLabel').val();
            if (response.title === popularCategories) {
                type = 'trending_category';
                titleBasedValues = {
                    f: "sb"
                }
            } else if (response.title === categories) {
                type = 'category';
                titleBasedValues = {
                    kw: response.filedVal,
                    m: response.autoComplete
                }
            } else if (response.title === didYouMeanLabel) {
                type = 'keyphrase';
                titleBasedValues = {
                    kw: response.filedVal,
                    m: response.autoComplete
                }
            }
            
            var rfk = window.rfk || [];
            rfk.push(["trackEvent", {
                type: "widget",
                name: "click",
                uuid: customerUUID,
                value: {
                    context: {
                        page: {
                            locale_country: rfkCountry,
                            locale_language: rfkLanguage,
                            locale_currency: rfkCurrency
                        }
                    },
                    rfkid: response.rfkid,
                    w: "suggestion",
                    text: response.text,
                    type: type,
                    index: response.index,
                    ...titleBasedValues
                }
            }]);
        });

        $('body').on('previewSearchProductWidget:click', function(e, response) {
            var type = '';
            if (response.title === 'Popular Categories') {
                type = 'trending_category';
            } else if (response.title === 'Categories') {
                type = 'category';
            } else if (response.title === 'Did you mean ?') {
                type = 'keyphrase';
            }
            var rfk = window.rfk || [];
            rfk.push(["trackEvent", {
                type: "widget",
                name: "click",
                uuid: customerUUID,
                value: {
                    context: {
                        page: {
                            locale_country: rfkCountry,
                            locale_language: rfkLanguage,
                            locale_currency: rfkCurrency
                        }
                    },
                    rfkid: response.rfkid,
                    w: "suggestion",
                    text: response.text,
                    kw: response.filedVal,
                    type: type,
                    index: response.index,
                    m: response.autocomplete,
                    f: "sb",
                    products: [
                        {
                          sku: response.sku
                        }
                    ]
                }
            }]);
        });

        $('body').on('product:afterAddToCart', function (e, response) {
            var name = 'pdp';
            if ($(this).attr('class') === 'modal-open') { //eslint-disable-line
                name = 'qview';
            }
            var rfk = window.rfk || [];
            rfk.push(["trackEvent", { //eslint-disable-line
                type: "a2c", //eslint-disable-line
                name: name,
                uuid: customerUUID,
                value: {
                    context: {
                        page: {
                            locale_country: rfkCountry,
                            locale_language: rfkLanguage,
                            locale_currency: rfkCurrency
                        }
                    },
                    products: [{
                        sku: response.cart.items[response.cart.items.length-1].id
                    }],
                }
            }]);
        });


        $('body').on('product:afterAttributeSelect', function(e, response) {
            var rfk = window.rfk || [];
            rfk.push(["trackEvent", {
                type: "view",
                name: "pdp",
                uuid: customerUUID,
                value: {
                    context: {
                        page: {
                            locale_country: rfkCountry,
                            locale_language: rfkLanguage,
                            locale_currency: rfkCurrency
                        }
                    },
                    products: [
                        {
                            sku: response.data.product.id
                        }
                    ]
                }
            }]);
        });

        $('body').on('searchProductWidget:click', function(e, response) {
            var rfk = window.rfk || [];
            rfk.push(["trackEvent", {
                "type": "widget",
                "name": "click",
                "uuid": customerUUID,
                "value": {
                    "context": {
                        "page": {
                            locale_country: rfkCountry,
                            locale_language: rfkLanguage,
                            locale_currency: rfkCurrency
                        }
                    },
                    "rfkid": response.rfkId,
                    "click_type": "product",
                    "f": "sp",
                    "index": response.index,
                    "products": [
                        {
                            "sku": response.skus
                        }
                    ]
                }
            }]);
        });
        
        $('body').on('widget:appear', function(e, data) {
            var rfk = window.rfk || [];
            var f = '';
            if (data.fType === 'fullSearchPage') {
                f = 'sp';
            } else if(data.fType === 'recommendation'){
                f = 'rw';
            } else if(data.fType === 'previewSearch') {
                f = 'sb';
            }
            rfk.push(["trackEvent", {
                "type": "widget",
                "name": "appear",
                "uuid": customerUUID,
                "value": {
                    "context": {
                        "page": {
                            locale_country: rfkCountry,
                            locale_language: rfkLanguage,
                            locale_currency: rfkCurrency
                        }
                    },
                    "rfkid": data.rfkId,
                    "f": f
                }
            }]);
        });

        $('body').on('widget:click', function(e, data) {
            var rfk = window.rfk || [];
            if (data.eventType) {
                var skus = [];
                if (data.skus.length > 0) {
                    for (var i = 0; i < data.skus.length-1; i+=1) {
                        var obj = {};
                        obj['sku'] = data.skus[i];
                        skus.push(obj)
                    }
                    var obj = {};
                    obj['sku'] = data.skus[i];
                    skus.push(obj)
                }
                rfk.push(["trackEvent", {
                    "type": "widget",
                    "name": "click",
                    "uuid": customerUUID,
                    "value": {
                      "context": {
                        "page": {
                            locale_country: rfkCountry,
                            locale_language: rfkLanguage,
                            locale_currency: rfkCurrency
                        }
                      },
                      "rfkid": data.rfkId,
                      "f": "sp",
                      "kw": data.eventType,
                      "m": data.modSearchTerm,
                      "click_type": "product",
                      "index": data.index,
                      "products": 
                        skus
                    }
                }]);
            } else {
                rfk.push(["trackEvent", {
                    "type": "widget",
                    "name": "click",
                    "uuid": customerUUID,
                    "value": {
                        "context": {
                            "page": {
                                locale_country: rfkCountry,
                                locale_language: rfkLanguage,
                                locale_currency: rfkCurrency
                            }
                        },
                        "rfkid": data.rfkId,
                        "click_type": "product",
                        "f": "rw",
                        "index": data.index,
                        "products": [
                            {
                                "sku": data.skus
                            }
                        ]
                    }
                }]);
            }
        });

        $(document).on('click', '.swiper-wrapper-reflection .product', function (e) {
            var $this = $(e.target);
            var sku = $($this).parents('.product').attr('data-pid');
            var index = $($this).parents('.ctnr-product-item').attr('data-index');
            var rfkId = $($this).parents('.relfection-carousel-container').attr('data-rfkidEvent');
            $('body').trigger('widget:click', {
                eventType: null,
                rfkId: rfkId,
                skus: sku,
                index: index
            });
        });

        $(document).on('click', '.listofcategories a', function (e) {
            var $this = $(e.target);
            var title = $('.popular-title').html();
            var text = $($this).text();
            var rfkid = $('.search-field-reflektion').attr('data-rfkidevent');
            var searchFieldValue = $('.search-field-reflektion').val();
            var index = $(this).attr('data-index');
            $('body').trigger('previewSearchWidget:click',
            {
                title: title,
                rfkid: rfkid,
                text: text,
                index: index,
                filedVal: searchFieldValue,
                autoComplete: text
            });
        });

        $(document).on('click', '.productTileTemplates .product', function (e) {
            var $this = $(e.target);
            var sku = $($this).parents('.ctnr-product-item').attr('data-pid');
            var index = $($this).parents('.ctnr-product-item').attr('data-index');
            var rfkId = rfkId ? rfkId : JSON.parse(window.plpFiltersRequestData).data.widget.rfkid;
            var searchPhrase = $('#qName').val() ? $('#qName').val() : $('#cgidName').val();
            if (searchPhrase) {
                $('body').trigger('searchProductWidget:click', {
                    rfkId: rfkId,
                    skus: sku,
                    index: index
                });
            }
        });

        $(document).on('click', '.trending-items-list .trending-item a', function (e) {
            var $this = $(e.currentTarget);
            var sku = $($this).attr('data-pid');
            var index = $($this).attr('data-index');
            var rfkId = $('.search-field-reflektion').attr('data-rfkidEvent');
            var text = $('.trending-title').attr('data-searchData');
            var autocomplete = $('.trending-title').attr('data-autocomplete');
            var searchFieldValue = $('.search-field-reflektion').val();
            var title = $('.popular-title').html();
            $('body').trigger('previewSearchProductWidget:click', {
                title: title,
                rfkid: rfkId,
                sku: sku,
                index: index,
                text: text,
                autocomplete: autocomplete,
                filedVal: searchFieldValue
            });
        });
    },

    widgetEventOnPageLoad: function () {
        var eventType = $('#qName').val() ? $('#qName').val() : $('#cgidName').val();
        var rfkId = window.plpFiltersRequestData && JSON.parse(window.plpFiltersRequestData) ? JSON.parse(window.plpFiltersRequestData).data.widget.rfkid : null;
        if (eventType && rfkId) {
            var skus = [];
            var products = window.rfkPLPSearchResults.content.product.value;
            products.filter(function (product) {
                skus.push(product.sku)
            });
            $('body').trigger('widget:appear', {
                fType: 'fullSearchPage', 
                rfkId: rfkId
            });
        }
    }
}