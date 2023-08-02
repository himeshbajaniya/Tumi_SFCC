'use strict';

var File = require('dw/io/File');
var emarsysHelper = new (require('int_emarsys/cartridge/scripts/helpers/emarsysHelper'))();
var io = require('dw/io');
var Currency = require('dw/util/Currency');
var Variant = require('dw/catalog/Variant');
var ArrayList = require('dw/util/ArrayList');

var currentSite = require('dw/system/Site').getCurrent();


/**
 * @description Check and set locale
 * @param {string} siteLocale string
 * @param {string} defaultLocale string
 * @return {void}
 */
function setLocale(siteLocale, defaultLocale) {
    return siteLocale === 'default' ? request.setLocale(defaultLocale) : request.setLocale(siteLocale);
}

/**
 * @description Get URL image
 * @param {Object} productInfo - Object to add data to
 * @param {Object} product - Specific product
 * @return {void}
 */
function handleProductImage(productInfo, product) {
    var viewType = currentSite.getCustomPreferenceValue('emarsysProductImageSize');
    var productImage = product.getImage(viewType);
    var parsedImage = productImage !== null ? productImage.getAbsURL().toString() : '';

    productInfo.push(parsedImage);
}

/**
 * @description Get URL product
 * @param {Object} productInfo - Object to add data to
 * @param {Object} siteLocales locales
 * @param {string} defaultLocale default local
 * @param {Object} currenciesMap currencies map
 * @param {Object} product - Specific product
 * @return {void}
 */
function handleProductURL(productInfo, siteLocales, defaultLocale, currenciesMap, product) {
    var localeIndex = 0;
    for (; localeIndex < siteLocales.length; localeIndex++) {
        if (currenciesMap[siteLocales[localeIndex]]) {
            setLocale(siteLocales[localeIndex], defaultLocale);
            var url = emarsysHelper.returnProductURL(product);
            productInfo.push(url.toString());
        }
    }
    request.setLocale(defaultLocale);
}

/**
 * @description Set currency on the site
 * @param {Object} productInfo - Object to add data to
 * @param {Object} siteLocales site locales
 * @param {Object} currenciesMap currencis map
 * @param {Object} product product
 * @return {void}
 */
function handleProductPrice(productInfo, siteLocales, currenciesMap, product) {
    var localeIndex = 0;
    var defaultSiteCurrency = session.currency.currencyCode;
    var currency;
    for (; localeIndex < siteLocales.length; localeIndex++) {
        if (currenciesMap[siteLocales[localeIndex]]) {
            currency = Currency.getCurrency(currenciesMap[siteLocales[localeIndex]]);
            session.setCurrency(currency);

            var productPrice = product.getPriceModel().getMaxPrice();

            if (product instanceof Variant) {
                productPrice = product.getPriceModel().getPrice();
            }

            var priceValue = productPrice.getValueOrNull();

            if (!empty(priceValue)) {
                productInfo.push(priceValue.toFixed(2));
            } else {
                productInfo.push('');
            }

            currency = Currency.getCurrency(defaultSiteCurrency);
            session.setCurrency(currency);
        }
    }
}

/**
 * @description Get product name
 * @param {Object} productInfo - Object to add data to
 * @param {Object} siteLocales site locales
 * @param {string} defaultLocale default locale
 * @param {Object} currenciesMap currencies mao
 * @param {Object} product product
 * @return {void}
 */
function handleProductName(productInfo, siteLocales, defaultLocale, currenciesMap, product) {
    var localeIndex = 0;
    for (; localeIndex < siteLocales.length; localeIndex++) {
        if (currenciesMap[siteLocales[localeIndex]]) {
            setLocale(siteLocales[localeIndex], defaultLocale);
            productInfo.push(product.getName());
        }
    }
    request.setLocale(defaultLocale);
}

/**
 * @description Get product category
 * @param {Object} productInfo - Object to add data to
 * @param {Object} siteLocales site locales
 * @param {string} defaultLocale default locale
 * @param {Object} currenciesMap currencies map
 * @param {Object} product product
 * @return {void}
 */
