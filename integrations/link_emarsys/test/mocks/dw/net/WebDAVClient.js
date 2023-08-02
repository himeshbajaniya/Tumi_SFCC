'use strict';

class WebDAVClient {
    constructor(rootUrl, username, password ) {
        this.rootUrl = rootUrl; 
        this.username = username;
        this.password = password;
    }
    put(path, file) {
        return true;
    }
    succeeded() {
        return true;
    }

} 
module.exports = WebDAVClient;