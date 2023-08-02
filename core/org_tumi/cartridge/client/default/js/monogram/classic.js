'use strict';

var applePayDB = require('../product/applePayDisable');

function resetMonogramImage(src) {
    var mainImg = $('div.product-detail div.swiper-slide.active').find('img');
    if (mainImg.length > 0) mainImg.attr('src', mainImg.data('src'));
}

function resetHeroImage() {
    var mainImg = $('div.product-detail div.swiper-slide.active').find('img');
    if (mainImg.length > 0) mainImg.attr('src', resetMonogramImage(mainImg.attr('src')));
}

function updateClassicHeroImage(formData) {
    var mainImg = $('div.product-detail div.swiper-slide.active').find('img');
    var monogramData = 'monogramPatch' in formData ? formData.monogramPatch : formData.monogramTag;
    if (mainImg.length > 0) {
        const mainTsrc = mainImg.attr('src').replace(/_main?/g, '_main_T?');
        const urlParams = new URLSearchParams(mainTsrc);
        urlParams.set('layer', '2');
        urlParams.set('src', 'is(Tumi/monogram_template_v2?scl=1.7)');

        var mText = monogramData.monogramText.split(' ');
        var text1 = mText[0],
            text2 = mText[1],
            text3 = mText[2];
        var font1 = (text1.length > 1) ? 'tumi_symbols' : monogramData.fontStyle;
        var font2 = (text2.length > 1) ? 'tumi_symbols' : monogramData.fontStyle;
        var font3 = (text3.length > 1) ? 'tumi_symbols' : monogramData.fontStyle;
        mText.forEach((item, index) => urlParams.set('$text' + (index + 1), item.replace(/[\(\)]/g, '')));
        urlParams.set('$monogramfonttext1', font1);
        urlParams.set('$monogramfonttext2', font2);
        urlParams.set('$monogramfonttext3', font3);
        urlParams.set('$monogramcolor', monogramData.fontColor.split('_').length > 1 ? monogramData.fontColor.split('_')[1] : 'FFFFFF');
        urlParams.set('$textureimage', 'smooth_texture');
        mainImg.attr('src', decodeURIComponent(urlParams.toString()));
    }
}

function getMonogramData() {
    var url = $('#pdpMonogramUrl').val();
    $.ajax({
        url: url,
        method: 'GET',
        success: function (data) {
            if (data.monogramdata) {
                $('.monogram-item').attr('data-mymonogram', data.monogramdata);
            } else {
                $('.monogram-item').attr('data-mymonogram', '');
            }
        }
    });
}

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

function switchPanel() {
    // $(".monogram-content .personalization-monogram-preview").each(function (e) {
    //     if (e != 0)
    //         $(this).removeClass('active');
    // });

    $('body').on('click', '.monogram_2 [name="fontStyle"], .monogram_3 [name="fontColor"], .monogram_4 [name="location"]', function () {
        nextPrevStatus();
    });


    $('body').on('click', '.monogram-step-button-prev', function () {
        if ($(this).closest('.monogram-modal').find(".monogram-content .personalization-monogram-preview:visible").prev().length != 0) {
            if ($(this).closest('form').is('.monogram-form') && $(this).closest('.personalization-monogram-preview').is('.monogram_3') && !$(this).closest('.personalization-monogram-preview').find('input.monogram-input').filter((index, item) => !!$(item).val() && !$(item).hasClass('symbol')).length) {
                $(this).closest('.monogram-modal').find(".monogram-content .personalization-monogram-preview:visible").prev().addClass('active').next().removeClass('active');
            }
            $(this).closest('.monogram-modal').find(".monogram-content .personalization-monogram-preview:visible").prev().addClass('active').next().removeClass('active');
        }
    });
}

