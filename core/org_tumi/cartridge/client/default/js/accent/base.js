'use strict';

function accentColorAttribute() {
    $(document).on('click', '.accents-button', function (e) {
        e.preventDefault();
        if ($(this).data('isaccentingsku')) {
            $('.wrap-items.accented-product button').removeClass('clicked selected');
            $(this).addClass('clicked selected');
            $('.selected-accent-option').empty().append($(this).attr('title'));
            let updatedPrice = $(this).data('accentprice');
            $('.selected-accent-price').empty().append('');
            $('.selected-accent-price').empty();
            var applyButton = $('.accent-step-button-next');
            var txt = applyButton.text().split('(')[0];
            if (updatedPrice) {
                applyButton.removeClass('disabled');
                txt = txt + '(+ ' + updatedPrice + ')';
            } else {
                $('.accent-item').addClass('d-block');
                $('.edit-block-accent').addClass('d-none');
                $('.add-block.add-accent').removeClass('d-none');
            }
            applyButton.empty().append(txt);
            $('img.accent-preview-img').attr('src', $(this).data('accentmainimage'));
        }
    });
}

function accentColorApply() {
    $(document).on('click', '.accent-step-button-next', function (e) {
        e.preventDefault();
        let url = $('.accents-button.clicked').data('url');
        var $productContainer = $(this).closest('.set-item');
        if (!$productContainer.length && $('.accents-button').hasClass('accents-button')) {
            $productContainer = $('.accent-item').closest('.product-detail');
        }
        require('../product/base').attributeSelect(url, $productContainer);
        var formEle = $('.accent-form-form');
        formEle.addClass('d-none');
        var accentModal = $(e.target).parents('.accent-modal');
        accentModal.modal('hide');
        $('.edit-block-accent').addClass('d-block');
        $('.add-accent').removeClass('d-block')
        $('.add-accent').addClass('d-none');
        $('.icon.accent-default').addClass('d-none');
        $('.icon.accent-added').removeClass('d-none');
        let currentPrice = $('.accents-button.clicked.selected').attr('data-accentprice');
        let currentColor = $('.accents-button.clicked.selected').attr('title');
        if (currentPrice) {
            $('.accent-item-wrapper.accent-item .title').empty().append('Accent Added');
            $('.accent-item-wrapper.accent-item .desc').empty().append(currentColor + ' (+' + currentPrice + ')');
        } else {
            $('.accent-item-wrapper.accent-item .title').empty().append('Accent');
            $('.accent-item-wrapper.accent-item .desc').empty().append('Descriptive Text');
            $('.icon.accent-default').removeClass('d-none');
            $('.icon.accent-added').addClass('d-none');
        }
    });
}

function openAccentModal() {
    $('body').on('click', '.monogram-wrapper.accent-item', function (e) {
        var target = $(e.target);
        if (target.hasClass('edit-accent-link') || target.hasClass('remove-accent-link') || target.hasClass('add-accent-link')) return;
        var wrapper = $(this).closest('div.accent-item');
        if (wrapper.find('.edit-accent-link').is(':visible')) wrapper.find('a.edit-accent-link').trigger('click');
        if (wrapper.find('.add-accent-link').is(':visible')) wrapper.find('a.add-accent-link').trigger('click');
    });
}

module.exports = function () {
    accentColorAttribute();
    accentColorApply();
    openAccentModal();
};