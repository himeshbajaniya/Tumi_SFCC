'use strict';

var applePayDB = require('../product/applePayDisable');

function updatePremiumHeroImage(formData) {
    var mainImg = $('div.product-detail div.swiper-slide.active').find('img');
    if (mainImg.length > 0 && formData) {
        var monogramData = 'metalMonogramPatch' in formData ? formData.metalMonogramPatch : formData.metalMonogramTag;
        const mainTsrc = mainImg.attr('src').replace(/_main?/g, '_main_T?');
        const urlParams = new URLSearchParams(mainTsrc);
        urlParams.set('layer', '2');
        urlParams.set('src', 'is(Tumi/premiummonogram_template?scl=2)');
        urlParams.set('$text1', '');
        urlParams.set('$text2', '');
        urlParams.set('$text3', '');
        monogramData.monogramText.forEach((item, index) => urlParams.set('$text' + (index + 1), item.letter));
        urlParams.set('$metalmonogram_color', monogramData.fontColor.toLowerCase().replace(/\s/g, ''));
        mainImg.attr('src', decodeURIComponent(urlParams.toString()));
    }
}

function updateMonogramImage(context) {
    var imgSrc = $('.premium-patch').attr('src');
    var urlParamsPatch = new URLSearchParams(imgSrc);
    var wrapper = context.closest('form.premium-monogram-form');
    $.each(wrapper.find('input.monogram-input'), (index, item) => urlParamsPatch.set(`$text${index + 1}`, $(item).val().toUpperCase()));
    urlParamsPatch.set('$metalmonogram_color', $('.premium-color-attribute.selected').length > 0 ? $('.premium-color-attribute.selected').attr('title').toLowerCase().replace(/\s/g, '') : 'silver');
    var patchImg = decodeURIComponent(urlParamsPatch.toString());
    wrapper.find('.premium-patch').attr('src', patchImg);
    wrapper.find('.premium-tag').attr('src', patchImg.replace('_patch', '_tag'));
}

function handleResponse(context, data) {
    if (!data || !data.products || Object.keys(data.products).length === 0) return false;
    var wrapper = context.closest('form').find('.monogram-colors');
    wrapper.empty();
    $.each(Object.keys(data.products), (index, key) => {
        var mockdiv = context.closest('form').find('.monogram-colors-wrapper .mockup').clone();
        mockdiv.prop('title', key);
        mockdiv.find('div').css('background-image', `url(${data.products[key].swatch})`);
        mockdiv.removeClass('d-none mockup');
        var isAvailable = !(data.products[key].data.some(item => !item.available));
        isAvailable ? mockdiv.addClass('selectable') : mockdiv.attr('disabled', 'disabled');
        if (wrapper.data('style-id') === data.products[key].key) mockdiv.attr('selected', true);
        var arry = [];
        mockdiv.attr('data-btn-name', data.products[key].btnName);
        if (context.closest('form').find('.monogram_3').length) {
            mockdiv.attr('data-btn-namel2', data.products[key].btnNameL2);
            mockdiv.attr('data-btn-tag', data.products[key].tagPrice);
        }
        mockdiv.attr('data-premium-btn-name', data.products[key].premiumBtnName);
        mockdiv.attr('data-premium-tag-btn-name', data.products[key].premiumBtnTagName);
        mockdiv.attr('data-premium-tile-single', data.products[key].premiumTile);
        mockdiv.attr('data-premium-tile-both', data.products[key].premiumTileBoth);
        $.each(data.products[key].data, (index, item) => arry.push({
            letter: item.letter,
            qty: 1,
            ID: item.sku
        }));
        mockdiv.attr('data-premium-monogram', JSON.stringify({
            metalMonogram: {
                fontColor: key,
                monogramText: arry
            }
        }));
        if (context.closest('form').find('.monogram_3').length && $('input[name=premiumLocation][value=BOTH]').is(':checked')) {
            mockdiv.attr('data-btn-namel2', data.products[key].btnNameL2Both);
        }
        wrapper.append(mockdiv);
    });
    if (context.closest('form').find('.monogram_3').length) {
        context.closest('form').find('.monogram_2 .premium-monogram-step-button-apply').removeClass('premium-monogram-step-button-apply').addClass('premium-monogram-step-button-next');
    }
    if (data.resource && data.resource.btnName) context.closest('form').find('.premium-monogram-step-button-apply').text(data.resource.btnName);
    if (data.selectedColor) {
        context.closest('form.premium-monogram-form').find('button.selectable.premium-color-attribute:not(\'.mockup\')[title="' + data.selectedColor + '"]').trigger('click');
    } else {
        context.closest('form.premium-monogram-form').find('.premium-color-attribute.selectable:first').trigger('click');
    }
    return true;
}

