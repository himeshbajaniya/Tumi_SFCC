'use strict';

var Cipher = require( 'dw/crypto/Cipher' );
var Encoding = require( 'dw/crypto/Encoding' );
var Site = require( 'dw/system/Site' );
var Logger = require( 'dw/system/Logger' );
var log = Logger.getLogger( 'KlarnaPayments' );
var StringUtils = require( 'dw/util/StringUtils' );
var YEAR_PREFIX = require( 'int_klarna_payments/cartridge/scripts/util/klarnaPaymentsConstants.js' ).YEAR_PREFIX;

/**
 * handles the payment authorization for each payment instrument
 * @param {dw.order.Order} Order - the order object
 * @returns {Object} result object
 */
function handleVCNDecryption( Order ) {
    var result = {};
    var cipher = new Cipher();
    var VCNPrivateKey = Site.getCurrent().getCustomPreferenceValue( 'vcnPrivateKey' );

    try {
		
	   var keyEncryptedBase64 = Order.custom.kpVCNAESKey;
	   var keyEncryptedBytes = Encoding.fromBase64( keyEncryptedBase64 );
	   var keyDecrypted = cipher.decryptBytes( keyEncryptedBytes, VCNPrivateKey,"RSA/ECB/PKCS1PADDING", null, 0 );
	   var keyDecryptedBase64 = Encoding.toBase64( keyDecrypted );
	   var cardDataEncryptedBase64 = Order.custom.kpVCNPCIData;
	   var cardDataEncryptedBytes = Encoding.fromBase64( cardDataEncryptedBase64 );
	   var cardDecrypted = cipher.decryptBytes( cardDataEncryptedBytes, keyDecryptedBase64, "AES/CTR/NoPadding", Order.custom.kpVCNIV, 0 );
	   var cardDecryptedUtf8 = decodeURIComponent( cardDecrypted );
	   var cardObj = JSON.parse( cardDecryptedUtf8 );
	   var expiryDateArr = cardObj.expiry_date.split( "/" );
		// Retrieve ecnrypted card details
        var cardPAN = cardObj.pan;
        var cardCVV = cardObj.cvv;
        var cardExpiryMonth = expiryDateArr[0];
        var cardExpiryYear = expiryDateArr[1];
        if (cardExpiryYear.length == 2) {
            cardExpiryYear = YEAR_PREFIX + cardExpiryYear;
        }
        var cardType = Order.custom.kpVCNBrand.toLowerCase();


		// Retrieve ecnrypted card details
        log.debug( 'OrderID: {0} Card Details decrypted successfully', Order.orderNo );
		
        result = {
            error: false,
            cardNumberVCN: cardPAN,
            cardCvvVCN: cardCVV,
            cardExpiryMonthVCN: cardExpiryMonth,
            cardExpiryYearVCN: cardExpiryYear,
            cardTypeVCN: cardType
        };

    } catch ( e ) {
        log.error( e );
        result = {
            error: true,
            errorMessage: e.message
	    };
    }
	
    return result;
}

module.exports = {

    handleVCNDecryption: handleVCNDecryption

};
