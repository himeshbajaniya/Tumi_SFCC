'use strict';
var File = require('./File');
var FileWriter = require('./FileWriter');
var CSVStreamWriter = require('./CSVStreamWriter');
var Io = {
    File: File,
    FileWriter: FileWriter,
    CSVStreamWriter: CSVStreamWriter
};

module.exports = Io;
