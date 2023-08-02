'use strict';

var Collection = require('./../util/Collection');

var objects = {
    'EmarsysCatalogConfig': {
        'customConfig': {
            custom: {
                mappedFields: JSON.stringify([{
                    'field':'product.ID','placeholder':'item'},
                    {'field':'product.availability','placeholder':'available'}
                    ,{'field':'product.name','placeholder':'title_multilang'},
                    {'field':'product.url','placeholder':'link_multilang'},
                    {'field':'product.image','placeholder':'image'},
                    {'field':'product.categories','placeholder':'category_multilang'},
                    {'field':'product.price','placeholder':'price_multilang'},
                    {'field':'product.brand','placeholder':'c_braand'},
                    {'field':'product.group_id','placeholder':'group_id'}]),
                exportType: 'variations',
                EmarsysCatalogConfig: 'customConfig'
            }
        },
        'customConfig2': {
            custom: {
                mappedFields: JSON.stringify([{
                    'field':'product.ID','placeholder':'item'},
                    {'field':'product.image','placeholder':'image'}]),
                exportType: 'masters',
                EmarsysCatalogConfig: 'customConfig2'
            }
        },
        'customConfigTEST': {
            custom: {
                mappedFields: JSON.stringify(''),
                exportType: 'masters',
                EmarsysCatalogConfig: 'customConfig2'
            }
        }
    },
    'EmarsysPredictConfig': {
        'predictConfig': {
            custom: {
                mappedFields: JSON.stringify([{
                    'field':'product.ID','placeholder':'item'},
                    {'field':'product.availability','placeholder':'available'}
                    ,{'field':'product.name','placeholder':'title_multilang'},
                    {'field':'product.url','placeholder':'link_multilang'},
                    {'field':'product.image','placeholder':'image'},
                    {'field':'product.categories','placeholder':'category_multilang'},
                    {'field':'product.price','placeholder':'price_multilang'},
                    {'field':'product.brand','placeholder':'c_braand'},
                    {'field':'product.group_id','placeholder':'group_id'}]),
                exportType: 'variations'
            }
        }
    },
    'EmarsysDBLoadConfig': {
        'dbloadConfig': {
            custom: {
                mappedFields: JSON.stringify([
                    {"field":"3","placeholder":"email"},
                    {"field":"2","placeholder":"lastName"},
                    {"field":"5","placeholder":"gender"},
                    {"field":"1","placeholder":"firstName"},
                    {"field":"45","placeholder":"countryCode"},
                    {"field":"98","placeholder":"custom.color"}
                ])
            }
        }
    },
    'EmarsysProfileFields': {
        'profileFields': {
            custom: {
                result: JSON.stringify([{"id":0,"name":"Interests","application_type":"interests","string_id":"interests"},
                {"id":9,"name":"Title","application_type":"singlechoice","string_id":"title"},
                {"id":1,"name":"First Name","application_type":"shorttext","string_id":"first_name"},
                {"id":2,"name":"Last Name","application_type":"shorttext","string_id":"last_name"},
                {"id":3,"name":"Email","application_type":"longtext","string_id":"email"},
                {"id":5,"name":"Gender","application_type":"singlechoice","string_id":"gender"},
                {"id":4,"name":"Date of Birth","application_type":"birthdate","string_id":"birth_date"},
                {"id":8,"name":"Education","application_type":"singlechoice","string_id":"education"},
                {"id":45,"name":"country Code","application_type":"singlechoice","string_id":"country_code"},
                {"id":98,"name":"custom","application_type":"singlechoice","string_id":"custom_n"}
            ])
            }
        }
    },
    'EmarsysExternalEvents': {
        'StoredEvents': {
            custom: {
                result: JSON.stringify([
                    {"id":"5633","name":"single"},
                    {"id":"5634","name":"double"},
                    {"id":"12561","name":"SFCC_FORGOT_PASSWORD_SUBMITTED"},
                    {"id":"12563","name":"SFCC_CONTACT_FORM_SUBMITTED"},
                    {"id":"12644","name":"SFCC_NEWSLETTER_SUBSCRIPTION_CONFIRMATION"},
                    {"id":"12646","name":"SFCC_NEWSLETTER_UNSUBSCRIBE_SUCCESS"}
                ]),
                otherSource: JSON.stringify(["forgot_password_submitted","contact_form_submitted"]),
                newsletterSubscriptionSource: JSON.stringify(["newsletter_subscription_confirmation","newsletter_subscription_success"]),
                otherResult: JSON.stringify([
                    {"sfccName":"cancelled_order","emarsysId":"12678","emarsysName":"SFCC_CANCELLED_ORDER","campaignId":"7497055"},
                    {"sfccName":"forgot_password_submitted","emarsysId":"12561","emarsysName":"SFCC_FORGOT_PASSWORD_SUBMITTED","campaignId":"7497056"},
                    {"sfccName":"contact_form_submitted","emarsysId":"12563","emarsysName":"SFCC_CONTACT_FORM_SUBMITTED","campaignId":"7497057"}]),
                newsletterSubscriptionResult: JSON.stringify([
                    {"sfccName":"newsletter_subscription_confirmation","emarsysId":"12644","emarsysName":"SFCC_NEWSLETTER_SUBSCRIPTION_CONFIRMATION","campaignId":"7497007"},
                    {"sfccName":"newsletter_subscription_success","emarsysId":"12645","emarsysName":"SFCC_NEWSLETTER_SUBSCRIPTION_SUCCESS","campaignId":"7497050"}]),
                    campaignsCategory: '6146'
            },
            name: 'StoredEvents'
        },
        'emptyObject': {},
        'invalidFields': {
            custom: {
                otherSource: "[]",
                newsletterSubscriptionSource: "[]",
                otherResult: "{invalid_list}",
                newsletterSubscriptionResult: "{invalid_list}"
            }
        },
        'testObject': {
            otherResult: JSON.stringify([{"emarsysId":"1234","emarsysName":"SFCC_CANCELLED_ORDER","sfccName":"cancelled_order"},
                {"emarsysId":"1278","emarsysName":"SFCC_DOUBLE_OPTIN","sfccName":"double-optin"}]),
            otherSource: JSON.stringify(["cancelled_order"]),
            newsletterSubscriptionSource: JSON.stringify(["single","double-optin"])
        }
    },
    'EmarsysTransactionalEmailsConfig': {
        'shipping': {
            custom: {
                mappedFields: JSON.stringify([{"field":"product.price.currencyCode","placeholder":"currency"},
                {"field":"product.url","placeholder":"product_url"},
                {"field":"orderRebate.display","placeholder":"order_rebate"},
                {"field":"product.rebate","placeholder":"product_rebate"},
                {"field":"billingAddress.address1","placeholder":"b_address_1"},
                {"field":"shippingAddress.postalCode","placeholder":"b_address_zip"},
                {"field":"billingAddress.city","placeholder":"b_address_city"},
                {"field":"billingAddress.countryCode.displayValue","placeholder":"b_address_country"},
                {"field":"order.orderNo","placeholder":"order_number"},
                {"field":"order.creationDate","placeholder":"order_date"},
                {"field":"deliveryMethod.display","placeholder":"delivery_method"},
                {"field":"product.productName","placeholder":"product_name"},
                {"field":"product.quantityValue","placeholder":"quantity"},
                {"field":"product.adjustedPrice","placeholder":"price"}]),
                externalEvent: 5633
            }
        },
        'orderCancelledConf': {
            custom: {
                mappedFields: JSON.stringify([{"field":"product.price.currencyCode","placeholder":"currency"},
                {"field":"product.url","placeholder":"product_url"},
                {"field":"product.quantityValue","placeholder":"quantity"},
                {"field":"product.adjustedPrice","placeholder":"price"}])
            }
        }
    },
    'EmarsysSmartInsightConfiguration': {
        'emarsysSmartInsight': {
            custom: {
                mappedFields: JSON.stringify([
                    {"field":"order","placeholder":"order"},
                    {"field":"date","placeholder":"timestamp"},
                    {"field":"item","placeholder":"item"},
                    {"field":"quantity","placeholder":"quantity"},
                    {"field":"price","placeholder":"price"},
                    {"field":"custom.product.name","placeholder":"prodname"},
                    {"field":"custom.lineItem.shipment.shippingAddress.address1","placeholder":"address"},
                    {"field":"custom.order.customerName","placeholder":"customername"},
                    {"field":"customer","placeholder":"customeremail"},
                    {"field":"masterid","placeholder":"masterproductid"},
                    {"field":"variantid","placeholder":"productid"}
                ])
            }
        }
    },
    'EmarsysNewsletterSubscription': {
        'checkout': {
            custom: {
                EmarsysSubscriptionType: 'checkout',
                optInStrategy: '1',
                optInExternalEvent: '5633',
                optInExternalEventAfterConfirmation: '5633'
            }
        },
        'footer': {
            custom: {
                EmarsysSubscriptionType: 'footer',
                optInStrategy: '1',
                optInExternalEvent: 'newsletter_subscription_confirmation',
                optInExternalEventAfterConfirmation: 'newsletter_subscription_confirmation'
            }
        },
        'account': {
            custom: {
                EmarsysSubscriptionType: 'account',
                optInStrategy: '2',
                optInExternalEvent: 'newsletter_subscription_confirmation',
                optInExternalEventAfterConfirmation: 'newsletter_subscription_confirmation'
            }
        },
        'test': {
            custom: {}
        }
    }
};
class CustomObjectMgr {
    createCustomObject(type, key) {
        var newObject = objects[type][key];

        return newObject;
    }

    getCustomObject(type, key) {
        var creator = objects[type];
        var newObject = creator[key];
        return newObject || null;
    }

    queryCustomObjects(type) {
        var index = 0;
        return {
            items: items,
            iterator: function () {
                return {
                    items: items,
                    hasNext: function () {
                        return index < items.length;
                    },
                    next: function () {
                        return items[index++];
                    }
                };
            },
            toArray: function () {
                return items;
            },
            next: function () {
                return items[index++];
            },
            hasNext: function () {
                return index < items.length;
            }
        };
    }

    getAllCustomObjects(type) {
        var customObjects = new Collection([objects[type]['customConfig'], objects[type]['customConfig2']]);
        return {
            asList: function () {
                return customObjects;
            }
        };
    }

    remove() {
        return true;
    }
}

module.exports = new CustomObjectMgr;
