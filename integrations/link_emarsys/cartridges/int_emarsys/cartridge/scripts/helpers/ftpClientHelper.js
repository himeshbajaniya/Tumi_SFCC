'use strict';

/**
 * @description (S)FTP service methods (upload files)
 */

var File = require('dw/io/File');
var Logger = require('dw/system/Logger');

var jobHelper = require('*/cartridge/scripts/helpers/jobHelper');

var DownloadLogger = Logger.getLogger('cs.job.FtpDownload');
var UploadLogger = Logger.getLogger('cs.job.FtpUpload');

/**
 * @description Holds the constructor of the FtpClientHelper
 * @constructor
 *
 * @param {dw.svc.Service} service The service instance to use.
 */
function FtpClientHelper(service) {
    this.service = service;
}

/**
 * @description Removes a file from the SFTP server.
 * @param {string} remoteFilePath The full remote file path of the file to delete.
 * @throws {Error} If file could not be deleted.
 */
FtpClientHelper.prototype.removeRemoteFile = function (remoteFilePath) {
    DownloadLogger.info('Removing {0}...', remoteFilePath);

    var serviceResult = this.service.call('del', remoteFilePath);
    var isRemoveSuccessful = serviceResult.getObject();
    if (!serviceResult.isOk() || !isRemoveSuccessful) {
        throw new Error('SFTP Service: couldn\'t remove file: ' + remoteFilePath + ' error: ' + serviceResult.getErrorMessage());
    }

    DownloadLogger.info('File {0} successfully removed.', remoteFilePath);
};


/**
 * @description Change the CWD on the FTP Server. Creates directory if missing (but not parent folders)
 * @param {string} targetFolder The target folder
 * @returns {string} .
 */
FtpClientHelper.prototype.enterDirectory = function (targetFolder) {
    var targetFolderStr = targetFolder.charAt(0) === File.SEPARATOR ? targetFolder.substring(1) : targetFolder;
    var folders = targetFolder.split('/');
    var dirExists = this.service.call('cd', targetFolderStr);
    if (!dirExists.isOk()) {
        try {
            this.service.getClient().connect(this.service.getConfiguration().getCredential().getURL(), this.service.getConfiguration().getCredential().getUser(), this.service.getConfiguration().getCredential().getPassword());
            for (var index = 0; index < folders.length; index++) {
                var element = folders[index];
                if (element) {
                    this.service.getClient().mkdir(element);
                    this.service.getClient().cd(element);
                }
            }
        } catch (error) {
            dw.system.Logger.error('Could not change to target folder. Please check is folder or parent folders exist on the remote server.', error);
            return new dw.system.Status(dw.system.Status.ERROR, 'ERROR');
        }
    }
};

/**
 * @descriptionCopy (and archive locally) a file to the remote FTP-Target-Folder
 * @param {string} targetFolder The full remote file path where to upload the file.
 * @param {dw.io.File} file The file to copy
 * @param {boolean} archiveFolder The archive folder where to move file after a successful upload
 * @throws {Error} If file could not be uploaded.
 */
FtpClientHelper.prototype.uploadFile = function (targetFolder, file, archiveFolder) {
    var remoteFilePath = targetFolder + file.getName();
    UploadLogger.info('Uploading {0} to {1}...', file, remoteFilePath);

    var serviceResult = this.service.call('putBinary', remoteFilePath, file);
    var isUploadSuccessful = serviceResult.getObject();
    if (!serviceResult.isOk() || !isUploadSuccessful) {
        throw new Error('SFTP Service: couldn\'t upload file: ' + file.getFullPath() + ' error: ' + serviceResult.getErrorMessage());
    }
    UploadLogger.info('File {0} successfully uploaded.', remoteFilePath);

    if (!empty(archiveFolder)) {
        var theArchiveFile = new File(archiveFolder + File.SEPARATOR + file.getName());
        file.renameTo(theArchiveFile);
    }
};

/**
 * @description Returns an array of file paths on the SFTP, filtered by file pattern and sorted by modified time.
 * @param {string} remoteDirectoryPath The directory path on the remote server.
 * @param {string} filePattern File pattern to match against.
 * @param {boolean} recursive flag in step jobs
 * @throws {Error} If cannot list remote files.
 * @returns {Array} Array with full paths of the remote files or null if an error occurred.
 */
FtpClientHelper.prototype.listRemoteFiles = function (remoteDirectoryPath, filePattern, recursive) {
    var sftpFileInfoList;
    if (recursive) {
        this.filePattern = filePattern;
    }

    // get file information from remote folder
    var serviceResult = this.service.call('list', remoteDirectoryPath);
    if (serviceResult.isOk()) {
        sftpFileInfoList = serviceResult.getObject();
    } else {
        throw new Error('SFTP Service: couldn\'t list files: ' + serviceResult.getErrorMessage());
    }

    // filter out files which match the file pattern
    sftpFileInfoList = sftpFileInfoList.filter(function (file) {
        return empty(filePattern) || (!empty(filePattern) && file.getName().match(filePattern) !== null);
    });

    // map to full file paths
    var filePaths = sftpFileInfoList.map(function (file) {
        return (remoteDirectoryPath.charAt(remoteDirectoryPath.length - 1).equals(File.SEPARATOR) ? remoteDirectoryPath : remoteDirectoryPath + File.SEPARATOR) + file.getName();
    });

    return filePaths;
};

/**
 * @descriptionCopy (and archive locally) files to the remote FTP-Target-Folder
 * @param {Array} fileList The list of files to upload.
 * @param {string} currentTargetFolder The full remote file path where to upload the file.
 * @param {boolean} currentArchiveFolder The archive folder where to move file after a successful upload
 * @param {boolean} recursive flag in step jobs
 * @returns {boolean} True of files were found at the specified location.
 */
FtpClientHelper.prototype.uploadFiles = function (fileList, currentTargetFolder, currentArchiveFolder, recursive) {
    var self = this;
    var targetFolder = currentTargetFolder;
    var archiveFolder = currentArchiveFolder;
    if (!empty(archiveFolder)) {
        archiveFolder = File.IMPEX + (archiveFolder.charAt(0).equals(File.SEPARATOR) ? archiveFolder : File.SEPARATOR + archiveFolder);
        jobHelper.createDirectory(archiveFolder);
    }

    targetFolder = targetFolder.charAt(targetFolder.length - 1).equals(File.SEPARATOR) ? targetFolder : targetFolder + File.SEPARATOR;

    // Try to enter in the directory
    // If this task fails, this means that we cannot create the target folder if it does not exists.
    // It will throw an error and abort the step.
    self.enterDirectory(targetFolder);

    fileList.forEach(function (file) {
        if (recursive) {
            if (file.createDirectory) {
                self.enterDirectory(file.targetFile);
            } else {
                self.uploadFile(file.targetFile, file.sourceFile, archiveFolder);
            }
        } else {
            self.uploadFile(targetFolder, new File(file), archiveFolder);
        }
    });

    return true;
};

module.exports = FtpClientHelper;