function setFontStyle(imageUrl, inputValue, urlParams, noOfItems = 3) {
    let fontPrefix = `$monogramfonttext`;
    let newImagePath = imageUrl;
    for (let i = 1; i <= noOfItems; i++) {
        let inputQuery = `${fontPrefix}${i}`;
        let inputUrlParam = urlParams.get(inputQuery);
        let fontUrlParamValue = encodeURIComponent(inputUrlParam);
        if (fontUrlParamValue !== 'tumi_symbols') {
            newImagePath = replaceQueryParam(newImagePath, inputQuery, fontUrlParamValue, inputValue);
        }
    }
    return newImagePath;
}

/*
Param 

@Param 
inputValue = 'A';
querySelector = 'text';
inputOrder = 1;

replaceSelectedQueryInput('A','text',1);

replaceSelectedQueryInput(1,'symbol',1);
replaceSelectedQueryInput('#fff','color',1);
replaceSelectedQueryInput('Times%20New%20Roman%20Bold','font',null);
*/

function replaceSelectedQueryInput(inputValue, querySelector, inputOrder = null) {
    var previeMonogramPatchImage = $('form.monogram-form:visible').find('.classic-patch');
    var previeMonogramTagImage = $('form.monogram-form:visible').find('.classic-tag');
    const urlParams = new URLSearchParams($(previeMonogramPatchImage).attr('src'));
    let newImagePath = $(previeMonogramPatchImage).attr('src');
    let inputQuery;
    let selectedFont = 'Times%20New%20Roman%20Bold';
    if (querySelector === 'symbol') {
        selectedFont = 'tumi_symbols';
    }
    if (querySelector === 'text' || querySelector === 'symbol') {
        inputQuery = `$text${inputOrder}`;
        let inputUrlParam = urlParams.get(inputQuery);
        const fontTypeQuery = `$monogramfonttext${inputOrder}`;
        let fontUrlParamValue = urlParams.get(fontTypeQuery);
        fontUrlParamValue = encodeURIComponent(fontUrlParamValue);
        newImagePath = replaceQueryParam(newImagePath, inputQuery, inputUrlParam, inputValue);
        newImagePath = replaceQueryParam(newImagePath, fontTypeQuery, fontUrlParamValue, selectedFont);
    } else if (querySelector === 'color') {
        inputQuery = '$monogramcolor';
        let inputUrlParam = urlParams.get(inputQuery);
        inputValue = inputValue.indexOf('#') > -1 ? inputValue.slice(1) : inputValue;
        newImagePath = replaceQueryParam(newImagePath, inputQuery, inputUrlParam, inputValue);
    } else if (querySelector === 'font') {
        inputQuery = '$monogramcolor';
        newImagePath = setFontStyle(newImagePath, inputValue, urlParams);
    }

    previeMonogramTagImage.attr('src', newImagePath.replace('_patch', '_tag'));
    previeMonogramPatchImage.attr('src', newImagePath);

    var monogramText = '';
    $('form.monogram-form:visible .monogram-input').map(function (index, list) {
        if (list.className.indexOf('symbol') > -1) {
            monogramText += '(' + list.value + ') ';
        } else {
            monogramText += list.value + ' ';
        }
    });
    monogramText.toLocaleUpperCase();
    monogramText = monogramText.replace(/\(/g, '<span class="numberFormat">').replace(/\)/g, '</span>');
    $('form.monogram-form:visible').find('span.font_style_1,span.font_style_2').html(monogramText);
}

function handleMonogramButtonState(context) {
    var form = !context ? $("form.monogram-form") : context.closest("form.monogram-form");
    if (form.find(".monogram-input").length) {
        var nonEmptyInputs = form.find(".monogram-input").filter((index, item) => !!item.value);
        form.find('.monogram-step-button-next').addClass('disabled');
        if (nonEmptyInputs.length >= 1) form.find('.monogram-step-button-next').removeClass('disabled');;
    }
}

function replaceQueryParam(imageUrl, inputQuery, inputUrlParam, inputValue) {
    imageUrl = imageUrl ? imageUrl.replace(`${inputQuery}=${inputUrlParam}`, `${inputQuery}=${inputValue}`) : '';
    return imageUrl
}

