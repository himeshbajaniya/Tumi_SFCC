'use strict';

var teasersModules = require('./teaser/teasersModules');

/* Javascript to load on page load */
$(document).ready(function () {
    // PDP teasers only
    if ($('span.productsku').text().length) {
        teasersModules.loadTeaserCounts($('span.productsku').text());
    }
    // if ($('span.product-id').text().length) {
    //     teasersModules.loadTeaserCounts($('span.productsku').text());
    // }
});