function openModal() {
    $(document).on('click', '.premium-modal-btn', function (e) {
        e.preventDefault();
        var addBtn = $(this);
        var formItem = $(this).closest('.monogram-modal').find('.personalization-monogram-preview.active');
        if (addBtn) {
            $(this).closest('.monogram-modal').find('.monogram-option-selection').addClass('d-none');
            formItem.removeClass('active');
            $(this).closest('.monogram-modal').find('.initials').addClass('active');
            $(this).closest('.monogram-modal').find('.premium-monogram-form').removeClass('d-none').find('input').first().trigger('focus');
            if (!$(this).closest('form').find('a.monogram-step-button-next:visible').hasClass('disabled'))
                $('a.monogram-step-button-next:visible').addClass('disabled');
        }
    });
}

function onInitialChange() {

    $('body').on('input', 'form.premium-monogram-form .monogram-input', function (e) {
        var $this = $(e.target);
        $this.closest('.monogram-modal').find("form.premium-monogram-form .monogram-input").removeClass("selected");
        $this.addClass("selected");
        if ($(this).closest('div.monogram-initials').find('input.selected').next('input'))
            $(this).closest('div.monogram-initials').find('input.selected').next('input').focus();
        if (!$(this).closest('form').find('a.monogram-step-button-next:visible').hasClass('disabled'))
            $(this).closest('form').find('a.monogram-step-button-next:visible').addClass('disabled');
        updateMonogramImage($(this));
        var nonNullInput = $(this).closest('div.monogram-initials').find('input[name=\'monogramText\']').filter((index, item) => $.trim($(item).val()).length > 0);
        if (nonNullInput.length < 2) return;
        $(this).closest('form').find('a.monogram-step-button-next:visible').removeClass('disabled');
    }).on('keypress', 'form.premium-monogram-form .monogram-input', function (event) {
        var regex = new RegExp("[a-zA-Z]");
        var key = String.fromCharCode(!event.charCode ? event.which : event.charCode);
        if (!regex.test(key)) {
            event.preventDefault();
            return false;
        }
    }).on('change', 'form.premium-monogram-form .monogram-input', function () {
        var nonNullInput = $(this).closest('div.monogram-initials').find('input[name=\'monogramText\']').filter((index, item) => $.trim($(item).val()).length > 0);
        if (!$(this).closest('div.monogram-wrapper').find('.error-msg').hasClass('d-none'))
            $(this).closest('div.monogram-wrapper').find('.error-msg').addClass('d-none');
        if (nonNullInput.length < 2) {
            return;
        }
        var $this = $(this);
        $this.closest('form').find('a.monogram-step-button-next:visible').removeClass('disabled');
    });
}

function getRequestForswatches() {
    $('body').on('click', 'form.premium-monogram-form:visible .monogram-step-button-next', function () {
        if ($('form.premium-monogram-form:visible').find('.monogram_2').is(':visible')) {
            var premiumInput = $(this).closest('form.premium-monogram-form').find('.monogram-input');
            var form = premiumInput.closest('form.premium-monogram-form');
            var url = premiumInput.closest('div.monogram-wrapper').data('url');
            $(this).closest('.monogram-modal').find('.modal-body .premium-monogram-form .content.color-name').html('');
            var currentForm = $(this).closest('.premium-monogram-form');
            var styleID = currentForm.find('button.premium-color-attribute.selected').length > 0 ? currentForm.find('button.premium-color-attribute.selected').attr('title') : null;
            form.spinner().start();
            $.ajax({
                url: url,
                type: 'GET',
                data: form.find('div.monogram-initials input').serialize(),
                success: function (data) {
                    handleResponse(premiumInput, data);
                    if (styleID) currentForm.find('button.premium-color-attribute[title="'+styleID+'"]').trigger('click');
                    form.spinner().stop();
                },
                error: () => form.spinner().stop()
            });
        }
    });
}

