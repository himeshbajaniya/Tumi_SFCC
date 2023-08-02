'use strict';

var Transaction = require('dw/system/Transaction');
var CustomerMgr = require('dw/customer/CustomerMgr');
var Status = require('dw/system/Status');

var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');
var Logger = require('dw/system/Logger');

/**
 *Function to write file
 * @param {string} filename file name
 * @param {string} localPath path to write file
 * @returns {boolean} flag
 */
function getStreamWriter(filename, localPath) {
    var file;
    var fileWriter;
    var xmlStreamWriter;

    if (!filename) {
        Logger.error('filename is empty!  Cannot create XMLStreamWriter.');
        return false;
    }

    var filepath = [File.IMPEX, localPath].join(File.SEPARATOR);
    var filepathFile = new File(filepath);
    if (!filepathFile.exists()) {
        filepathFile.mkdirs();
    }
    file = new File(filepathFile, filename);
    fileWriter = new FileWriter(file, 'UTF-8');
    xmlStreamWriter = new XMLStreamWriter(fileWriter);

    return {
        file: file,
        fileWriter: fileWriter,
        xmlStreamWriter: xmlStreamWriter
    };
}

function unverifiedCustomerRemovalJob (args) {
    try {
        var date = new Date();
        var profiles = CustomerMgr.queryProfiles('custom.accountHasToBeVerifiedByCustomer = {0}', null, true).asList().toArray();
        var filename = args.fileName;
        var route = args.folderPath;
        var file = getStreamWriter(filename, route);
        if (file !== false) {
            file.xmlStreamWriter.writeStartDocument();
            file.xmlStreamWriter.writeStartElement('customers');
            file.xmlStreamWriter.writeAttribute('xmlns', 'http://www.demandware.com/xml/impex/customer/2006-10-31');
            profiles.forEach(function (profile) {
                var accountVerificationLinkSentTime = 'accountVerificationLinkSentTime' in profile.custom ? profile.custom.accountVerificationLinkSentTime : false;
                var removeTime = 'removeTime' in args ? args.removeTime : 2880;
                var accountVerificationLinkSentTime = new Number(accountVerificationLinkSentTime);
                var removeTime = parseInt(removeTime, 10) * 60;
                var expTime = accountVerificationLinkSentTime + removeTime * 1000;
                var eligibleToRemove = (expTime - new Date().getTime()) <= 0;

                if (eligibleToRemove) {
                    file.xmlStreamWriter.writeStartElement('customer');
                    file.xmlStreamWriter.writeAttribute('customer-no', profile.customerNo);
                    file.xmlStreamWriter.writeEndElement();
                }
            });
            file.xmlStreamWriter.writeEndElement();

            file.xmlStreamWriter.writeEndDocument();
            file.xmlStreamWriter.close();
            file.fileWriter.close();
        }


        return new Status(Status.OK);
    }
    catch (e) {
        return new Status(Status.ERROR);
    }
}

module.exports = {
    unverifiedCustomerRemovalJob: unverifiedCustomerRemovalJob
}
