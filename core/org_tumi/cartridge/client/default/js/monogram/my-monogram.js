"use strict";

function nextPrevCommon(divId, btn, inputEle) {
    if ($("#monogram_" + divId).is(":visible")) {
        var currEle = $("#monogram_" + divId + " " + btn);
        if (!$("#monogram_" + divId + " " + inputEle).is(":checked")) {
            currEle.addClass("disabled");
        } else {
            currEle.removeClass("disabled");
        }
    }
}

function nextPrevStatus() {
    if ($("#monogram_1").is(":visible")) {
        var flag = true;
        var currEle = $("#monogram_1 .monogram-step-button-next");
        $(".monogram-input").map(function (index, list) {
            if (list.value !== "") {
                flag = false;
                return;
            }
        });

        if (flag) {
            currEle.addClass("disabled");
        } else {
            currEle.removeClass("disabled");
        }
    }

    nextPrevCommon("2", ".monogram-step-button-next", '[name="fontStyle"]');
    nextPrevCommon("3", ".monogram-step-button-next", '[name="fontColor"]');
    nextPrevCommon("4", ".monogram-step-button-apply", '[name="location"]');
}

function switchPanel() {
    $(".monogram-content .personalization-monogram-preview").each(function (e) {
        if (e != 0) $(this).removeClass("active");
    });

    $(document).on("click",'#monogram_2 [name="fontStyle"], #monogram_3 [name="fontColor"], #monogram_4 [name="location"]', function () {
            nextPrevStatus();
        }
    );

    $(document).on("click",".monogram-step-button-next", function () {
        if ($(".monogram-content .personalization-monogram-preview:visible").next().length != 0) {
            $(".monogram-content .personalization-monogram-preview:visible")
            .next()
            .addClass("active")
            .prev()
            .removeClass("active");
        } else {
            $(".monogram-content .personalization-monogram-preview:visible").removeClass("active");
            $(".monogram-content .personalization-monogram-preview:first").addClass("active");
        }
        nextPrevStatus();
        return false;
    });

    $(document).on("click",".monogram-step-button-prev", function () {
        if ($(".monogram-content .personalization-monogram-preview:visible").prev().length != 0) {
            $(".monogram-content .personalization-monogram-preview:visible")
            .prev()
            .addClass("active")
            .next()
            .removeClass("active");
        } else {
            $(".monogram-content .personalization-monogram-preview:visible").removeClass("active");
            $(".monogram-content .personalization-monogram-preview:last").addClass("active");
        }
        return false;
    });
}