function updateMonogramSymbol() {

    handleMonogramButtonState();

    $('body').on('change', '.personalization-monogram-symbols input', function (e) {
        let inputValue = $(this).val();
        let selectedInput = $(this).closest('form.monogram-form').find("input.monogram-input.selected");
        const inputOrder = selectedInput.data('inputOrder') ? selectedInput.data('inputOrder') : 1;
        selectedInput.val(inputValue).addClass('symbol').next('.monogram-input').focus();
        $(this).prop('checked', false);
        handleMonogramButtonState($(this));
        replaceSelectedQueryInput(inputValue, 'symbol', parseInt(inputOrder));
    });

    $('body').on('focus', 'form.monogram-form .monogram-input', function () {
        $(this).closest('.monogram-modal').find("form.monogram-form .monogram-input").removeClass("selected");
        $(this).addClass("selected");
    }).on("keypress", '.monogram-input', function (e) {
        $(this).val('');

        var regex = /[a-zA-Z0-9]+$/;
        var key = String.fromCharCode(!e.charCode ? e.which : e.charCode);

        if (!regex.test(key)) {
            e.preventDefault();
            return false;
        }

        return true;
    }).on("input", 'form.monogram-form .monogram-input', function (e) {
        e.preventDefault();
        var $this = $(e.target);
        var inputValue = $this.val() ? $this.val().toUpperCase() : '';
        $this.closest('.monogram-modal').find("form.monogram-form .monogram-input").removeClass("selected");
        $this.removeClass("symbol");
        $this.addClass("selected");
        const inputOrder = $this.data('inputOrder') ? $this.data('inputOrder') : 1;
        if ($this.val()) {
            $this.next('form.monogram-form .monogram-input').focus();
        }
        handleMonogramButtonState($(this));
        replaceSelectedQueryInput(inputValue, 'text', parseInt(inputOrder));
    });

    $('body').on("click", ".monogram-fonts input", function (e) {
        let inputValue = encodeURIComponent($(this).val());
        let fontInputValue = $(this).val();
        
        if (fontInputValue === "Times New Roman Bold"){
           $('.content.monogram-input-content').empty().html('Times: Classic & sophisticated.')
        }
        else {
            $('.content.monogram-input-content').empty().html('Futura: Clean & modern.')
        }
        $(this).prop('checked', true);
        handleMonogramButtonState();
        replaceSelectedQueryInput(inputValue, 'font');
    });

    $('body').on('click', '.monogram-fontColor input', function () {
        let inputValue = $(this).val();
        const splitValue = inputValue.split('_');
        let colorName = splitValue[0];
        let colorValue = splitValue[1];
        $('.monogram-modal .modal-body .content.color-name').empty().html(colorName);
        if (splitValue[0] === "Gold") {
            colorValue = "DAA520";
        } else if (splitValue[0] === "Blind") {
            colorValue = "010101";
        } else if (splitValue[0] === "Silver") {
            colorValue = "CCCCCC";
        }
        $(this).prop('checked', true);
        handleMonogramButtonState();
        replaceSelectedQueryInput(colorValue, 'color');
    });
}

