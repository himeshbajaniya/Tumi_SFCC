/**
 * SVS GiftCard Service
 */

'use strict';

// import packages
var dwsvc = require('dw/svc');

// modules
var GiftCardFactory = require('*/cartridge/scripts/valuetec/util/GiftCardFactory');
var GiftCardServiceUtils = require('*/cartridge/scripts/valuetec/util/GiftCardServiceUtils');
var GiftCardMockLibrary = require('*/cartridge/scripts/valuetec/util/GiftCardMockLibrary');

// any default variables
var serviceName = GiftCardFactory.SERVICES.VALUETEC;

var serviceConfig = {
    initServiceClient: function () {
        this.webReference = webreferences2.valutecGiftCard; // eslint-disable-line no-undef
        return this.webReference.getService('ValutecWS', 'ValutecWSSoap');
    },
    createRequest: function (service, requestDataContainer) {
        this.serviceAction = requestDataContainer.action;
        var serviceRequest;

        if (requestDataContainer.action === GiftCardFactory.ACTIONS.GET_GIFTCARD_BALANCE) {
            serviceRequest = GiftCardServiceUtils.GiftCardServiceUtils.getBalanceRequest(this.webReference, requestDataContainer.data);
        } else if (requestDataContainer.action === GiftCardFactory.ACTIONS.AUTH_GIFTCARD) {
            serviceRequest = GiftCardServiceUtils.GiftCardServiceUtils.getAuthRequest(this.webReference, requestDataContainer.data);
        } else if (requestDataContainer.action === GiftCardFactory.ACTIONS.VOID_GIFTCARD) {
            serviceRequest = GiftCardServiceUtils.GiftCardServiceUtils.getVoidRequest(this.webReference, requestDataContainer.data);
        } else if (requestDataContainer.action === GiftCardFactory.ACTIONS.REVAUTH_GIFTCARD) {
            serviceRequest = GiftCardServiceUtils.GiftCardServiceUtils.getRevAuthRequest(this.webReference, requestDataContainer.data);
        }

        return serviceRequest;
    },
    execute: function (service, serviceRequest) {
        var client = service.serviceClient;
        // GiftCardServiceUtils.addServiceSecurity(service);
        if (this.serviceAction === GiftCardFactory.ACTIONS.GET_GIFTCARD_BALANCE) {
            return client.transactionCardBalance(serviceRequest.clientKey, serviceRequest.terminalID, serviceRequest.programType, serviceRequest.cardNumber, serviceRequest.serverID, serviceRequest.identifier);
        } if (this.serviceAction === GiftCardFactory.ACTIONS.AUTH_GIFTCARD) {
            return service.serviceClient.transactionSale(serviceRequest.clientKey, serviceRequest.terminalID, serviceRequest.programType, serviceRequest.cardNumber, serviceRequest.amount, serviceRequest.serverID, serviceRequest.identifier);
        } if (this.serviceAction === GiftCardFactory.ACTIONS.VOID_GIFTCARD) {
            return service.serviceClient.transactionVoid(serviceRequest.clientKey, serviceRequest.terminalID, serviceRequest.programType, serviceRequest.cardNumber, serviceRequest.requestAuthCode, serviceRequest.serverID, serviceRequest.identifier);
        } if (this.serviceAction === GiftCardFactory.ACTIONS.REVAUTH_GIFTCARD) {
            return service.serviceClient.transactionReversal(serviceRequest.clientKey, serviceRequest.terminalID, serviceRequest.cardNumber, serviceRequest.requestIdentifier, serviceRequest.serverID, serviceRequest.identifier);
        }

        return null;
    },
    parseResponse: function (service, serviceResponse) {
        var responseObject = {};
        if (serviceResponse) {
            if (this.serviceAction === GiftCardFactory.ACTIONS.GET_GIFTCARD_BALANCE) {
                responseObject = GiftCardServiceUtils.GiftCardServiceUtils.parseGetGiftCardBalanceResult(serviceResponse);
            } else if (this.serviceAction === GiftCardFactory.ACTIONS.AUTH_GIFTCARD) {
                responseObject = GiftCardServiceUtils.GiftCardServiceUtils.parseAuthResult(serviceResponse);
            } else if (this.serviceAction === GiftCardFactory.ACTIONS.VOID_GIFTCARD) {
                responseObject = GiftCardServiceUtils.GiftCardServiceUtils.parseVoidResult(serviceResponse);
            } else if (this.serviceAction === GiftCardFactory.ACTIONS.REVAUTH_GIFTCARD) {
                responseObject = GiftCardServiceUtils.GiftCardServiceUtils.parseRevAuthResult(serviceResponse);
            }
        }

        return responseObject;
    },
    /* filterLogMessage: function (message) {
        return message;
    }, */
    mockCall: function () {
        if (this.serviceAction === GiftCardFactory.ACTIONS.GET_GIFTCARD_BALANCE) {
            return GiftCardMockLibrary.getBalanceRequestMockResponse(this.webReference);
        } if (this.serviceAction === GiftCardFactory.ACTIONS.AUTH_GIFTCARD) {
            return GiftCardMockLibrary.getAuthMockResponse(this.webReference);
        } if (this.serviceAction === GiftCardFactory.ACTIONS.VOID_GIFTCARD) {
            return GiftCardMockLibrary.getVoidMockResponse(this.webReference);
        } if (this.serviceAction === GiftCardFactory.ACTIONS.REVAUTH_GIFTCARD) {
            return GiftCardMockLibrary.getRevAuthMockResponse(this.webReference);
        }
        return null;
    }
};

exports.VALUETEC = dwsvc.LocalServiceRegistry.createService(serviceName, serviceConfig);
