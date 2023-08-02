'use strict';

var settingOption = ['overview','address','payment','shoppingPreferences','communicationPreference','myMonogram']

function hideOtherContent(currentSelection) {
    $(settingOption).each(function () {
        if(this != currentSelection) {
            $('#setting-'+ this).addClass('d-none');
            $('#setting-'+ this + '-left').removeClass('my-settings-active');
        } else {
            $('#setting-'+ this).removeClass('d-none');
            $('#setting-'+ this + '-left').addClass('my-settings-active');
        }
    });
}
var targets = $('.my-settings-container');
function getAddressData() {
    var url = $('#setting-address-left').data('url');
    $(targets).spinner().start();
    $.ajax({
        url: url,
        method: 'GET',
        success: function (data) {
            if(typeof data === 'object' && !data.isError) {
                hideOtherContent('address');
                $('#setting-address').html(data.returnHTML)
            } else if($('.my-settings-wrapper[data-home-page]').length > 0){
                location.href = $('.my-settings-wrapper[data-home-page]').data('home-page');
            }
            $.spinner().stop();
        },
        error: function (err) {
            $.spinner().stop();
            console.log(err);
        }
    });
}

function getOverviewData() {
    hideOtherContent('overview');
}

function getPaymentData() {
    var url = $('#setting-payment-left').data('url');
    $(targets).spinner().start();
    $.ajax({
        url: url,
        method: 'GET',
        success: function (data) {
            if(typeof data === 'object' && !data.isError) {
                hideOtherContent('payment');
                $('#setting-payment').html(data.returnHTML)
            } else if($('.my-settings-wrapper[data-home-page]').length > 0){
                location.href = $('.my-settings-wrapper[data-home-page]').data('home-page');
            }
            $.spinner().stop();
        },
        error: function (err) {
            $.spinner().stop();
            console.log(err);
        }
    });
}

function getShoppingPreferencesData() {
    var url = $('#setting-shoppingPreferences-left').data('url');
    $(targets).spinner().start();
    $.ajax({
        url: url,
        method: 'GET',
        success: function (data) {
            if(typeof data === 'object' && !data.isError) {
                hideOtherContent('shoppingPreferences');
                $('#setting-shoppingPreferences').html(data.returnHTML)
            } else if($('.my-settings-wrapper[data-home-page]').length > 0){
                location.href = $('.my-settings-wrapper[data-home-page]').data('home-page');
            }
            $.spinner().stop();
        },
        error: function (err) {
            $.spinner().stop();
            console.log(err);
        }
    });
}

function getCommunicationPreferenceData() {
    var url = $('#setting-communicationPreference-left').data('url');
    $(targets).spinner().start();
    $.ajax({
        url: url,
        method: 'GET',
        success: function (data) {
            if(typeof data === 'object' && !data.isError) {
                hideOtherContent('communicationPreference');
                $('#setting-communicationPreference').html(data.returnHTML)
            } else if($('.my-settings-wrapper[data-home-page]').length > 0){
                location.href = $('.my-settings-wrapper[data-home-page]').data('home-page');
            }
            $.spinner().stop();
        },
        error: function (err) {
            $.spinner().stop();
            console.log(err);
        }
    });
}

function getmyMonogramData() {
    var url = $('#setting-myMonogram-left').data('url');
    $(targets).spinner().start();
    $.ajax({
        url: url,
        method: 'GET',
        success: function (data) {
            if(typeof data === 'object' && !data.isError) {
                hideOtherContent('myMonogram');
                $('#setting-myMonogram').html(data.returnHTML);
                $('body').trigger('myMonogram:GetCreatedMonogram',{});
            } else if($('.my-settings-wrapper[data-home-page]').length > 0){
                location.href = $('.my-settings-wrapper[data-home-page]').data('home-page');
            }
            $.spinner().stop();
        },
        error: function (err) {
            $.spinner().stop();
            console.log(err);
        }
    });
}

function getTabQueryString() {
    const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(prop),
      });
    return params.tab
}

function setTabQueryStringValue(tabName) {
    var urlString = $('#setting-overview-left').attr('data-url');
    var pageURL = window.location.href;
    var reloadPage;
    if ((pageURL.indexOf('?tab=') === -1) && (pageURL !== urlString)) {
        reloadPage = true;
    }
    if(getTabQueryString()) {
        urlString = urlString.split("?")[0] + '?tab='+ tabName
    } else {
        urlString = urlString + '?tab='+ tabName
    }
    window.history.pushState({},'', urlString);
    if (reloadPage === true) {location.reload()}
}

$('body').on('address:GetaddressData', function () {
    getAddressData();
})

$('body').on('paymentInstrument:refreshData', function () {
    getPaymentData();
})

module.exports = {
    init: function (){
        $(document).on('click', 
            '#setting-address-left, #setting-overview-left, #setting-payment-left, #setting-shoppingPreferences-left, #setting-communicationPreference-left,#setting-myMonogram-left',
            function () {
                var tabname = $(this).data('tabname');
                setTabQueryStringValue(tabname);
                switch (tabname) {
                    case 'overview':
                        $('.my-account-heading').text("Overview");
                        getOverviewData();
                        break;
                    case 'address':
                        $('.my-account-heading').text("Address Book");
                        getAddressData();
                        break;
                    case 'payment':
                        $('.my-account-heading').text("Saved Payments");
                        getPaymentData();
                        break;
                    case 'shoppingPreferences':
                        $('.my-account-heading').text("Shopping Preferences");
                        getShoppingPreferencesData();
                        break;
                    case 'communicationPreference':
                        $('.my-account-heading').text("Communication Preferences");
                        getCommunicationPreferenceData();
                        break;
                    case 'myMonogram':
                        $('.my-account-heading').text("My Monogram");
                        getmyMonogramData();
                        break;
                    default:
                        break;
                    }
        });

        function getCurrentUrl(params) {
            var currentUrl = window.location.href;
            if (!currentUrl.split('?tab=')[1]) {
                $('#setting-overview').removeClass('d-none');
            }
        }
        getCurrentUrl();

    },
    selectTab: function () {
        var tabValue = getTabQueryString();
        if(tabValue) {
            $('#setting-'+ tabValue +'-left').trigger('click');
        }
    }
};