function onUpdateCartProductCard() {
    $('body').on('monogram:cardupdate', function (e, data) {
        var formData = data.formData;
        var selectedTab = data.selectedTab;
        var productData = JSON.stringify(formData);
        var parseData = JSON.parse(productData);
        var addMonogram = $('.monogram-item');
        var monogramLabel = addMonogram.find('.icon');
        var monogramDesc = $('.monogram-item').find('.desc');
        var optionSelection = $('.monogram-option-selection');
        var formElement = $('.monogram-form');
        if (data.isCartPage) {
            var productCardDiv = $(`div.uuid-${data.uuid}`);
            addMonogram = $(productCardDiv).find('.monogram-item');
            monogramLabel = $(productCardDiv).find('div.monogram-item .icon');
            monogramDesc = $(productCardDiv).find('div.monogram-item .desc');
            optionSelection = $(`div#monogramModal-${data.uuid}`).find('.monogram-option-selection');
            formElement = $(`div#monogramModal-${data.uuid}`).find('.monogram-form');
        }
        monogramLabel.html(formData[selectedTab].monogramText.replace(/\(/g, '<span class="numberFormat">').replace(/\)/g, '</span>'));
        applePayDB.applePayDisableEnable(true);
        
        var colorName = formData[selectedTab].fontColor.split('_');
        var colorLabel = colorName[0];
        monogramDesc.html('Classic: ' + colorLabel);
        // var colorVal = '#' + colorName[1];
        // monogramLabel.css('color', colorVal);

        if (optionSelection.hasClass('d-none')) {
            optionSelection.removeClass('d-none');
            formElement.addClass('d-none');
        }

        addMonogram.removeClass('classic premium');
        if (addMonogram.hasClass('add-monogram')) {
            addMonogram.removeClass('add-monogram');
            addMonogram.addClass('edit-monogram classic');
        } else {
            addMonogram.addClass('edit-monogram classic');
        }
        addMonogram.attr('data-form', JSON.stringify(parseData));
    });
}

