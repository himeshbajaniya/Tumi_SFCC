'use strict';

var Logger = dw.system.Logger.getLogger('unzip', 'unzip');
var File = require('dw/io/File');

importPackage(dw.system);
importPackage(dw.io);
importPackage(dw.util);


/**
 * Unzip files 
*/

exports.execute = function(parameters, jobStepExecution) {
    try {
        var ImportFolder = parameters.ImportFolder;
        var FilePattern = parameters.FilePattern;
        var ArchiveFolder = parameters.ArchiveFolder;
        var ArchiveFiles = parameters.ArchiveFiles;
        
        var file = new File(File.IMPEX + ImportFolder);
        var fileNames = file.list();
        
        for (var i = 0; i < fileNames.length; ++i) {
            if (fileNames[i].match(FilePattern)) {

                
                var zipFile = new File(File.IMPEX + ImportFolder + fileNames[i]);
                var folder = new File(File.IMPEX + ImportFolder);
                zipFile.unzip(folder);
                
                if (ArchiveFiles) {
                  // archive CSV file 
                  var archFile = new File(File.IMPEX + ImportFolder + fileNames[i]);
                  if (archFile.exists() && archFile.isFile()) {
                     var archiveFileName = File.IMPEX + ArchiveFolder + jobStepExecution.jobExecution.jobID + "_" + jobStepExecution.stepID + "_" + StringUtils.formatCalendar(System.getCalendar(), "yyyyMMdd_HHmmssSSS") + "_" + Site.current.name + "_" + fileNames[i];
                     var archiveFile = new File(archiveFileName);
                     archFile.renameTo(archiveFile);
                  }
                }
            }
        }

        return new Status(Status.OK);
        
    } catch (e) {
    	Logger.error(e.message);
    	Logger.error(e.stack);
    }
    
    return new Status(Status.ERROR);
};