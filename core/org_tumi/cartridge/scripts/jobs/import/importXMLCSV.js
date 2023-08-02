'use strict';

var Logger = dw.system.Logger.getLogger('ImportCSV', 'ImportCSV');
var File = require('dw/io/File');

importPackage(dw.system);
importPackage(dw.io);
importPackage(dw.util);

var DEBUG_LEVEL = 1;
var import_without_issues = true;


/**
 * Custom customer import using CSV files 
*/

exports.execute = function(parameters, jobStepExecution, mainImport) {
    try {
        var ImportFolder = parameters.ImportFolder;
        var FilePattern = parameters.FilePattern;
        var ArchiveFolder = parameters.ArchiveFolder;
        var ArchiveFiles = parameters.ArchiveFiles;
        var ImportType = parameters.ImportType;
        var maxRecordPerFile = parameters.MaxRecordPerFile; 
        if (parameters.DebugLevel) {
           DEBUG_LEVEL = parameters.DebugLevel;
        }

        debug(StringUtils.format("Importing from folder {0}", File.IMPEX + ImportFolder), 1);
        
        var file = new File(File.IMPEX + ImportFolder);
        
        var fileNames = file.list();
        fileNames.sort();
        
        for (var i = 0; i < fileNames.length; ++i) {
            debug(StringUtils.format("File {0}", fileNames[i]), 2);
            if (fileNames[i].match(FilePattern)) {

                debug(StringUtils.format("Importing file {0} - {1}", i, fileNames[i]), 1);
                
                import_without_issues = import_without_issues && processFile(File.IMPEX + ImportFolder + fileNames[i], mainImport.IMPORT_TYPES[ImportType], mainImport, maxRecordPerFile, parameters);
                
                if (ArchiveFiles) {
                  // archive CSV file 
                  var archFile = new File(File.IMPEX + ImportFolder + fileNames[i]);
                  if (archFile.exists() && archFile.isFile()) {
                     var archiveFileName = File.IMPEX + ArchiveFolder + jobStepExecution.jobExecution.jobID + "_" + jobStepExecution.stepID + "_" + StringUtils.formatCalendar(System.getCalendar(), "yyyyMMdd_HHmmssSSS") + "_" + Site.current.name + "_" + fileNames[i];
                     var archiveFile = new File(archiveFileName);
                     debug(StringUtils.format("Archive to {0}", archiveFileName), 1)
                     archFile.renameTo(archiveFile);
                  }
                }
            }
        }

        if (!import_without_issues) {
            return new Status(Status.ERROR);
        }

        return new Status(Status.OK);
        
    } catch (e) {
        error(e);
    }
    
    return new Status(Status.OK);
};


/*
 * Process CSV file given a data type definition object 
 * that maps what columns we want to import and what columns are also mandatory
 */
