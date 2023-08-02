'use strict';

class Mac {
    static get HMAC_SHA_256() { return 'HMAC_SHA_256'}
    constructor(algorithm) {
    }

    digest(input, key) {
        return 'test';
    }
}

module.exports = Mac;