function updatePremiumMonogramType(context, data) {
    if (context.closest('form').find('.monogram_3').length) {
        $('input[name=premiumLocation][type=radio][value=TAG]').attr('data-premium-monogram', JSON.stringify({
            metalMonogramTag: data
        })).attr('data-btn-name', context.attr('data-btn-name'));
        $('input[name=premiumLocation][type=radio][value=PATCH]').attr('data-premium-monogram', JSON.stringify({
            metalMonogramPatch: data
        })).attr('data-btn-name', context.attr('data-btn-name'));
        $('input[name=premiumLocation][type=radio][value=BOTH]').attr('data-premium-monogram', JSON.stringify({
            metalMonogramPatch: data,
            metalMonogramTag: data
        })).attr('data-btn-name', context.attr('data-btn-tag'));
        context.closest('form').find('input[name=premiumLocation]:checked').trigger('click');
    }
}

function onSwatchChanges() {
    $('body').on('click', '.premium-color-attribute.selectable', function (e) {
        e.preventDefault();
        $(this).closest('div').find('button.premium-color-attribute').removeClass('selected');
        $(this).addClass('selected');
        if ($(this).closest('div.monogram_2').find('.premium-monogram-step-button-apply').hasClass('disabled'))
            $(this).closest('div.monogram_2').find('.premium-monogram-step-button-apply').removeClass('disabled');
        var wrapper = $('.monogram-item');
        if ($(this).data('premium-monogram')) {
            var metalMonogram = $(this).data('premium-monogram').metalMonogram;
            var obj = null;
            if ($(this).closest('.monogram_2').is('.premium-tag')) {
                obj = {
                    metalMonogramTag: metalMonogram
                };
            }
            if ($(this).closest('.monogram_2').is('.premium-patch')) {
                obj = {
                    metalMonogramPatch: metalMonogram
                };
            }
            if (!obj) {
                obj = {
                    metalMonogramPatch: metalMonogram
                };
            }
            wrapper.attr('data-form', JSON.stringify(obj));
        }
        $(this).closest('form').find('.content.color-name').empty().html($(this).attr('title'));
        $(this).closest('form').find('.premium-monogram-step-button-apply').text($(this).attr('data-btn-name'));
        if ($(this).closest('form').find('.premium-monogram-step-button-next').length)
            $(this).closest('form').find('.premium-monogram-step-button-next').text($(this).attr('data-btn-namel2'));
        if ($(this).closest('form').find('.monogram_3').length) {
            $(this).closest('form').find('.premium-monogram-step-button-next.disabled').removeClass('disabled');
        }
        updatePremiumMonogramType($(this), $(this).data('premium-monogram').metalMonogram);
        updateMonogramImage($(this));
    });
}

function updatePremiumMonogram(data, callback) {
    var isCartPage = $('div.cart-page').length > 0;
    if (!isCartPage) {
        try {
            if (data.personalizationData) updatePremiumHeroImage(JSON.parse(data.personalizationData));
        } catch (e) {
            console.error(e);
        }
        callback(null);
    } else {
        var wrapper = $(data.context).closest('.premium-monogram-form');
        wrapper.spinner().start();
        $.ajax({
            url: data.url,
            type: 'POST',
            data: {
                uuid: data.uuid,
                personalizationData: data.personalizationData
            },
            success: function (response) {
                if (response.order) require('../components/coupon').updateCartTotals(response.order);
                wrapper.spinner().stop();
                callback(response);
            },
            error: () => $.spinner().stop()
        });
    }
}