function monogramSubmit() {
    $(document).on('click', '.monogram-step-button-apply', function (e) {
        e.preventDefault();
        let formData = {};
        let monogramText = '';
        let monogramColor = '';
        let inputs = $(this).closest('.monogram-modal').find('.monogram-form').serializeArray();
        let selectedTab = '';

        $(this).closest('.monogram-modal').find('form.monogram-form .monogram-input').map(function (index, list) {
            if (list.className.indexOf('symbol') > -1) {
                monogramText += '(' + list.value + ') ';
            } else {
                monogramText += list.value + ' ';
            }
        });

        $.each(inputs, function (i, input) {
            if (input.name === 'fontColor') {
                var colorHex = input.value.split('#');
                colorHex = colorHex.join('');
                monogramColor += colorHex;
                formData['fontColor'] = monogramColor;
            } else {
                formData[input.name] = input.value;
            }
        });

        formData['monogramText'] = monogramText.toLocaleUpperCase();

        if (formData.location === 'classic-tag') {
            selectedTab = "monogramTag";
            var monogramTag = {
                "monogramTag": formData
            }
            formData = monogramTag;
        } else if (formData.location === 'classic-patch') {
            selectedTab = "monogramPatch";
            var monogramPatch = {
                "monogramPatch": formData
            }
            formData = monogramPatch;
        } else if (formData.location === 'classic-both') {
            selectedTab = "monogramPatch";
            var monogramBoth = {
                "monogramTag": formData,
                "monogramPatch": formData
            }
            formData = monogramBoth;
        }
        // sessionStorage.setItem('tumi_json', JSON.stringify(formData));
        var monogramModal = $(e.target).parents('.monogram-modal');
        var isCartPage = $('div.cart-page').length > 0;
        $('body').trigger('monogram:cardupdate', {
            uuid: $(this).data('uuid'),
            selectedTab: selectedTab,
            formData: formData,
            isCartPage: isCartPage
        });
        if (!isCartPage) updateClassicHeroImage(formData);
        if (isCartPage) {
            monogramModal.spinner().start();
            $('.if-no-premiummono').remove();
            var url = $(this).attr('href');
            var uuid = $(this).data('uuid');
            $.ajax({
                url: url,
                type: 'POST',
                data: {
                    uuid: uuid,
                    personalizationData: JSON.stringify(formData)
                },
                success: function () {
                    monogramModal.spinner().stop();
                    monogramModal.modal('hide');
                }
            });
        } else {
            monogramModal.modal('hide');
        }
        $('.monogram-modal .modal-body .content.color-name').html('');
    });

    var monogramImageUpdate = function (jsonData) {
        var currImgsrc = $('.classic-patch').attr('src');
        const urlParams = new URL(currImgsrc);
        var mText = jsonData.monogramText.split(' ');
        var text1 = mText[0],
            text2 = mText[1],
            text3 = mText[2];
        var font1 = (text1.length > 1) ? 'tumi_symbols' : jsonData.fontStyle;
        var font2 = (text2.length > 1) ? 'tumi_symbols' : jsonData.fontStyle;
        var font3 = (text3.length > 1) ? 'tumi_symbols' : jsonData.fontStyle;
        var color = jsonData.fontColor.split('_')[1];
        urlParams.searchParams.set('$text1', text1.replace(/[\(\)]/g, ''));
        urlParams.searchParams.set('$text2', text2.replace(/[\(\)]/g, ''));
        urlParams.searchParams.set('$text3', text3.replace(/[\(\)]/g, ''));
        urlParams.searchParams.set('$monogramfonttext1', font1);
        urlParams.searchParams.set('$monogramfonttext2', font2);
        urlParams.searchParams.set('$monogramfonttext3', font3);
        urlParams.searchParams.set('$monogramcolor', color);
        currImgsrc = decodeURIComponent(urlParams);

        var patctEle = $('.classic-patch');
        var tagEle = $('.classic-tag');
        if (currImgsrc !== '') {
            patctEle[0].src = currImgsrc;
            tagEle[0].src = currImgsrc.replace('_patch', '_tag');
        }
    }

    $(document).on('click', 'div.classic .edit-monogram', function (e) {
        e.preventDefault();
        var $this = $(this);
        var addBtn = $this.data('target');
        var editModal = $(addBtn);
        var optionSelection = editModal.find('.monogram-option-selection');

        var formElement = editModal.find('input.monogram-input').first().closest('form');
        var formItem = formElement.find('.personalization-monogram-preview');


        if (editModal) {
            optionSelection.addClass('d-none');
            formElement.removeClass('d-none');
            if (formItem.hasClass('active')) {
                formItem.removeClass('active');
                formItem.first().addClass('active');
                nextPrevStatus();
            }
        }

        // Edit data update function
        var editData = JSON.parse($this.closest('.monogram-item').attr('data-form'));
        editData = (editData.monogramPatch) ? editData.monogramPatch : editData.monogramTag;
        if (editData) {
            var initialsData = editData.monogramText.split(' ');
            $("form.monogram-form .monogram-input").map(function (i, elem) {
                if (initialsData[i] && initialsData[i].length > 1) {
                    elem.classList.add("symbol");
                    elem.value = initialsData[i].replace(/[\(\)]/g, '');
                } else if (initialsData[i]) {
                    elem.value = initialsData[i];
                }
            });
            monogramImageUpdate(editData);
            $('[name="fontStyle"][value="' + editData.fontStyle + '"]').trigger('click');
            $('[name="fontColor"][value="' + editData.fontColor + '"]').trigger('click');
            $('[name="fontColor"][value="' + editData.location + '"]').trigger('click');
        }
    });
}

