'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var Resource = require('dw/web/Resource');

/**
 * Creates an object of the visible attributes for a product
 * @param {dw.catalog.ProductAttributeModel} attributeModel - attributeModel for a given product.
 * @return {Object|null} an object containing the visible attributes for a product.
 */
function getGroupAttributes(attributeModel) {
    var ArrayList = require('dw/util/ArrayList');
    var attributes;
    var attributeGroups = attributeModel.attributeGroups;

    if (attributeGroups.getLength() > 0) {
        var listOfGroup = {
            'BasicSpecifications' : 'Basic Specifications',
            'BasicSpecificationsMetric': 'Basic Specifications Metric',
            'AdditionalServices': 'Additional Services',
            'AlternateViews': 'Alternate Views',
            'Features': 'Features'
        };
        var toIterate = new ArrayList();
        var msgKey = "";
        collections.forEach(attributeGroups, function (group) {
            if (group.ID in listOfGroup) {
                toIterate.add(group)
            }
        });
        attributes = collections.map(toIterate, function (group) {
            var attributeResult = {};
            if (group.ID in listOfGroup) {
                var attributeDef = group.attributeDefinitions;
                attributeResult.ID = group.ID;
                attributeResult.name = group.displayName;
                msgKey = 'compare.group.help.text.' + group.ID;
                attributeResult.helpText = Resource.msg(msgKey, 'product', null)
                attributeResult.attributes = collections.map(
                    attributeDef,
                    function (definition) {
                        var definitionResult = {};
                        msgKey = "";
                        definitionResult.label = definition.displayName;

                        if (definition.multiValueType) {
                            definitionResult.value = attributeModel.getDisplayValue(definition).map(
                                function (item) {
                                    return item;
                                });
                        } else {
                            definitionResult.value = attributeModel.getDisplayValue(definition);
                        }
                        if(!definitionResult.value){
                            if(definition.VALUE_TYPE_BOOLEAN == definition.valueTypeCode){
                                definitionResult.value = false;
                            } else {
                                definitionResult.value = '-';
                            }
                        }
                        msgKey = 'compare.attribute.help.text.' + definition.ID;
                        definitionResult.helpText = Resource.msg(msgKey, 'product', '')

                        return definitionResult;
                    }
                );
            }
            return attributeResult;
        });
    } else {
        attributes = null;
    }

    return attributes;
}

module.exports = function (object, attributeModel) {
    Object.defineProperty(object, 'groupAttributes', {
        enumerable: true,
        value: getGroupAttributes(attributeModel)
    });
};