function setFontStyle(imageUrl, inputValue, urlParams, noOfItems = 3) {
    let fontPrefix = `$monogramfonttext`;
    let newImagePath = imageUrl;
    for (let i = 1; i <= noOfItems; i++) {
        let inputQuery = `${fontPrefix}${i}`;
        let inputUrlParam = urlParams.get(inputQuery);
        let fontUrlParamValue = encodeURIComponent(inputUrlParam);
        if (fontUrlParamValue !== "tumi_symbols") {
            newImagePath = replaceQueryParam(
                newImagePath,
                inputQuery,
                fontUrlParamValue,
                inputValue
            );
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

function replaceSelectedQueryInput(
    inputValue,
    querySelector,
    inputOrder = null
) {
    var previeMonogramPatchImage = document.querySelector(".classic-patch");
    var previeMonogramTagImage = document.querySelector(".classic-tag");
    const urlParams = new URLSearchParams(previeMonogramPatchImage.src);
    let newImagePath = previeMonogramPatchImage.src;
    let inputQuery;
    let selectedFont = "Times%20New%20Roman%20Bold";
    if (querySelector === "symbol") {
        selectedFont = "tumi_symbols";
    }
    if (querySelector === "text" || querySelector === "symbol") {
        inputQuery = `$text${inputOrder}`;
        let inputUrlParam = urlParams.get(inputQuery);
        const fontTypeQuery = `$monogramfonttext${inputOrder}`;
        let fontUrlParamValue = urlParams.get(fontTypeQuery);
        fontUrlParamValue = encodeURIComponent(fontUrlParamValue);
        newImagePath = replaceQueryParam(
            newImagePath,
            inputQuery,
            inputUrlParam,
            inputValue
        );
        newImagePath = replaceQueryParam(
            newImagePath,
            fontTypeQuery,
            fontUrlParamValue,
            selectedFont
        );
    } else if (querySelector === "color") {
        inputQuery = "$monogramcolor";
        let inputUrlParam = urlParams.get(inputQuery);
        inputValue =
            inputValue.indexOf("#") > -1 ? inputValue.slice(1) : inputValue;
        newImagePath = replaceQueryParam(
            newImagePath,
            inputQuery,
            inputUrlParam,
            inputValue
        );
    } else if (querySelector === "font") {
        inputQuery = "$monogramcolor";
        newImagePath = setFontStyle(newImagePath, inputValue, urlParams);
    }

    //previeMonogramTagImage.src = newImagePath.replace('new_patch_T','new_tag_T');
    previeMonogramPatchImage.src = newImagePath;

    var monogramText = "";
    $("#monogram-form .monogram-input").map(function (index, list) {
        if (list.className.indexOf("symbol") > -1) {
            monogramText += "(" + list.value + ") ";
        } else {
            monogramText += list.value + " ";
        }
    });
    monogramText.toLocaleUpperCase();
    monogramText = monogramText
        .replace(/\(/g, '<span class="numberFormat">')
        .replace(/\)/g, "</span>");
    $("span.font_style_1,span.font_style_2").html(monogramText);
}

function handleMonogramButtonState() {
    var enableNextButton = true;
    var buttonElement = $("#monogram_1 .monogram-step-button-next");
    if ($(".monogram-input").length) {
        $(".monogram-input").each(function (element) {
            if (!$(this).val()) {
                enableNextButton = false;
            }
        });
        enableNextButton = enableNextButton
            ? buttonElement.removeClass("disabled")
            : buttonElement.addClass("disabled");
    }
}

function replaceQueryParam(imageUrl, inputQuery, inputUrlParam, inputValue) {
    imageUrl = imageUrl.replace(
        `${inputQuery}=${inputUrlParam}`,
        `${inputQuery}=${inputValue}`
    );
    return imageUrl;
}

function updateMonogramSymbol() {
    handleMonogramButtonState();

    $(document).on("change",".personalization-monogram-symbols input", function () {
        let inputValue = $(this).val();
        let selectedInput = $("input.monogram-input.selected");
        const inputOrder = selectedInput.data("inputOrder")
            ? selectedInput.data("inputOrder")
            : 1;
        selectedInput
            .val(inputValue)
            .addClass("symbol")
            .next(".monogram-input")
            .focus();
        $(this).prop("checked", false);
        handleMonogramButtonState();
        replaceSelectedQueryInput(inputValue, "symbol", parseInt(inputOrder));
    });
    $(document)
        .on("focus", ".monogram-input", function () {
            $(".monogram-input").removeClass("selected");
            $(this).addClass("selected");
        })
        .on("keydown",".monogram-input", function (e) {
            $(this).val("");
        })
        .on("keypress",".monogram-input",function(e) {
            var regex = /[a-zA-Z0-9]+$/;
            var key = String.fromCharCode(!e.charCode ? e.which : e.charCode);

        if (!regex.test(key)) {
            e.preventDefault();
            return false;
        }
        })
        .on("keyup", ".monogram-input",function (e) {
            e.preventDefault();
            var $this = $(e.target);
            var inputValue = $(this).val() ? $(this).val().toUpperCase() : "";
            $(".monogram-input").removeClass("selected");
            $this.removeClass("symbol");
            $(this).addClass("selected");
            const inputOrder = $this.data("inputOrder")
                ? $this.data("inputOrder")
                : 1;
            if ($(this).val()) {
                $this.next(".monogram-input").focus();
            }
            handleMonogramButtonState();
            replaceSelectedQueryInput(inputValue, "text", parseInt(inputOrder));
        });

    $(document)
        .off("click",".monogram-fonts input")
        .on("click",".monogram-fonts input", function () {
            let inputValue = encodeURIComponent($(this).val());
            let fontInputValue = $(this).val();
        
            if (fontInputValue === "Times New Roman Bold"){
               $('.content.my-monogram-input-content').empty().html($('#timesClassicSophisticated').val());
            }
            else {
                $('.content.my-monogram-input-content').empty().html($('#futuraCleanModern').val());
            }
            $(this).prop("checked", true);
            handleMonogramButtonState();
            replaceSelectedQueryInput(inputValue, "font");
        });

    $(document)
        .off("click",".monogram-fontColor input")
        .on("click", ".monogram-fontColor input", function () {
            let inputValue = $(this).val();
            const splitValue = inputValue.split("_");
            let colorName = splitValue[0];
            let colorValue = splitValue[1];
            $('.monogram-modal .modal-body .content.color-name').html(colorName);
            if (splitValue[0] === "Gold") {
                colorValue = "DAA520";
            } else if (splitValue[0] === "Blind") {
                colorValue = "010101";
            } else if (splitValue[0] === "Silver") {
                colorValue = "CCCCCC";
            }
            $(this).prop("checked", true);
            handleMonogramButtonState();
            replaceSelectedQueryInput(colorValue, "color");
        });
}

function monogramSubmit() {
    $(document).on("click", ".monogram-step-button-apply", function (e) {
        $(".monogram-wrapper").addClass("d-block");
        $(".add-block").removeClass("d-block");
        $(".add-block").addClass("d-none");
        $(".no-monogram").removeClass("d-block");
        $(".no-monogram").addClass("d-none");
        $('.my-monogram-update').removeClass('edit-block');

        $(".created-wrapper-monogram").removeClass("d-none");
        $(".created-wrapper-monogram").addClass("d-block");

        e.preventDefault();
        let formData = {};
        let monogramText = "";
        let monogramColor = "";
        let inputs = $("#monogram-form").serializeArray();
        let selectedTab = "";

        $("#monogram-form .monogram-input").map(function (index, list) {
            if (list.className.indexOf("symbol") > -1) {
                monogramText += "(" + list.value + ") ";
            } else {
                monogramText += list.value + " ";
            }
        });

        $.each(inputs, function (i, input) {
            if (input.name === "fontColor") {
                var colorHex = input.value.split("#");
                colorHex = colorHex.join("");
                monogramColor += colorHex;
                formData["fontColor"] = monogramColor;
            } else {
                formData[input.name] = input.value;
            }
        });

        formData["monogramText"] = monogramText.toLocaleUpperCase();

        if (formData.location === "TAG") {
            selectedTab = "monogramTag";
            var monogramTag = {
                monogramTag: formData,
            };
            formData = monogramTag;
        } else if (formData.location === "PATCH") {
            selectedTab = "monogramPatch";
            var monogramPatch = {
                monogramPatch: formData,
            };
            formData = monogramPatch;
        } else if (formData.location === "BOTH") {
            selectedTab = "monogramPatch";
            var monogramBoth = {
                monogramTag: formData,
                monogramPatch: formData,
            };
            formData = monogramBoth;
        }

        formData.imageSrc = document.querySelector(
            ".monogram-preview-img"
        ).attributes.src.value;
        var productData = JSON.stringify(formData);
        var today = new Date();
        var currentDate = today.getFullYear() + ',' + (today.getMonth() + 1) + ','+ today.getDate();
        const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        let name = month[today.getMonth()];
        var date = name + ' ' + today.getDate() + ', ' + today.getFullYear();
        var parseData = JSON.parse(productData);
        var addMonogram = document.querySelector(".my-monogram-item");
        var monogramLabel = document.querySelector(".icon");
        var monogramModal = $(e.target).parents(".monogram-modal");
        var optionSelection = $(".monogram-option-selection");
        var formElement = $(".monogram-form");
        
        var texxtData = formData.monogramText;
        $('.created-date-monogram').html('Created on ' + date);
        monogramLabel.src = parseData.imageSrc;
        var colorName = formData.fontColor.split("_");
        var colorVal = "#" + colorName[1];
        monogramLabel.style.color = colorVal;

        if (optionSelection.hasClass("d-none")) {
            optionSelection.removeClass("d-none");
            formElement.addClass("d-none");
        }

        if (addMonogram.classList.contains("add-monogram")) {
            addMonogram.classList.remove("add-monogram");
            addMonogram.classList.add("edit-monogram");
        } else {
            addMonogram.classList.add("edit-monogram");
        }
        formElement.removeClass("d-none");
        addMonogram.setAttribute("data-form", JSON.stringify(parseData));
        var url = $(this).attr('href');
        $.ajax({
            url: url,
            type: 'POST',
            data: { monogramdata: productData, date: date },
            success: function () {
                monogramModal.spinner().stop();
                monogramModal.modal('hide');
            }
        });
    });

    $(document).on("click", ".edit-monogram", function (e) {
        e.preventDefault();
        var addBtn = $(this);
        var optionSelection = $(".monogram-option-selection");
        var formItem = $(".personalization-monogram-preview");
        var formElement = $(".monogram-form");
        if (addBtn) {
            optionSelection.addClass("d-none");
            formElement.removeClass("d-none");
            if (formItem.hasClass("active")) {
                formItem.removeClass("active");
                formItem.first().addClass("active");
            }
        }
        /* if (!isCartPage) {
            var editData = addBtn.closest('.monogram-item').data('form');
        } */
    });
}

function updateMonogramForm() {
    $(document).on("click", ".classic-modal-btn", function (e) {
        e.preventDefault();
        var addBtn = $(this);
        var formItem = $(".personalization-monogram-preview");
        if (addBtn) {
            $(".monogram-option-selection").addClass("d-none");
            formItem.removeClass("active");
            $(".initials").addClass("active");
            $(".monogram-form")
                .removeClass("d-none")
                .find("input")
                .first()
                .trigger("focus");
            nextPrevStatus();
        }
        var url = $(this).attr('href');
        $.ajax({
            url: url,
            type: 'POST',
            data: { monogramdata: productData },
            success: function () {
                monogramModal.spinner().stop();
                monogramModal.modal('hide');
            }
        });
    });
}

function removeMonogram() {
    $(document).on("click",".remove-monogram", function (e) {
        e.preventDefault();
        var imgSrc = $(".monogram-preview-img.classic-patch").attr("src");
        var addMonogram = document.querySelector(".my-monogram-item");
        var monogramLabel = document.querySelector(".icon");
        var formElement = $(".monogram-form");
        $(".my-monogram-wrapper").removeClass("d-block");
        $(".my-monogram-wrapper").addClass("d-none");
        $("#monogram_3").removeClass("active");
        $("#monogram_1").addClass("active");

        $(".add-block").removeClass("d-none");
        $(".add-block").addClass("d-block");

        $(".created-wrapper-monogram").removeClass("d-block");
        $(".created-wrapper-monogram").addClass("d-none");

        $(".no-monogram").removeClass("d-none");
        $(".no-monogram").addClass("d-block");

        if (addMonogram.classList.contains("edit-monogram")) {
            addMonogram.classList.remove("edit-monogram");
            addMonogram.classList.add("add-monogram");
        } else {
            addMonogram.classList.add("add-monogram");
        }
        addMonogram.removeAttribute("data-form");
        monogramLabel.innerHTML = "ABC";
        monogramLabel.style.color = "#1b1c1e";
        formElement[0].reset();
        $(".monogram-preview-img.classic-patch").attr("src", imgSrc);

        var url = $(this).data('url');
        $.ajax({
            url: url,
            type: 'POST',
            data: {},
            success: function () {
                $.spinner().stop();
                //location.reload();
            },
        });
    });
}

function closeMonogramModal() {
    $(".monogram-modal").on("hidden.bs.modal", function () {
        var optionSel = $(".monogram-option-selection");
        var formEle = $(".monogram-form");
        optionSel.removeClass("d-none");
        //$('[data-input-order="1"]').val('').trigger('keyup');
        //formEle.addClass('d-none');

        /* var imgSrc = $('monogram-preview-img.classic-patch').attr('src');
        var imgSrc2 = $('monogram-preview-img.classic-tag').attr('src');
        if (optionSel.hasClass('d-none')) {
            optionSel.removeClass('d-none');
            optionSel.addClass('d-none');
            if ($('.personalization-monogram-preview').hasClass('active')) {
                $('.personalization-monogram-preview').removeClass('active')
                $('.personalization-monogram-preview').first().addClass('active');
            }
            $('.monogram-preview-img.classic-patch').attr('src', imgSrc);
            $('.monogram-preview-img.classic-ptag').attr('src', imgSrc2);
        } */
    });
}

function showCreatedMonogram() {
    var url = $('#monogramUrl').val();
    $.ajax({
        url: url,
        method: 'GET',
        success: function (data) {
            if (data.monogramdata) {
                let parsedData = JSON.parse(data.monogramdata);
                $('.created-date-monogram').html('Created on ' + data.monogramCreationDate);
                document.querySelector(".icon").src = parsedData.imageSrc;
                $(".monogram-wrapper").addClass("d-block");
                $(".add-block").removeClass("d-block");
                $(".add-block").addClass("d-none");
                $(".no-monogram").removeClass("d-block");
                $(".no-monogram").addClass("d-none");

                $(".created-wrapper-monogram").removeClass("d-none");
                $(".created-wrapper-monogram").addClass("d-block");

                $(document).on("click", ".edit-monogram", function (e) {
                    e.preventDefault();
                    let parsedData = JSON.parse(data.monogramdata);
                    let initialsData = parsedData.monogramText.split(" ");
                    if (data.monogramdata) {
                        $(".monogram-input").map(function (i, elem) {
                            if (initialsData[i].length > 1) {
                                elem.classList.add("symbol");
                                elem.value = initialsData[i].replace(/[\(\)]/g, "");
                            } else {
                                elem.value = initialsData[i];
                            }
                        });

                        $(".monogram-preview-img").attr("src", parsedData.imageSrc);
                        $(
                            '[name="fontStyle"][value="' + parsedData.fontStyle + '"]'
                        ).click();
                        $(
                            '[name="fontColor"][value="' + parsedData.fontColor + '"]'
                        ).click();
                    }

                    var addBtn = $(this);
                    var optionSelection = $(".monogram-option-selection");
                    var formElement = $(".monogram-form");
                    var formItem = $(".personalization-monogram-preview");
                    if (addBtn) {
                        optionSelection.addClass("d-none");
                        formElement.removeClass("d-none");
                        if (formItem.hasClass("active")) {
                            formItem.removeClass("active");
                            formItem.first().addClass("active");
                        }
                        $(".monogram-modal").on("shown.bs.modal", function () {
                            e.preventDefault();
                            var $symbolVal = $(".monogram-input.symbol").val()
                                ? $(".monogram-input.symbol").val()
                                : "";
                            $symbolVal = $symbolVal.replace(/[()]/g, "");
                            $(".monogram-input.symbol").val($symbolVal);
                        });
                    }
                });
            }
        },
    });
}

$('body').on('myMonogram:GetCreatedMonogram', function (e, data) {
    showCreatedMonogram();
})

module.exports = {
    nextPrevStatus: nextPrevStatus,
    switchPanel: switchPanel,
    updateMonogramSymbol: updateMonogramSymbol,
    updateMonogramForm: updateMonogramForm,
    monogramSubmit: monogramSubmit,
    closeMonogramModal: closeMonogramModal,
    removeMonogram: removeMonogram,
    showCreatedMonogram: showCreatedMonogram,
};