function onPremiumMonogramApply() {
    $('body').on('click', 'a.premium-monogram-step-button-apply', function (e) {
        e.preventDefault();
        var uuid = $(this).data('uuid') || $(this).closest('.monogram-modal').data('uuid');
        var wrapper = $(`.monogram-item[data-uuid=${uuid}]`);
        var data = {
            context: $(this),
            url: $(this).attr('href'),
            uuid: uuid,
            personalizationData: $(this).is('.premium-monogram-step-button-apply') && $(this).closest('form').find('.monogram_3').length
                ? $('input[name=premiumLocation]:checked').attr('data-premium-monogram')
                : $(`div.monogram-item[data-uuid=${$(this).data('uuid')}]`).attr('data-form')
        };
        if ($(this).closest('form').find('.premium-color-attribute.selected').length > 0) {
            $(`div.monogram-item[data-uuid=${uuid}]`).find('.confirmmsg-premium').text($(this).closest('form').find('.premium-color-attribute.selected').data('premium-btn-name'));
            $(`div.monogram-item[data-uuid=${uuid}]`).find('.desc').text($(this).closest('form').find('.premium-color-attribute.selected').data('premium-tile-single'));
        }
        if ($('input[name=premiumLocation]:checked').length && $('input[name=premiumLocation]:checked').val() === 'BOTH') {
            $(`div.monogram-item[data-uuid=${uuid}]`).find('.confirmmsg-premium').text($(this).closest('form').find('.premium-color-attribute.selected').data('premium-tag-btn-name'));
            $(`div.monogram-item[data-uuid=${uuid}]`).find('.desc').text($(this).closest('form').find('.premium-color-attribute.selected').data('premium-tile-both'));
        }
        updatePremiumMonogram(data, (response) => {
            wrapper.removeClass('premium classic');
            if (wrapper.hasClass('add-monogram')) wrapper.removeClass('add-monogram');
            wrapper.addClass('edit-monogram premium');
            $(e.target).parents('.monogram-modal').modal('hide');
            var isCartPage = $('div.cart-page').length > 0;
            if (isCartPage) {
                var lineItem = wrapper.closest('.card.product-info');
                var isHome = lineItem.find('input.change-shipment:checked').is(lineItem.find('input.change-shipment:first'));
                if (!isHome) {
                    lineItem.find('input.change-shipment:first').trigger('click');
                }
            }
            // update icon
            var text = [];
            $.each($(this).closest('.monogram-modal').find('form.premium-monogram-form input.monogram-input'), (index, item) => text.push($(item).val().toUpperCase()));
            var icon = $(`div.monogram-item[data-uuid=${uuid}]`).find('.icon');
            icon.text(text.join(''));
            applePayDB.applePayDisableEnable(true);
            if (response && response.link && response.link.remove) $(`div.monogram-item[data-uuid=${uuid}]`).find('.remove-monogram').attr('href', response.link.remove);
        });
        $('.hiding-bopis').removeClass('hideBOPISonPremiumMono').addClass('hideBOPISonPremiumMono');
    });
}

function editPremiumMonogram() {
    $('body').on('click', 'div.monogram-item.premium a.edit-monogram', function (e) {
        e.preventDefault();
        var editModal = $(this).data('target');
        var optionSelection = $(editModal).find('.monogram-option-selection');

        var isEmptyInitials = $(editModal).find('form.premium-monogram-form input.monogram-input').find((index, item) => !!(item && item.value));

        if (!isEmptyInitials.length) {
            $($(editModal).find('form.premium-monogram-form input.monogram-input')[0]).trigger('input');
            $($(editModal).find('form.premium-monogram-form input.monogram-input')[0]).trigger('change');
            $(editModal).find('form.premium-monogram-form a.monogram-step-button-next').removeClass('disabled');
        }

        var formElement = $(editModal).find('form.premium-monogram-form input.monogram-input').first().closest('form.premium-monogram-form');
        var formItem = formElement.find('.personalization-monogram-preview');

        if ($(editModal)) {
            optionSelection.addClass('d-none');
            formElement.removeClass('d-none');
            if (formItem.hasClass('active')) {
                formItem.removeClass('active');
                formItem.first().addClass('active');
            }
        }
    });
}

function closeMonogramModal() {
    $('body').on('hidden.bs.modal', '.monogram-modal', function (e) {
        var optionSel = $('.monogram-option-selection');
        var formEle = $('.premium-monogram-form');
        optionSel.removeClass('d-none');
        formEle.addClass('d-none');
    });
}

function selectMonogramType() {
    $('body').on('click', '.monogram_3 [name="premiumLocation"]', function () {
        $(this).data('premium-monogram');
        var wrapper = $('.monogram-item');
        if ($(this).data('premium-monogram')) wrapper.attr('data-form', $(this).attr('data-premium-monogram'));
        $(this).closest('.monogram_3').find('.premium-monogram-step-button-apply.disabled').removeClass('disabled');
        $(this).closest('.monogram_3').find('.premium-monogram-step-button-apply').text($(this).attr('data-btn-name'));
    });
}

module.exports = {
    openModal: openModal,
    onInitialChange: onInitialChange,
    onSwatchChanges: onSwatchChanges,
    onPremiumMonogramApply: onPremiumMonogramApply,
    editPremiumMonogram: editPremiumMonogram,
    closeMonogramModal: closeMonogramModal,
    requestForswatches: getRequestForswatches,
    selectMonogramType: selectMonogramType
};