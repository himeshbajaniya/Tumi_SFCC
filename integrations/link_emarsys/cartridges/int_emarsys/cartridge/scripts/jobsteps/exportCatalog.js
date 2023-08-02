'use strict';
/**
 * @description Script for retrieving, exporting and remote uploading the Catalog data
 * @output ErrorMsg : String
 */

var CatalogMgr = require('dw/catalog/CatalogMgr');
var CSVStreamWriter = require('dw/io/CSVStreamWriter');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var Site = require('dw/system/Site');
var Status = require('dw/system/Status');
var ProductMgr = require('dw/catalog/ProductMgr');

var EmarsysProductFeed = {
    needExportData: false,

    /** @type {dw.system.Log} */
    logger: require('dw/system/Logger').getLogger('ProductFeedJob', 'ProductFeedJob'),

    /**
     * @description retrieve, export and remote upload the Catalog data
     * @param {Object} args args
     * @returns {dw.system.Status} - return status 'Ok' or 'Error'
     */
    execute: function (args) {
        try {
            this.currentSite = Site.getCurrent();

            var siteCatalog = CatalogMgr.getSiteCatalog();

            this.prepareProductsData(siteCatalog);
            this.prepareWorkspace(args.exportFolderName);
            this.prepareCsvStreamWriter(args);
            this.processProducts();
            this.cleanUp();
        } catch (err) {
            this.logger.error('[Emarsys ExportCatalog.js] - ***EmarsysProductFeed error message: ' + err.message + '\n' + err.stack);

            return new Status(Status.ERROR, 'ERROR');
        }

        return new Status(Status.OK, 'OK');
    },

    /**
     * @description Prepare products data
     * @param {string} siteCatalog - name current catalog
     * @returns {void}
     */
    prepareProductsData: function (siteCatalog) {
        this.products = ProductMgr.queryProductsInCatalog(siteCatalog);
        this.needExportData = this.products.hasNext();
    },

    /**
     * @description prepare workspase
     * @param {string} TargetFolder - name current folder
     * @returns {void}
     */
    prepareWorkspace: function (TargetFolder) {
        this.folderPath = this.getTargetFolderPath(TargetFolder);
        var folder = new File(this.folderPath);
        if (!folder.exists()) {
            folder.mkdirs();
        }

        var files = folder.listFiles().iterator();

        while (files.hasNext()) {
            var file = files.next();

            if (file.isFile()) {
                file.remove();
            }
        }
    },

    /**
     * @description create and write csv header
     * @param {Object} args args
     * @returns {void} write column names
     */
    prepareCsvStreamWriter: function (args) {
        if (!this.needExportData) {
            return;
        }

        var catalogConfigKey = args.catalogConfigKey;
        this.predictConfig = CustomObjectMgr.getCustomObject('EmarsysCatalogConfig', catalogConfigKey);
        this.siteLocales = this.currentSite.getAllowedLocales();
        this.defaultLocale = this.currentSite.getDefaultLocale();
        this.currenciesMap = JSON.parse(this.currentSite.getCustomPreferenceValue('emarsysPredictLocCurMap'));

        this.file = this.getFile(args);
        this.csvStreamWriter = new CSVStreamWriter(new FileWriter(this.file, 'UTF-8'), ',', '"');

        this.mappedFields = JSON.parse(this.predictConfig.custom.mappedFields);
        var columnNames = [];
        this.mappedFields.forEach(function (key) {
            if (key.placeholder.indexOf('_multilang') > 0) {
                for (var i = 0; i < this.siteLocales.length; i++) {
                    if (this.currenciesMap[this.siteLocales[i]]) {
                        if (this.siteLocales[i] !== 'default') {
                            if (this.siteLocales[i] === this.defaultLocale) {
                                columnNames.push(key.placeholder.replace('_multilang', ''));
                            } else {
                                columnNames.push(key.placeholder.replace('multilang', this.siteLocales[i]));
                            }
                        } else {
                            columnNames.push(key.placeholder.replace('_multilang', ''));
                        }
                    }
                }
            } else {
                columnNames.push(key.placeholder);
            }
        }, this);

        this.csvStreamWriter.writeNext(columnNames);
    },

    /**
     * @description Process product and write to csv file
     * @returns {void} write product info
     */
    processProducts: function () {
        if (!this.needExportData) {
            return;
        }

        var jobHelper = require('int_emarsys/cartridge/scripts/helpers/jobHelper');
        /**
         * @description writes one line to CSV
         * @param {*} val current element
         * @returns {void}
         */
        function writeLine(val) {
            this.csvStreamWriter.writeNext(val);
        }

        while (this.products.hasNext()) {
            var product = this.products.next();
            var exportType = this.predictConfig.custom.exportType;

            if ((exportType === 'master' && product.isMaster()) || exportType === 'variations') {
                var data = {
                    mappedFields: this.mappedFields,
                    siteLocales: this.siteLocales,
                    defaultLocale: this.defaultLocale,
                    currenciesMap: this.currenciesMap,
                    product: product
                };
                var productInfo = [];

                productInfo = jobHelper.getProductInfo(data, false);
                productInfo.forEach(writeLine, this);

                if (!(product.isMaster() || product.isVariant())) {
                    productInfo = jobHelper.getProductInfo(data, true);
                    productInfo.forEach(writeLine, this);
                }
            }
        }
    },

    /**
     * @description Clear resources
     * @returns {void} close products and csvStreamWriter
     */
    cleanUp: function () {
        if (this.products) {
            this.products.close();
        }

        if (this.csvStreamWriter) {
            this.csvStreamWriter.close();
        }
    },

    /**
     * @description Returns folder path
     * @param {string} TargetFolder - name folder
     * @returns {string} returns path
     */
    getTargetFolderPath: function (TargetFolder) {
        return [File.IMPEX, 'src', TargetFolder].join(File.SEPARATOR);
    },

    /**
     * @description returns File
     * @param {Object} args args
     * @returns {dw.io.File} returns name file
     */
    getFile: function (args) {
        var fileName = args.exportFileName;
        if (!fileName) {
            var siteID = this.currentSite.getID();
            fileName = 'products_' + siteID;
        }
        return new File([this.folderPath, fileName + '.csv'].join(File.SEPARATOR));
    }
};

exports.execute = EmarsysProductFeed.execute.bind(EmarsysProductFeed);
