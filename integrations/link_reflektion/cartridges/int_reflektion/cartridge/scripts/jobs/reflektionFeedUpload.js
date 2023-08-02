'use strict';

/**
 * Copies files to a remote (S)FTP-Location
 *
 * Job Parameters: fileName : String file to be uploaded
 */

var Site = require('dw/system/Site');
var File = require('dw/io/File');
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');

/* Script Modules */
var reflektionService = require('~/cartridge/scripts/service/reflektionService');
var reflektionHelper = require('~/cartridge/scripts/reflektionHelper');

/* Custom Logger */
var logger = Logger.getLogger('reflektion', 'FeedUpload');

/**
 * @function
 * @name upload
 * @param {string} fileName Name of the file to upload.
 * @description The main function.
 * @returns {dw.system.Status} The exit status for the job step
 */
function upload(fileName) {
    try {
        // Set Variables
        var postFileLocation = reflektionHelper.getRFKFeedUploadPath(); // location to post file on the SFTP;
        var exportPath = reflektionHelper.getRFKFeedExportPath(); // location of outfile from site preference

        // Test mandatory parameters
        if (empty(postFileLocation) || empty(fileName) || empty(exportPath)) { // eslint-disable-line no-undef
            return new Status(Status.ERROR, 'ERROR', 'One or more mandatory parameters are missing. Post File Location = (' + postFileLocation + ') FileName = (' + fileName + ') ExportPath = (' + exportPath + ')');
        }

        // Get the file path where the output will be stored
        var impexPath = File.getRootDirectory(File.IMPEX).getFullPath();
        // Create a directory if one doesn't already exist
        var reflektionDir = new File(impexPath + File.SEPARATOR + exportPath);

        // Retrieve file to be exported
        var exportFile = new File(reflektionDir.getFullPath() + File.SEPARATOR + fileName);

        // If no files are found then exit
        if (empty(exportFile)) { // eslint-disable-line no-undef
            return new Status(Status.ERROR, 'ERROR', 'FAILED uploading file with CSV file name : ' + fileName + '\nerror: No file exist');
        }

        var file = exportFile;
        logger.info('Post file location: ' + postFileLocation);
        logger.info('Export file: ' + file);

        // Upload to SFTP
        var svc = reflektionService.get();
        svc.setThrowOnError();
        svc.setOperation('putBinary', [postFileLocation + File.SEPARATOR + file.name, file]);
        // Build credential ID string for service
        var site = Site.getCurrent().getID();
        var serviceName = reflektionHelper.SERVICES.UPLOAD;
        var serviceConfig = {}; // Object to hold credentialID for service
        serviceConfig.credentials = serviceName + '.' + site;
        // Call service, pass in arguments with credentialID, returns success or error
        var feedUploadResult = svc.call(serviceConfig);

        if (feedUploadResult.error) {
            logger.error('Feed upload service error: ' + feedUploadResult.error + ' ' + feedUploadResult.errorMessage);
        }

        if (!feedUploadResult.isOk()) {
            return new Status(Status.ERROR, 'ERROR', 'FAILED uploading file with CSV file name : ' + file.fullPath + '\nerror:' + feedUploadResult.errorMessage);
        } else { // eslint-disable-line no-else-return
            // Archive file
            var archiveFile = new File(reflektionDir.fullPath + File.SEPARATOR + 'Archive');

            if (!archiveFile.exists()) {
                archiveFile.mkdirs();
            }
            var theArchiveFile = new File(archiveFile.fullPath + File.SEPARATOR + file.getName());
            file.renameTo(theArchiveFile);
        }
    } catch (e) {
        var error = e;
        return new Status(Status.ERROR, 'ERROR', 'FAILED Upload failed with catch block. Error message: ' + error.message);
    }
    return new Status(Status.OK, 'OK', 'Upload successful.');
}

module.exports = {
    upload: upload
};
