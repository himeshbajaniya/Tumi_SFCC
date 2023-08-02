'use strict';

const sfccInstance = require('sfcc-ci').instance;
const sfccJob = require('sfcc-ci').job;
const fs = require('fs-extra');
const { logInfo, logError } = require('./_log');
/**
 * @function uploadData
 * @description Attempts to upload zip of all site data.
 *
 * @param {string} hostName Represents the name of an environment to deploy
 * @param {string} filePath Represents the filePath to deploy data
 * @param {string} token Represents the token used for authentication
 * @param {string} fileUpload Represents the filename
 * @param {Object} options Represents the options (pfx, passphrase)
 * @returns {function} a promise
 */
function uploadData(hostName, filePath, token, fileUpload, options) {
    return new Promise((resolve, reject) => {
        sfccInstance.upload(hostName, filePath, token, options, (er) => {
            if (!er) {
                return resolve({ filePath: filePath, fileUpload: fileUpload });
            }
            return reject({ filePath: filePath, fileUpload: fileUpload, error: er });
        });
    });
}

/**
 * Waits for the job to complete or error out before resolving
 * @param {string} hostName the hostname
 * @param {string} resp the import response
 * @param {string} token the token
 * @param {number} timeout the timeout
 * @returns {function} promise to resolve
 */
function waitForJobToComplete(hostName, resp, token) {
    return new Promise((resolve, reject) => {
        let jobId = resp.job_id;
        let jobExeId = resp.id;
        let timer;
        logInfo(' -- waiting for job to complete...');
        const checkStatus = () => {
            clearTimeout(timer);
            sfccJob.status(hostName, jobId, jobExeId, token, (errjob, jobstatus) => {
                logInfo(` -- job id: ${jobstatus.id}, execution_status: ${jobstatus.status}, duration: ${jobstatus.duration}, start_time: ${jobstatus.start_time}`);
                if (errjob) {
                    reject({ error: errjob });
                }
                if (!errjob && jobstatus) {
                    if ((jobstatus.execution_status === 'finished' && jobstatus.status === 'OK')) {
                        resolve(jobstatus);
                    } else if (jobstatus.execution_status === 'finished' && jobstatus.status === 'ERROR') {
                        reject({ error: jobstatus });
                    } else {
                        setTimeout(checkStatus, 500);
                    }
                }
            });
        };
        checkStatus();
    });
}

/**
 * @function importData
 * @description Attempts to import zip of all site data.
 *
 * @param {string} hostName Represents the name of an environment to deploy
 * @param {string} filePath Represents the filePath to deploy data
 * @param {string} token Represents the token used for authentication
 * @param {string} fileUpload Represents the filename
 * @param {string} timeout Represents the timeout value
 * @returns {function} a promise
 */
function importData(hostName, filePath, token, fileUpload) {
    return new Promise((resolve, reject) => {
        logInfo(` -- import job started: ${fileUpload}`);
        sfccInstance.import(hostName, fileUpload, token, async (error, resp) => {
            if (!error && resp) {
                let jobStatus = await waitForJobToComplete(hostName, resp, token).catch((jobStatusError)=>{
                    reject(jobStatusError);
                });
                logInfo(' -- import job complete');
                resolve(jobStatus);
            } else {
                logError(`Error while importing file : ${error}`);
                reject(error);
            }
        });
    });
}

/**
* @function removeFile
* @description Attempts to remove file from Directory
* @param {string} fileRemove Represents the filepath
* @returns {function} a promise
*/
function removeFile(fileRemove) {
    return new Promise((resolve, reject) => {
        fs.remove(fileRemove, (error) =>{
            if (error) {
                logError(' -- error while removing ', fileRemove);
                return reject(error);
            }
            logInfo(' -- successfully removed ', fileRemove);
            return resolve();
        });
    });
}

// Export the function
module.exports = {
    uploadData,
    importData,
    removeFile
};