function updateMonogramForm() {
    $(document).on('click', '.classic-modal-btn', function (e) {
        e.preventDefault();
        var addBtn = $(this);
        var formItem = $(this).closest('.monogram-modal').find('.personalization-monogram-preview.active');
        if (addBtn) {
            $(this).closest('.monogram-modal').find('.monogram-option-selection').addClass('d-none');
            formItem.removeClass('active');
            $(this).closest('.monogram-modal').find('.initials').addClass('active');
            $(this).closest('.monogram-modal').find('.monogram-form').removeClass('d-none').find('input').first().trigger('focus');
            let classicFormEle = $(this).closest('.monogram-modal').find('.monogram-form');
            $(classicFormEle.find('[name="fontStyle"]')[0]).trigger('click');
            $(classicFormEle.find('[name="fontColor"]')[0]).trigger('click');
            $(classicFormEle.find('[name="location"]')[0]).trigger('click');
            nextPrevStatus();
            var uuid = $(this).closest('.monogram-modal').data('uuid');
            let parsedData = $('.monogram-item[data-uuid="' + uuid + '"]').data('mymonogram');
            if (parsedData) {
                let initialsData = parsedData.monogramText.split(" ");
                $(this).closest('.monogram-modal').find("form.monogram-form .monogram-input").map(function (i, elem) {
                    if (initialsData[i].length > 1) {
                        elem.classList.add("symbol");
                        elem.value = initialsData[i].replace(/[\(\)]/g, "");
                    } else {
                        elem.value = initialsData[i];
                    }
                });

                $(this).closest('.monogram-modal').find(".monogram-preview-img").attr("src", parsedData.imageSrc);
                $(this).closest('.monogram-modal').find(
                    '[name="fontStyle"][value="' + parsedData.fontStyle + '"]'
                ).click();
                $(this).closest('.monogram-modal').find(
                    '[name="fontColor"][value="' + parsedData.fontColor + '"]'
                ).click();
                formItem.removeClass('active');
                $(this).closest('.monogram-modal').find('.monogram-content .selection-style').addClass('active');
            }
        }
    });
}

function removeMonogram() {
    var imgSrc = $('.monogram-preview-img.classic-patch').attr('src');
    var imgSrc2 = $('.monogram-preview-img.classic-tag').attr('src');
    var addMonogram = $('.monogram-item');
    var monogramLabel = $('.icon');
    var monogramDesc = addMonogram.find('.desc');
    var monogramDescText = addMonogram.find('.desc').attr('data-description');
    var formElement = $('.monogram-form');
    var formPremiumElement = $('.premium-monogram-form');

    $('body').on('click', '.remove-monogram', function (e) {
        e.preventDefault();
        $('.product-info ').removeClass('show-store-error-msg');
        $('.hiding-bopis').removeClass('hideBOPISonPremiumMono');
        var isCartPage = $('div.cart-page').length > 0;
        var uuid = $(this).data('uuid');
        let imgSrcEle = $(`div#monogramModal-${uuid} .monogram-form`).find('.monogram-preview-img.classic-patch');
        let imgSrcEle2 = $(`div#monogramModal-${uuid} .monogram-form`).find('.monogram-preview-img.classic-tag');
        if (isCartPage) {
            imgSrc = imgSrcEle.attr('src');
            imgSrc2 = imgSrcEle2.attr('src');
            addMonogram = $(`div.uuid-${uuid}`).find('.monogram-item');
            monogramLabel = $(`div.uuid-${uuid}`).find('.monogram-item .icon');
            monogramDesc = $(`div.uuid-${uuid}`).find('.desc');
            formElement = $(`div#monogramModal-${uuid} .monogram-form`);
        }
        if (addMonogram.hasClass('edit-monogram')) {
            addMonogram.removeClass('edit-monogram');
            addMonogram.addClass('add-monogram');
        } else {
            addMonogram.addClass('add-monogram');
        }
        addMonogram.removeAttr('data-form');
        monogramLabel.html('ABC');
        monogramLabel.css('color', '#1b1c1e');
        monogramDesc.html(monogramDescText);
        formElement[0].reset();
        formPremiumElement[0].reset();
        applePayDB.applePayDisableEnable(false);

        // Reset Patch Image
        imgSrc = resetMonogramImage(imgSrc);

        // Reset tag Image
        imgSrc2 = resetMonogramImage(imgSrc2);

        resetHeroImage();

        if (isCartPage) {
            imgSrcEle.attr('src', imgSrc);
            imgSrcEle2.attr('src', imgSrc2);
        } else {
            $('.monogram-preview-img.classic-patch').attr('src', imgSrc);
            $('.monogram-preview-img.classic-tag').attr('src', imgSrc2);
        }

        if (isCartPage) {
            $.spinner().start();
            var url = $(this).attr('href');
            var uuid = $(this).data('uuid');
            $.ajax({
                url: url,
                type: 'POST',
                data: {
                    uuid: uuid
                },
                success: function (response) {
                    if (response.order) require('../components/coupon').updateCartTotals(response.order);
                    $(`div#monogramModal-${uuid}`).find('input.monogram-input').val('');
                    $(`div#monogramModal-${uuid}`).find('input:checked').removeAttr('checked');
                    $.spinner().stop();
                }
            });
        }
    });
}

