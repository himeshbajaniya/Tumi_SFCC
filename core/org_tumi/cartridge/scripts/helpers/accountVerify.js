'use strict';

var Bytes = require('dw/util/Bytes');
var Encoding = require('dw/crypto/Encoding');
var Site = require('dw/system/Site');
var customPreferences = Site.getCurrent().getPreferences().custom;

function getSignature(data) {
    var Mac = require('dw/crypto/Mac');

    var secretKey = 'accountVerificationHashSecretKey' in customPreferences ? customPreferences.accountVerificationHashSecretKey : '';
    var decodedSecretKeyBytes = Encoding.fromBase64(secretKey);
    var sigByte = new Bytes(data);
    var hmacSHA256 = new Mac(Mac.HMAC_SHA_256);

    var byteDigest = hmacSHA256.digest(sigByte, decodedSecretKeyBytes);
    var base64EncodedString = Encoding.toBase64(byteDigest).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    return base64EncodedString;
}

function getAccountVerifitcationToken(payload) {
    var header = { alg:'HS256', typ:'JWT' };

    var encodedHeaderData = Encoding.toBase64(new Bytes(header));
    var accountVerificationTokenAge = 'accountVerificationTokenAge' in customPreferences ? customPreferences.accountVerificationTokenAge : 2880; //min
    var payloadSignature = payload;

    payloadSignature.iat = new Date().getTime();
    var TokenAge = parseInt(accountVerificationTokenAge, 10) * 60;
    payloadSignature.exp = payloadSignature.iat + TokenAge * 1000;

    var encodedPayloadData = Encoding.toBase64(new Bytes(JSON.stringify(payloadSignature)));
    var data = encodedHeaderData + '.' + encodedPayloadData.replace(/\=/g, '');
    var signature = data + '.' + getSignature(data);

    return signature
}

module.exports = {
    getAccountVerifitcationToken: getAccountVerifitcationToken,
    getSignature: getSignature
};
