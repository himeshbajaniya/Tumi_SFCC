'use strict';
var FileWriter = require('../io/FileWriter');

class CSVStreamWriter {
    constructor(writer, separator, quote) {
        this.writer = writer;
        this.separator = separator;
        this.quote = quote;
    }
    writeNext(line) {
        return true;
    }
    close() {
        return true;
    }
}

module.exports = CSVStreamWriter;