function handleProductCategory(productInfo, siteLocales, defaultLocale, currenciesMap, product) {
    var localeIndex = 0;
    for (; localeIndex < siteLocales.length; localeIndex++) {
        if (currenciesMap[siteLocales[localeIndex]]) {
            setLocale(siteLocales[localeIndex], defaultLocale);
            var categories = product.getOnlineCategories().toArray();
            var path = new ArrayList();
            var pathsArray = new ArrayList();

            if (product instanceof Variant) {
                categories = product.masterProduct.getOnlineCategories().toArray();
            }
            var category;

            if (categories.length > 0) {
                for (var i = 0; i < categories.length; i++) {
                    category = categories[i];
                    path = new ArrayList();
                    // find the path for each of the categories
                    while (category.parent !== null) {
                        if (category.online) {
                            path.addAt(0, category.displayName);
                        }
                        category = category.parent;
                    }
                    pathsArray.push(path.join(' > '));
                }
                // push all the categories separated by |
                productInfo.push(pathsArray.join('|'));
            } else {
                productInfo.push('');
            }
        }
    }
    request.setLocale(defaultLocale);
}

/**
 * @description Get the display value of variation attribute
 * @param {*} productInfo - Object to add data to
 * @param {*} mappedField mapped field
 * @param {*} variationAttribute variation Attribute
 * @param {*} product product
 * @return {void}
 */
function handleProductCustomAttributes(productInfo, mappedField, variationAttribute, product) {
    var productVariationAttributes = currentSite.getCustomPreferenceValue('emarsysPredictVariationAttributes');
   // find the variation attributes from emarsysPredictVariationAttributes site preference
    if (productVariationAttributes.indexOf(mappedField.field) !== -1) {
        var selectedAttribute = product.variationModel.getProductVariationAttribute(variationAttribute);

        if (!empty(selectedAttribute)) {
            var selectedValue = product.variationModel.getSelectedValue(selectedAttribute);
            var variantValue = selectedValue.displayValue || selectedValue.value;
            productInfo.push(variantValue);
        } else {
            productInfo.push('');
        }
    }
}

/**
 * @description set value for group_id
 * @param {Object} productInfo - Object to add data to
 * @param {Object} product - Specific product
 * @return {void}
 */
function handleProductGroupId(productInfo, product) {
    var groupId = '';
    if (product.isVariant() || product.isVariationGroup()) {
        groupId = product.getVariationModel().getMaster().ID;
    } else {
        groupId = product.ID;
    }

    productInfo.push(groupId);
}
/**
 * @description set specific value for item
 * @param {Object} productInfo - Object to add data to
 * @param {Object} product - Specific product
 * @param {boolean} addSecondLine - Flag to mark additional line for simple product
 * @return {void}
 */
function handleProductId(productInfo, product, addSecondLine) {
    var item = product.ID;
    if (!addSecondLine && !product.isVariant()) {
        item = 'g/' + item;
    }
    productInfo.push(item);
}
/**
 * @description Auxiliary function to getProductInfo
 * @param {Object} productInfo - Object to add data to
 * @param {Object} data - Additional function arguments
 * @param {Array} mappedField - Field names list to retrieve property
 * @param {Object} product - Specific product
 * @param {boolean} addSecondLine - Flag to mark additional line for simple product
 * @return {Array} Product retrieved values
 */
function getProductInfo(productInfo, data, mappedField, product, addSecondLine) {
    var splitField = mappedField.field.split('.');
    var siteLocales = data.siteLocales;
    var defaultLocale = data.defaultLocale;
    var currenciesMap = data.currenciesMap;
    if (splitField[1] === 'url') {
        handleProductURL.call(this, productInfo, siteLocales, defaultLocale, currenciesMap, product);
    } else if (splitField[1] === 'image') {
        handleProductImage(productInfo, product);
    } else if (splitField[1] === 'price') {
        handleProductPrice(productInfo, siteLocales, currenciesMap, product);
    } else if (splitField[1] === 'availability') {
        productInfo.push(product.getAvailabilityModel().isOrderable());
    } else if (splitField[1] === 'name') {
        handleProductName(productInfo, siteLocales, defaultLocale, currenciesMap, product);
    } else if (splitField[1] === 'categories') {
        handleProductCategory(productInfo, siteLocales, defaultLocale, currenciesMap, product);
    // get the user friendly name of variation attribute
    } else if (product instanceof Variant && splitField[1] === 'custom') {
        handleProductCustomAttributes(productInfo, mappedField, splitField[2], product);
    } else if (splitField[1] === 'ID') {
        handleProductId(productInfo, product, addSecondLine);
    } else if (splitField[1] === 'group_id') {
        handleProductGroupId(productInfo, product);
    } else {
        productInfo.push(emarsysHelper.getObjectAttr({ product: product }, splitField));
    }

    return productInfo;
}
/**
 * @description maint function (constructor)
 */
