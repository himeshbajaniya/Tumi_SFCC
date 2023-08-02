'use strict';

class SFTPClient {
    constructor() {
        this.connected = true;
        this.timeout = 10000; //10 seconds
    }
    setTimeout(timeoutMillis) {
        this.timeout = timeoutMillis;
    }

    connect() {
        return true;
    }

    disconnect() {
    }

    getFileInfo() {
        return {
            name: 'test'
        };
    } 

    mkdir() {
        return true;
    }

    putBinary() {
        return true;
    }
}

module.exports = SFTPClient;
