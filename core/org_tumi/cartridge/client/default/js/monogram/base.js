'use strict';

function nextPrevCommon(divId, btn, inputEle) {
    if ($('form.monogram-form:visible').find('.monogram_' + divId).is(':visible')) {
        var currEle = $('form.monogram-form:visible').find('.monogram_' + divId + ' ' + btn);
        if (!$('form.monogram-form:visible').find('.monogram_' + divId + ' ' + inputEle).is(':checked')) {
            currEle.addClass('disabled');
        } else {
            currEle.removeClass('disabled');
        }
    }
}

function nextPrevStatus() {
    if ($('form.monogram-form:visible').find('.monogram_1').is(':visible')) {
        var flag = true;
        var currEle = $('form.monogram-form:visible').find('.monogram-step-button-next');
        $('form.monogram-form:visible').find('form.monogram-form .monogram-input').map(function (index, list) {
            if (list.value !== '') {
                flag = false;
                return;
            }
        });

        if (flag) {
            currEle.addClass('disabled');
        } else {
            currEle.removeClass('disabled');
        }
    }

    nextPrevCommon('2', '.monogram-step-button-next', '[name="fontStyle"]');
    nextPrevCommon('3', '.monogram-step-button-next', '[name="fontColor"]');
    nextPrevCommon('4', '.monogram-step-button-apply', '[name="location"]');
}

function handleNext() {
    $('body').on('click', 'form a.monogram-step-button-next', function (e) {
        if ($(this).closest('.monogram-modal').find(".monogram-content .personalization-monogram-preview:visible").next().length != 0) {
            if ($(this).closest('.personalization-monogram-preview').is('.monogram_1') && !$(this).closest('.personalization-monogram-preview').find('input.monogram-input').filter((index, item) => !!$(item).val() && !$(item).hasClass('symbol')).length) {
                $(this).closest('.monogram-modal').find(".monogram-content .personalization-monogram-preview:visible").next().addClass('active').prev().removeClass('active');
            }
            $(this).closest('.monogram-modal').find(".monogram-content .personalization-monogram-preview:visible").next().addClass('active').prev().removeClass('active');
        } else {
            $(this).closest('.monogram-modal').find(".monogram-content .personalization-monogram-preview:visible").removeClass('active');
            $(this).closest('.monogram-modal').find(".monogram-content .personalization-monogram-preview:first").addClass('active');
        }
        nextPrevStatus($(this));
        return false;
    });
}

function openMonogramItem() {
    $('body').on('click', 'div.monogram-wrapper', function (e) {
        var target = $(e.target);
        if (target.hasClass('edit-monogram') || target.hasClass('remove-monogram') || target.hasClass('add-monogram-modal')) return;
        var wrapper = $(this).closest('div.monogram-item');
        if (wrapper.hasClass('edit-monogram')) wrapper.find('a.edit-monogram').trigger('click');
        if (wrapper.hasClass('add-monogram')) wrapper.find('a.add-monogram-modal').trigger('click');
    });
}

function addMonogramModalEvent() {
    $('body').on('click', 'div.monogram-item.add-monogram .add-monogram-modal', function () {
        if ($($(this).data('target')).find('.monogram-option-selection .item').length === 1) {
            $($(this).data('target')).find('.monogram-option-selection .item').find('a').trigger('click');
        }
    });
}

module.exports = function () {
    handleNext();
    openMonogramItem();
    addMonogramModalEvent();
};