const file = require('fs');
const path = require('path');

/**
 * @function getHostName
 * @description Attempts to retreive the hostname value config, sandbox and empty values fallback to dw.json value
 * @param {json} config config object
 * @param {string} env environment key
 * @returns {string} hostname value
 */
function getHostName(config, env) {
    if (env !== 'sandbox' && env in config.hosts) {
        return config.hosts[env].hostname;
    }

    const dwJson = require('./_dwjson').init();
    if (dwJson.hostname) {
        return dwJson.hostname;
    }

    return false;
}

/**
 *
 * @param {json} configObj JSON configuration object
 * @param {string} env target environment key
 * @returns {array} list of data directories
 */
function getDataset(configObj, env) {
    // Get references to datasets from hosts object
    const datasetReferences = configObj.hosts[env].dataset || [];
    // Put the referenced paths into a list
    const dataset = datasetReferences.map((i) => {
        const dir = configObj['site-data'][i];
        if (dir === undefined) {
            throw new Error(`The ${i} dataset reference does not exist as a property of site-data.`);
        }
        return dir.split(',').map((x) => x.trim());
    });

    // Return flat array
    return [].concat(...dataset);
}

/**
 *
 * @param {string} configFile name of JSON config file within ./bin/config
 * @param {string} env the target environment, defaults to sandbox
 * @returns {Object} config object
 */
function getConfig({ configFile, env = 'sandbox' }) {
    if (!file.existsSync(path.resolve('__dirname', '../deploy/config/', configFile.replace('.json', '') + '.json'))) {
        throw new Error(`${configFile} file is missing.`);
    }

    const configObj = require('../config/' + configFile);
    const hostname = getHostName(configObj, env);
    const dataset = getDataset(configObj, env);
    const cartridges = [].concat(configObj.cartridges);

    return {
        env,
        hostname,
        dataset,
        cartridges
    };
}

module.exports = {
    getConfig,
    getDataset,
    getHostName
};
