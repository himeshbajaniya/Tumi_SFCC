'use strict';

class FileWriter {
    constructor(file, encoding) {
        this.file = file;
        this.encoding = encoding;
    }
    close() {
        return true;
    }
}

module.exports = FileWriter;
