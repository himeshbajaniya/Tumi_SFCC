'use strict';

/**
 * Creates the breadcrumbs object
 * @param {string} cgid - category ID from navigation and search
 * @param {Array} breadcrumbs - array of breadcrumbs object
 * @returns {Array} an array of breadcrumb objects
 */
 function getAllBreadcrumbsforPLP(cgid, breadcrumbs) {
    var URLUtils = require('dw/web/URLUtils');
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var category;

    if (cgid) {
        category = CatalogMgr.getCategory(cgid);
    }

    if (category) {
        breadcrumbs.push({
            htmlValue: category.displayName,
            url: URLUtils.url('Search-Show', 'cgid', category.ID)
        });

        if (category.parent && category.parent.ID !== 'root') {
            return getAllBreadcrumbsforPLP(category.parent.ID, breadcrumbs);
        }
        if (category.parent.ID === 'root') {
            breadcrumbs.push({
                htmlValue: URLUtils.absStatic('/images/home-icon.svg'),
                url: URLUtils.url('Home-Show')
            });
        }
    }

    return breadcrumbs;
}
module.exports = {
    getAllBreadcrumbsforPLP: getAllBreadcrumbsforPLP
};