function closeMonogramModal() {
    $('body').on('hidden.bs.modal', '.monogram-modal', function () {
        var optionSel = $('.monogram-option-selection');
        var formEle = $('.monogram-form');
        optionSel.removeClass('d-none');
        formEle.addClass('d-none');
        if ($(this).attr('id') && $(this).attr('id').split('-').length && $(this).attr('id').split('-')[1]) {
            var wrapper = $(`div.monogram-item[data-uuid=${$(this).attr('id').split('-')[1]}]`);
            if (wrapper.is('.add-monogram')) {
                $(this).find('form input.monogram-input').val('');
                $(this).find('form input[type=\'radio\']').prop('checked', false);
                // clear image patch
                var urlParamsPatch = new URLSearchParams($(this).find('.classic-patch').attr('src'));
                urlParamsPatch.set('$text1', '');
                urlParamsPatch.set('$text2', '');
                urlParamsPatch.set('$text3', '');
                urlParamsPatch.set('$monogramfonttext1', '');
                urlParamsPatch.set('$monogramfonttext2', '');
                urlParamsPatch.set('$monogramfonttext3', '');
                urlParamsPatch.set('$monogramcolor', 'FFFFFF');
                $(this).find('.classic-patch').attr('src', decodeURIComponent(urlParamsPatch.toString()));

                var urlParamsPatchPremium = new URLSearchParams($(this).find('.premium-patch').attr('src'));
                urlParamsPatchPremium.set('$text1', '');
                urlParamsPatchPremium.set('$text2', '');
                urlParamsPatchPremium.set('$text3', '');
                urlParamsPatchPremium.set('$metalmonogram_color', 'silver');
                $(this).find('.premium-patch').attr('src', decodeURIComponent(urlParamsPatchPremium.toString()));
                $('.premium-color-attribute.selected').removeClass('selected');
                // clear image tag
                var urlParamsTag = new URLSearchParams($(this).find('.classic-tag').attr('src'));
                urlParamsTag.set('$text1', '');
                urlParamsTag.set('$text2', '');
                urlParamsTag.set('$text3', '');
                urlParamsPatch.set('$monogramfonttext1', '');
                urlParamsPatch.set('$monogramfonttext2', '');
                urlParamsPatch.set('$monogramfonttext3', '');
                urlParamsPatch.set('$monogramcolor', 'FFFFFF');
                $(this).find('.classic-tag').attr('src', decodeURIComponent(urlParamsTag.toString()));
            }
        }
    });
}

function nextPremiumMonogramStep() {
    $('body').on('click', '.premium-monogram-step-button-next', function (e) {
        e.preventDefault();
        if ($(this).closest('form').find('div.monogram_3').length) {
            $(this).closest('form').find('div.monogram_2.active').removeClass('active');
            if (!$(this).closest('form').find('div.monogram_3').hasClass('active')) $(this).closest('form').find('div.monogram_3').addClass('active');
        }
    });
}

module.exports = {
    nextPrevStatus: nextPrevStatus,
    switchPanel: switchPanel,
    updateMonogramSymbol: updateMonogramSymbol,
    updateMonogramForm: updateMonogramForm,
    monogramSubmit: monogramSubmit,
    closeMonogramModal: closeMonogramModal,
    removeMonogram: removeMonogram,
    getMonogramData: getMonogramData,
    onUpdateCartProductCard: onUpdateCartProductCard,
    nextPremiumMonogramStep: nextPremiumMonogramStep
};