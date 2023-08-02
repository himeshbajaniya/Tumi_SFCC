var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');
var Logger = require('dw/system/Logger');

/**
 * 
 * @function
 * @name publishCustomSitemap
 * @desc adds custom sitemap to SFCC sitemap
 */
function publishCustomSitemap(file) {
    var SitemapMgr = require('dw/sitemap/SitemapMgr');
    var Site = require('dw/system/Site');
    var hostname = Site.current.getHttpsHostName();
    SitemapMgr.addCustomSitemapFile(hostname, file);
}

/**
 * 
 * @function
 * @name createFile
 * @desc creates Custom sitemap file
 * @returns {Object} File
 */
function createFile(){
    var path = [File.IMPEX, 'src', 'sitemap'].join(File.SEPARATOR);
    var folder = new File(path);
    if(!folder.exists()){
        folder.mkdirs();
    }
    var sitemap = new File(folder, 'products_sitemap_0.xml');
    return sitemap;
    
}

/**
 * 
 * @function
 * @name openXML
 * @desc writes opening tags for xml
 * @params {XMLStreamWriter} xsw
 */
function openXML(xsw) {
    xsw.writeStartDocument("UTF-8", "1.0");
    xsw.writeStartElement("urlset");  
    xsw.writeAttribute("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9");
    xsw.writeAttribute("xmlns:image", "http://www.google.com/schemas/sitemap-image/1.1");
    xsw.writeAttribute("xmlns:xhtml", "http://www.w3.org/1999/xhtml");
    xsw.writeAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
    xsw.writeAttribute("xsi:schemaLocation", "http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd http://www.google.com/schemas/sitemap-image/1.1 http://www.google.com/schemas/sitemap-image/1.1/sitemap-image.xsd http://www.w3.org/1999/xhtml http://www.w3.org/2002/08/xhtml/xhtml1-strict.xsd");
}


/**
 * 
 * @function
 * @name writeProducts
 * @desc writes product urls and other tags for xml
 * @params {XMLStreamWriter} xsw
 * @params {Object} sitemapObj
 */
function writeProducts(xsw, sitemapObj) {
    xsw.writeStartElement("url");
        xsw.writeStartElement("loc");
            xsw.writeCharacters(sitemapObj.url);
        xsw.writeEndElement();
        xsw.writeStartElement("lastmod");
            xsw.writeCharacters(sitemapObj.lastmod);
        xsw.writeEndElement();
        xsw.writeStartElement("changefreq");
            xsw.writeCharacters(sitemapObj.changeFrequency);
        xsw.writeEndElement();
        xsw.writeStartElement("priority");
            xsw.writeCharacters(sitemapObj.priority);
        xsw.writeEndElement();
    xsw.writeEndElement();
}

/**
 * 
 * @function
 * @name closeXML
 * @desc writes closing tags for xml, and closes writers as well
 * @params {XMLStreamWriter} xsw
 * @params {FileWriter} filewriter
 */
function closeXML(xsw, filewriter){
    xsw.writeEndElement();
    xsw.writeEndDocument();
    xsw.close();
    filewriter.close();
}

/**
 * 
 * @function
 * @name getProducts
 * @desc gets all assigned products
 * @returns {SeekableIterator<Product>} products
 */
function getProducts(){
    var ProductMgr = require('dw/catalog/ProductMgr');
    var products = ProductMgr.queryAllSiteProducts();
    return products;
}

/**
 * 
 * @function
 * @name isIncludeSitemap
 * @desc logic for including in sitemap or not
 * @param {Object} params Job parameters
 * @returns {Object} url, lastmod, etc
 */
function isIncludeSitemap(product, params){
    var result = {included: false};
    var masterProductCheck = !product.master || params.includeMasters;
    var sitemapIncludedCheck = product.siteMapIncluded !== 0;

    if ( masterProductCheck && sitemapIncludedCheck) {
        var productHelpers = require('*/cartridge/scripts/helpers/productHelpers');
        var url = productHelpers.generatePdpURL(product.ID, false);
        var lastmod = product.lastModified.toISOString().split('T')[0];
        var changeFrequency = product.siteMapChangeFrequency || "daily";
        var priority = product.siteMapPriority || "0.5";
        result = {
            included: true,
            url: url,
            lastmod: lastmod,
            changeFrequency: changeFrequency,
            priority: priority
        };
    }
    return result;
}

/**
 * 
 * @function
 * @name execute
 * @param {Object} params Job parameters
 */
function execute(params){
    var sitemapFile = createFile();
    var fileWriter = new FileWriter(sitemapFile, "UTF-8");
    var xsw = new XMLStreamWriter(fileWriter);
    Logger.info('Sitemap File Created');
    openXML(xsw);
    Logger.info('XML open elements written');
    Logger.info('Looping through online and available Products');
    var products = getProducts();
    var counter = 0;
    while(products.hasNext()){
        var product = products.next();
        if(product.online) {
            var sitemapObj = isIncludeSitemap(product, params);
            if(sitemapObj.included){
                writeProducts(xsw, sitemapObj);
                counter++;
            }
        }

    }
    Logger.info('{0} products written', counter);
    closeXML(xsw, fileWriter);
    Logger.info('XML closed. Writer closed.');
    publishCustomSitemap(sitemapFile);
    Logger.info('custom Sitemap added.');
    Logger.info('To publish custom Sitemap, Generate sitemap job is required to run afterwards.');
}


exports.execute = execute