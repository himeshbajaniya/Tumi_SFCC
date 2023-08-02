'use strict';

var Log = require('~/cartridge/scripts/logger/log');
var log = new Log('ReadReturnXML');
var File = require('dw/io/File');
var fileListItr;
var returnHelpers = require('~/cartridge/scripts/helpers/returnHelpers');

function read() {
    if (fileListItr) {
        while (fileListItr.hasNext()) {
            return fileListItr.next();
        }
    }
    return null;
}

function process(file, args) {
    var FileReader = require('dw/io/FileReader');
    var CSVStreamReader = require('dw/io/CSVStreamReader');
    var fileReader = new FileReader(file);
    var csvStreamReader;
    var csvModel = null;
    try {
        csvStreamReader = new CSVStreamReader(fileReader, ';');
        csvModel = returnHelpers.getModel(csvStreamReader);
        var archiveFolderLocation = File.IMPEX + File.SEPARATOR + args.archievelocation;
        var archiveFolder = new File(archiveFolderLocation);
        if (!archiveFolder.exists()) archiveFolder.mkdirs();
        var archiveFile = new File(archiveFolderLocation + File.SEPARATOR + file.name);
        file.renameTo(archiveFile);
    } catch (e) {
        log.error('Error while Reading CSV file: {0} \n stack: {1}', e.message, e.stack);
        csvModel = null;
    } finally {
        if (csvStreamReader) csvStreamReader.close();
        if (fileReader) fileReader.close();
    }
    return csvModel;
}

function write(args) {
    var iter = args.iterator();
    while (iter.hasNext()) {
        var model = iter.next();
        returnHelpers.saveItInCO(model);
    }
}

function beforeStep(args) {
    var File = require('dw/io/File');
    var file = new File(File.IMPEX + File.SEPARATOR + args.folderpath);
    if (!file.exists()) return new Error('Invalid Folder name');
    var fileLists = file.listFiles();
    if (fileLists) fileListItr = fileLists.iterator();
}

module.exports = {
    read: read,
    process: process,
    write: write,
    beforeStep: beforeStep
};