/* eslint no-console: ["error", { allow: ["log", "warn", "error"] }] */

'use strict';

// Initialize any modules
const fs = require('fs-extra');
const file = require('fs');
const sfccAuth = require('sfcc-ci').auth;
const sfccCode = require('sfcc-ci').code;
const configUtils = require('./_configUtils');
const { logHeading, logError } = require('./_log');
/**
 * @function deployCartridges
 * @description Attempts to deploy zip of all cartridges.
 * @param {string} releaseName Represents the optional name of a release to process
 * @param {string} configFile Represents the optional name of a instance to process
 * @param {env} env the target environment/host
 * @param {string} cid Represents the clientid for auth
 * @param {string} cs Represents the clientsecret for auth
 * @param {boolean} activate Activates the code version in the instance
 * @param {string} pfx The path to the certificate to authenticate to the instance
 * @param {string} passphrase The passphrase associated with the given certificate
 * @param {boolean} keep Keep the zip archive after deployment, typically used for CI environments looking to store the artifact
 */
function deployCartridges({ releaseName, configFile, env, cid, cs, activate, pfx, passphrase, keep }) {
    logHeading(' Deploying Cartridges Folder');
    const configObj = configUtils.getConfig({ configFile, env });
    var hostName = configObj.hostname;

    console.log('Targetted Instance for Deployment : ', hostName);

    var zipPath = './dist/' + releaseName + '.zip';
    var filesPath = './dist/' + releaseName;
    if (!file.existsSync(zipPath)) {
        throw new Error(`${zipPath} file is missing.`);
    }

    // Use auth arguments, fallback to dwjson if not available
    let clientID = cid;
    let clientSecret = cs;
    if (!cid || !cs) {
        const dwjson = require('./_dwjson').init();
        clientID = dwjson['client-id'];
        clientSecret = dwjson['client-secret'];
    }
    sfccAuth.auth(clientID, clientSecret, (err, token) => {
        if (token) {
            console.log('Authentication succeeded.');
            console.log(' -- deploying cartridges.');
            sfccCode.deploy(hostName, zipPath, token, { pfx, passphrase }, function (er) {
                if (!er) {
                    console.log(' -- cartridge deployment succeeded.');
                    if (activate === true) {
                        sfccCode.activate(hostName, releaseName, token, function (error) {
                            if (error) {
                                logError(' -- code version activation failed. : ', error);
                            } else {
                                console.log(' -- code version activated. : ', releaseName);
                            }
                        });
                    }
                    if (!keep) {
                        fs.remove(zipPath, function (remErr) {
                            if (remErr) {
                                console.log(' -- unable to remove file : ', zipPath);
                            } else {
                                fs.remove(filesPath, function (remError) {
                                    if (remError) {
                                        logError(' -- unable to remove file : ', filesPath);
                                    } else {
                                        console.log(' -- successfully removed the files');
                                    }
                                });
                            }
                        });
                    }
                } else {
                    logError('Deployment failed with error : ', er);
                }
            });
        }
        if (err) {
            logError('Authentication error : ', err);
            process.exit(1);
        }
    });
}

// Export the function
module.exports = deployCartridges;