function JobHelper() {
    /**
     * @description Loads files from a given directory that match the given pattern
     * Non recursive.
     * Throws Exception if directory does not exist.
     * @param {string} directoryPath (Absolute) Directory path to load from
     * @param {string} filePattern RegEx pattern that the filenames must match
     * @returns {Array} derectoryPathfiles
     */
    this.getFiles = function (directoryPath, filePattern) {
        var directory = new File(directoryPath);

        // We only want existing directories
        if (!directory.isDirectory()) {
            throw new Error('Source folder does not exist.');
        }

        var files = directory.list();

        return files.filter(function (filePath) {
            return empty(filePattern) || (!empty(filePattern) && filePath.match(filePattern) !== null);
        }).map(function (filePath) {
            return directoryPath + File.SEPARATOR + filePath;
        });
    };

    /**
     * @description Loads files from a given directory that match the given patternrecursive.
     * Throws Exception if directory does not exist.
     * @param {strict} currentSourceDirectory (Absolute) Directory path to load from
     * @param {string} filePattern RegEx pattern that the filenames must match
     * @param {string} sourceFolder source folder
     * @param {string} targetFolder target folder
     * @param {boolean} recursive recursive
     * @param {boolean} doOverwrite do overwrite
     * @param {boolean} getTargetFile get target file
     * @returns {Array} array
     */
    this.getFileListRecursive = function (currentSourceDirectory, filePattern, sourceFolder, targetFolder, recursive, doOverwrite, getTargetFile) {
        var regexp;
        var sourceDirectory = currentSourceDirectory;
        if (!empty(filePattern)) {
            regexp = new RegExp(filePattern);
        }

        var filteredList = [];
        var getFileList = function getFileList(currentFile) {
            var targetFile = null;
            if (getTargetFile) {
                targetFile = new File(currentFile.getFullPath().replace(sourceFolder, targetFolder));
                if (targetFile.exists() && !doOverwrite) {
                    throw new Error('OverWriteWithoutPermission');
                }
            } else {
                // remove source and IMPEX folder path :
                targetFile = currentFile.getFullPath().replace(sourceFolder, '').replace(File.IMPEX, '');
                if (!currentFile.isDirectory()) {
                    // this is to avoid targetfileName + targetfileName from upload behavior
                    targetFile = targetFile.replace(currentFile.getName(), '');
                }
                // add targetFolder
                targetFile = targetFolder + (targetFile.charAt(0).equals(File.SEPARATOR) ? targetFile.substring(1) : targetFile);
            }
            if (currentFile.isDirectory() && recursive) {
                filteredList.push({
                    name: currentFile.getName(),
                    sourceFile: currentFile,
                    targetFile: targetFile,
                    createDirectory: true
                });
                currentFile.listFiles(getFileList);
            } else if (empty(filePattern) || (!empty(filePattern) && regexp.test(currentFile.getName()))) {
                filteredList.push({
                    name: currentFile.getName(),
                    sourceFile: currentFile,
                    targetFile: targetFile,
                    createDirectory: false
                });
                return true;
            }
            return false;
        };

        if (sourceDirectory instanceof File) {
            sourceDirectory.listFiles(getFileList);
        } else {
            sourceDirectory = new File(sourceDirectory);
            if (!sourceDirectory.isDirectory()) {
                throw new Error('Source folder does not exist.');
            }
            sourceDirectory.listFiles(getFileList);
        }

        return filteredList;
    };

    /**
     * @description Returns the file name of the file from the file path.
     * @param {string} filePath A file path to extract the file name from, e.g. '/directory/file.xml'.
     * @returns {string} The file name e.g. 'file.xml'.
     */
    this.getFileName = function (filePath) {
        var filePathParts = filePath.split(File.SEPARATOR);
        return filePathParts[filePathParts.length - 1];
    };

    /**
     * @description Create the given {directoryPath} recursively if it does not exists
     * @param {string} directoryPath directory path
     * @returns {dw/io/File} The created directory instance
     */
    this.createDirectory = function (directoryPath) {
        var directory = new File(directoryPath);

        if (!directory.exists() && !directory.mkdirs()) {
            throw new Error('Cannot create the directory ' + directoryPath);
        }

        return directory;
    };

    /**
     * @description  Create SmartInsightFeed file csv
     * @param {string} destinationFolder destination folder
     * @return {io.File} new file
     */
    this.createSmartInsightExportFile = function (destinationFolder) {
        var siteID = currentSite.getID();
        var exportFolderPath = io.File.IMPEX + '/src/' + destinationFolder;
        var exportFolder = new io.File(exportFolderPath);

        if (!exportFolder.exists()) {
            exportFolder.mkdirs();
        }

        return new io.File(exportFolder.fullPath + io.File.SEPARATOR + 'sales_items_' + siteID + '.csv');
    };

    /**
     * @description  Create SmartInsightFeed name csv
     * @return {string} name
     */
    this.createSmartInsightFeedName = function () {
        var siteID = currentSite.ID;

        var name = 'sales_items_' + siteID + '.csv';
        return name;
    };

    /**
     * @description Replaces symbols
     * @param {Object} field field
     * @return {string} new field
     */
    this.escapeCSVField = function (field) {
        var newField = field ? field.toString().replace(/"/g, '""') : '';
        if (newField.search(',') !== -1) {
            newField = '"' + newField + '"';
        }
        return newField;
    };

    /**
     * @description Returns attributes from product object
     * @param {Object} productLineItem product line item
     * @param {Object} attributes attributes
     * @returns {Money|string} Value
     */
    this.getProductValues = function (productLineItem, attributes) {
        var product;
        try {
            product = productLineItem.product;
        } catch (e) {
            return '';
        }

        switch (attributes[0]) {
            /*
             Link to product in storefront
             */
            case 'url':
                return emarsysHelper.returnProductURL(productLineItem).toString();
            /*
             Product main image url
             */
            case 'image':
                var viewType = currentSite.getCustomPreferenceValue('emarsysProductImageSize');
                return productLineItem.product.getImage(viewType) !== null ? productLineItem.product.getImage(viewType).getAbsURL().toString() : '';
            /*
             Product rebate
             */
            case 'rebate':
                return emarsysHelper.returnProductRebate(productLineItem);
            /*
             Other product attributes
             */
            default:
                return emarsysHelper.getObjectAttr(product, attributes);
        }
    };

    /**
     * @description Returns attributes from ProductLineItem and GiftCertificateLineItem object types
     * @param {Object} lineItem  - object of type ProductLineItem or GiftCertificateLineItem
     * @param {Array} attributes attributes
     * @returns {Money|string} Value
     */
    this.getLineItemValues = function (lineItem, attributes) {
        return emarsysHelper.getObjectAttr(lineItem, attributes);
    };

    /**
     * @description Returns attributes from order object
     * @param {Object} order order
     * @param {Array} attributes attributes
     * @returns {Money|string} Value
     */
    this.getOrderValues = function (order, attributes) {
        switch (attributes[0]) {
            /*
            Order rebate
            Separate case for 'orderRebate' element only.
             */
            case 'orderRebate':
                return emarsysHelper.returnOrderRebate(order);
            /*
            List of payment methods
             */
            case 'paymentMethods':
                return this.returnOrderPaymentMethods(order);
            default:
                return emarsysHelper.getObjectAttr(order, attributes);
        }
    };

    /**
     * @description Returns string with order payment methods
     * @param {Object} order order
     * @returns {string} payment methods
     */
    this.returnOrderPaymentMethods = function (order) {
        var paymentMethods = [];
        order.getPaymentInstruments().toArray().forEach(function (paymentInstrument) {
            paymentMethods.push(paymentInstrument.getPaymentMethod());
        });
        return paymentMethods.join('+');
    };

    /**
     * @description Get product info
     * @param {Object} data - Object to retrieve data from
     * @param {boolean} addSecondLine - Flag to mark additional line for simple product
     * @returns {Array} Product data
     */
    this.getProductInfo = function (data, addSecondLine) {
        var dataObject = [];
        var mappedFields = data.mappedFields;
        var product = data.product;
        if (mappedFields && product) {
            var productInfo = [];

            for (var i = 0; i < mappedFields.length; i++) {
                var splitField = mappedFields[i].field.split('.');
                switch (splitField[0]) {
                    case 'product':
                        getProductInfo.call(this, productInfo, data, mappedFields[i], product, addSecondLine);
                        break;
                    default:
                        break;
                }
            }

            dataObject.push(productInfo);
        }
        return dataObject;
    };
}

module.exports = new JobHelper();
