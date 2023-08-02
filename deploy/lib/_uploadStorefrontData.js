/* eslint-disable no-console */

'use strict';

// Initialize any modules
const fs = require('fs-extra');
const file = require('fs');
const path = require('path');

// const path = require('path');
const sfccAuth = require('sfcc-ci').auth;
const uploadImportData = require('./_uploadImportData');
const { logError, logInfo, logSuccess, logHeading } = require('./_log');

/**
 * @function uploadStorefrontData
 * @description Attempts to upload zip of all site data.
 * @param {string} releaseName  Represents the name of a release to process
 * @param {string} config Represents the name of a realm config to process
 * @param {string} env  Represents the name of an environment to deploy
 * @param {string} cid  Represents the clientid for auth
 * @param {string} csecret  Represents the clientsecret for auth
 * @param {string} timeout  Represents the timeout value
 * @param {string} pfx  the path to the client certificate to use for two factor authentication
 * @param {string} passphrase  the optional passphrase to use with the client certificate
 */
function uploadStorefrontData({ releaseName, configFile, env, cid, cs, timeout, pfx, passphrase }) {
    logHeading(' Uploading Site Data');

    const configObj = require('./_configUtils').getConfig({ configFile, env });

    const hostname = configObj.hostname;
    if (!hostname) {
        throw new Error('A hostname was is required.');
    }
    console.log(`Uploading data to ${hostname}`);

    let filesPath = `${process.cwd()}/dist/site-import-${releaseName}`;

    if (!file.existsSync(filesPath)) {
        throw new Error(`${filesPath} file is missing.`);
    }

    let clientID = cid;
    let clientSecret = cs;
    if (!cid || !cs) {
        const dwjson = require('./_dwjson').init();
        clientID = dwjson['client-id'];
        clientSecret = dwjson['client-secret'];
    }

    sfccAuth.auth(clientID, clientSecret, async (err, token) => {
        if (token) {
            console.log('Authentication succeeded.');
            // Function to get current filenames in directory
            let filenames = fs.readdirSync(filesPath).filter((f) => {
                return path.extname(f).toLowerCase() === '.zip';
            });

            logInfo(`Total files in directory : ${filenames.length}`);

            for (let i = 0; i < filenames.length; i++) {
                console.log(`Processing ${i + 1} of ${filenames.length}`);
                try {
                    // Upload Zip
                    logInfo(` -- uploadData ${filenames[i]}`);

                    await uploadImportData.uploadData(hostname, filesPath + '/' + filenames[i], token, filenames[i], { pfx, passphrase }).catch((uploadError)=>{
                        logError(`Error: Unable to upload data. ${uploadError}`);
                        process.exit(1);
                    });

                    // Import Job
                    console.log(` -- importData ${filenames[i]}`);
                    await uploadImportData.importData(hostname, filesPath + '/' + filenames[i], token, filenames[i], timeout).catch((importError)=>{
                        logError(`Error: Unable to import data. ${JSON.stringify(importError, null, 2)}`);
                        process.exit(1);
                    });

                    // Remove zip
                    console.log(` -- removeFile ${filenames[i]}`);
                    await uploadImportData.removeFile(filesPath + '/' + filenames[i]).catch((removeError)=>{
                        logError(`Error: Unable to remove file. ${removeError}`);
                    });

                    // Remove directory
                    let filesLeft = fs.readdirSync(filesPath);
                    if (filesLeft.length === 0) {
                        fs.remove(filesPath, function (remDirError) {
                            if (remDirError) {
                                logError(` -- error while removing ${filesPath}`);
                            } else {
                                console.log(` -- successfully removed ${filesPath}`);
                            }
                        });
                    }

                    console.log(` -- done processing ${filenames[i]}`);
                } catch (e) {
                    throw new Error(e);
                }
            }

            logSuccess('Data uploaded and imported successfully.');
        }
        if (err) {
            logError(`Authentication error ${err}`);
            process.exit(1);
        }
    });
}

// Export the function
module.exports = uploadStorefrontData;
