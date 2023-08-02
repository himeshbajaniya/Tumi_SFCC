"use strict";

module.exports = {
    getDeviceType: function() {
        const ua = navigator.userAgent;
        const ele = document.querySelector('html').classList;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            ele.add('d-tablet');
        } else if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            ele.add('d-mobile');
        } else {
            ele.add('d-desktop');
        }
    }
};
