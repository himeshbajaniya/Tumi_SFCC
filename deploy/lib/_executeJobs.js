/* eslint no-console: ["error", { allow: ["log", "warn", "error"] }] */

'use strict';

// Initialize any modules
const sfccAuth = require('sfcc-ci').auth;
const sfccJob = require('sfcc-ci').job;
const configUtils = require('./_configUtils');
const { logHeading, logError } = require('./_log');

/**
 * @function buildParameters
 * @description It modifies the passed job parametres into excutable format.
 * @param  {array} jobParams Represents the required parametres for the job
 * @returns {array} executable jobs params array
 */
function buildParameters(jobParams) {
    var params = [];

    if (jobParams && jobParams.length > 0) {
        for (let i = 0; i < jobParams.length; i++) {
            var split = jobParams[i].split('=');
            params.push({
                name: split[0],
                value: (split.length > 1 ? split[1] : null)
            });
        }
    }
    return params;
}

/**
 * @function executeJobs
 * @description It executes jobs for Search-Indexing and for cache invalidation.
 * @param {string} configFile Represents the optional name of a instance to process
 * @param {string} jobId Represents the ID for the job to be executed
 * @param {array} jobParams Represents the required parametres for the job
 * @param {env} env the target environment/host
 * @param {string} cid Represents the clientid for auth
 * @param {string} cs Represents the clientsecret for auth
 */
function executeJobs({ configFile, jobId, jobParams, env, cid, cs }) {
    logHeading('Jobs Execution Folder');
    const configObj = configUtils.getConfig({ configFile, env });
    const hostName = configObj.hostname;
    const formattedJobParams = buildParameters(jobParams);

    console.log('Targetted Instance for Job execution : ', hostName);

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
            console.log(' -- Executing Jobs.');

            sfccJob.run(hostName, jobId, { parameters: formattedJobParams }, token, function (err, res) {
                if (!err && (res.statusCode === 200 || res.statusCode === 202) && !res.fault) {
                    console.log(' -- Job Execution completed sucessfully.');
                } else {
                    logError('Job Execution failed with error : ', err);
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
module.exports = executeJobs;
