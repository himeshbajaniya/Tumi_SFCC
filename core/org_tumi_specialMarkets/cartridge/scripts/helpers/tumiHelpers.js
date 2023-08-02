var base = module.superModule;

function putAllAgentDetails() {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var collections = require('*/cartridge/scripts/util/collections');
    var customObjects = CustomObjectMgr.queryCustomObjects('repLocator', '', 'custom.region asc', null);
    var replocatorJSON = collections.map(customObjects, function(co) {
        return {
            code: co.custom.regionShortName,
            ID: co.custom.repID,
            region: co.custom.region,
            name: co.custom.name,
            email: co.custom.email,
            phone: co.custom.phone,
            company: co.custom.company,
            address1: co.custom.address1,
            address2: co.custom.address2
        }
    });

    return replocatorJSON;
}

function putAgentDetails(region) {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    try {
        var co = CustomObjectMgr.getCustomObject('repLocator', region);
        return {
            code: co.custom.regionShortName,
            ID: co.custom.repID,
            region: co.custom.region,
            name: co.custom.name,
            email: co.custom.email,
            phone: co.custom.phone,
            company: co.custom.company,
            address1: co.custom.address1,
            address2: co.custom.address2
        }
        
    } catch (error) {
        return {
            code: "",
            ID: "",
            region: "",
            name: "",
            email: "",
            phone: "",
            company: "",
            address1: "",
            address2: ""
        }
    }

}

function getLocalAgentDetails(region){
    var CacheMgr = require('dw/system/CacheMgr')
    var cache = CacheMgr.getCache( 'repLocator' );
    var agentDetailsJSON = null;
    if(region) {
        agentDetailsJSON = cache.get(region, function callback() {
            var CustomObjectMgr = require('dw/object/CustomObjectMgr');
            try {
                var co = CustomObjectMgr.getCustomObject('repLocator', region);
                return {
                    code: co.custom.regionShortName,
                    ID: co.custom.repID,
                    region: co.custom.region,
                    name: co.custom.name,
                    email: co.custom.email,
                    phone: co.custom.phone,
                    company: co.custom.company,
                    address1: co.custom.address1,
                    address2: co.custom.address2
                }
                
            } catch (error) {
                return {
                    code: "",
                    ID: "",
                    region: "",
                    name: "",
                    email: "",
                    phone: "",
                    company: "",
                    address1: "",
                    address2: ""
                }
            }
        })
    } else{
        agentDetailsJSON = cache.get('allAgentDetails', putAllAgentDetails);
    }

    return agentDetailsJSON;
}

function removeAllProducts(basket) {
    var collections = require('*/cartridge/scripts/util/collections');
    var Transaction = require('dw/system/Transaction');
    var productLineItems = basket.getAllProductLineItems();
    collections.forEach(productLineItems, function(pli){
        Transaction.wrap(function(){
            basket.removeProductLineItem(pli);
        })
    });
}

base.getLocalAgentDetails = getLocalAgentDetails
base.removeAllProducts = removeAllProducts
module.exports = base;
