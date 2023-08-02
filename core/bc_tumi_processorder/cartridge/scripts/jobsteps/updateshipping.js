'use strict';
var Log = require('~/cartridge/scripts/logger/log');
var log = new Log('UpdateShipping');
var File = require('dw/io/File');
var fileListItr;

function read(args) {
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
        csvModel = require('~/cartridge/scripts/helpers/updateShipHelpers').getModel(csvStreamReader);
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

function write(args, jobparams) {
    var iter = args.iterator();
    while (iter.hasNext()) {
        var updateShipHelpers = require('~/cartridge/scripts/helpers/updateShipHelpers');
        var model = iter.next();
        var order = require('dw/order/OrderMgr').getOrder(model.order.orderCode);
        if (!order) {
            log.error('Order Number {0} from CSV Not found in Instance', model.order.orderCode);
            continue;
        }
        var isReconcilledRequired = jobparams.calculateReconcile || false;
        updateShipHelpers.updateShippingOrder(model);
        updateShipHelpers.updateShipmentStatus(order, isReconcilledRequired);
        if (!isReconcilledRequired) continue;
        // DO reconcillation only if it is checked in job step
        updateShipHelpers.reconcillationPrice(order);
        updateShipHelpers.reconcillationPaymentInstrument(order);
        log.debug('Updating Order Completed: {0}', order.orderNo);
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