function processFile(fileName, importType, mainImport, maxRecordPerFile, parameters) { 
    debug(StringUtils.format("processing {0}", fileName), 2)
    
    var file = new File(fileName);
    var fileReader = new FileReader(file, 'UTF-8');
    var csvReader : CSVStreamReader = new CSVStreamReader(fileReader);
    var importDataType = mainImport[importType.definition_data];
    var importTypeFct = importType.import_method;
    var importObject = new HashMap();;
    if (importType.preCall) {
        importObject = mainImport[importType.preCall]();
    }
    
    var missingValuesRecords = 0;
    
    var fileIndex = 1;
    var newFileName = fileName.replace(".csv", "_" + fileIndex + ".xml");
	debug(StringUtils.format("create {0}", newFileName), 2);
        
	var newFile = new File(newFileName);
	if (newFile.exists()) {
		newFile.remove();
		newFile = new File(newFileName);
	}
	var fileWriter : FileWriter = new FileWriter(newFile, "UTF-8");
	
    var workingXmlStream = mainImport["getXMLStreamWriter"](fileWriter);
    var success = true;    
    try {
        var currentLine = csvReader.readNext();
        debug(StringUtils.format("processing headers {0}", flatten(currentLine)), 4);
        var headers;
        if (currentLine) {
            headers = processHeaders(currentLine, importDataType);
        }
        
        currentLine = csvReader.readNext();
        var i = 0;
        while (currentLine && missingValuesRecords < 5) {
            debug(StringUtils.format("currentLine is {0}", flatten(currentLine)), 4);
            
            var lineObject = new Object();
            
            // Calculate column values
            for (var key in importDataType) {
           		lineObject[importDataType[key].property] = currentLine[headers[key]];
            }
        
            for (var key in lineObject) {
                debug(StringUtils.format("{0} - {1} - {2}", i, key, lineObject[key]), 4);
            }

            // Check if all required properties have value
            var requiredValuesMissing = false;
            for (var key in importDataType) {
                if (importDataType[key].required && (lineObject[importDataType[key].property] == undefined || lineObject[importDataType[key].property] == "")) {
                    requiredValuesMissing = true;
                    warn(StringUtils.format("Property {0} for {1} missing on row {2}", key, importDataType[key].property, i));
                }
            }
            
            debug(StringUtils.format("lineObject is {0}", flatten(lineObject)), 4);

            if (!requiredValuesMissing) {
                if (importType.call) {
                    mainImport[importType.call](importObject, lineObject, importDataType);
                    //debug(StringUtils.format("importObject is {0}", flatten(importObject)), 4);
                }

                mainImport[importTypeFct](workingXmlStream, lineObject, parameters, this);

            } else {
                missingValuesRecords++;
                warn(StringUtils.format("This line is ignored due to missing required fields for this line: {0}", flatten(currentLine)));
                warn(StringUtils.format("This line is ignored due to missing required fields: {0}", flatten(lineObject)));
                
                if (missingValuesRecords >= 5) {
                    warn("\n\nReached maximum number of records with missing required fields.\nNo other records will be imported\n\n");
                }
            }
            
            currentLine = csvReader.readNext();
            i++;
			debug("Line " + i, 0);    
			if (i % 100 == 0) {
				workingXmlStream.flush();
			}
			        
            if (i % maxRecordPerFile == 0) {
            	
            	mainImport["closeXMLStreamWriter"](fileWriter, workingXmlStream);
            	
		        fileIndex++;
		        var newFileName = fileName.replace(".csv", "_" + fileIndex + ".xml");
		        
		        debug(StringUtils.format("create {0}", newFileName), 0);
        
				var newFile = new File(newFileName);
        		if (newFile.exists()) {
            		newFile.remove();
            		newFile = new File(newFileName);
        		}
        
        		var fileWriter : FileWriter = new FileWriter(newFile, "UTF-8");
    			var workingXmlStream = mainImport["getXMLStreamWriter"](fileWriter);     		
            }
        }
        

        if (importType.postCall) {
            mainImport[importType.postCall](importObject, workingXmlStream);
        }
        
        mainImport["closeXMLStreamWriter"](fileWriter, workingXmlStream);
        
        
    } catch (e) {
    	success = false; 
        error(e);
    } finally {
        if (csvReader) {
            csvReader.close();
        }
        if (fileReader) {
            fileReader.close();
        }
    }
    
    return success;
};


/*
 * Ensure we have a map woth this key in current map
 * if not create it
 */
function getMap(currentMap, key) {
    var keyMap = currentMap.get(key);
    if (keyMap == null) {
        keyMap = new SortedMap();
        currentMap.put(key, keyMap);
    }
    
    return keyMap;
}

/*
 * Ensure we have a arraylist woth this key in current map
 * if not create it
 */
function getArray(currentMap, key) {
    var keyArray = currentMap.get(key);
    if (keyArray == null) {
        keyArray = new ArrayList();
        currentMap.put(key, keyArray);
    }
    
    return keyArray;
};

/*
 * Extract data headers from CSV file
 *
 */
function processHeaders(headerLine, importDataType) {
    var headers = new Object();
        
    for (var key in importDataType) {
        var found = false;
        for (var i = 0; i < headerLine.length; i++) {
            debug(StringUtils.format("{0} - {1}", headerLine[i], key), 3);
            
            if (headerLine[i].trim() == key) {
                headers[key] = i;
                found = true;
                break;
            }
        } 
        if (!found) {
            if (!importDataType[key].required) {
               delete importDataType[key];
            }
        }
    }
    
    debug(StringUtils.format("Using the following headers: {0}", flatten(headers)), 3)
    
    return headers;
};

/*
 * Debugging based on level set up at job level
 */
function debug(str, level) {
    if (level <= DEBUG_LEVEL) {
        Logger.info(str);
    }
}

/*
 * Warning 
 */
function warn(str) {
	import_without_issues = false;
    Logger.warn(str);
};

/*
 * Customized error logging
 */
function error(e) {
    import_without_issues = false;
    Logger.error(e.message);
    Logger.error(e.stack);  
};


function isEmpty(str) {
    return (str == null || str == "" || str.trim() == "");
};

function flatten(obj) {
    let str = "{";
    let first = true;
    
    try {
        for (var property in obj) {
        	
        	if (str.length > 10000) {
        		return str + "}";
        	}
            if (typeof obj[property] == "function") {
                continue;
            }
        
            //str += property + " type:: " + (typeof obj[property]);
                
            if (typeof obj[property] == "object") {
                if (typeof obj[property] !== "undefined") {
                    v = flatten(obj[property]);
                    if (v != null) {
                        str += first ? "" : ",";
                        str += '"' + property + '"' + ":" + v;
                        first = false;
                    }
                }
            } else {
                if (typeof obj[property] !== "undefined") {
                    str += first ? "" : ",";
                    str += '"' + property + '"' + ":" + '"' + obj[property] + '"';
                    first = false;
                }
            }
        }
    } catch (e) {
        Logger.error(e.stack);
    }
    
    str += "}";
        
    if (str == "{}") {
        return null;
    }
    
    return str;
};
