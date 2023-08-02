'use strict';

// Initialize any modules
const fs = require('fs-extra');
const configUtils = require('./_configUtils');
const { logHeading } = require('./_log');

/**
 * @function prepareCartridges
 * @description Attempts to collect all cartridges from cartridges.json into a single release folder.
 * @param {string} releaseName  Represents the optional name of a release to process
 * @param {string} configFile  Represents the name of the configFile
 * @param {string} env  Represents the name of an environment to deploy
*/
function prepareCartridges({ releaseName, configFile, env }) {
    logHeading(' Preparing Cartridges');

    console.log(` -- code deployment name: ${releaseName}`);
    console.log(` -- config file: ${configFile}`);
    console.log('');

    const configObj = configUtils.getConfig({ configFile, env });
    var cartridgePaths = configObj.cartridges;
    console.log(' -- cartridge configuration found:');
    console.log(`${cartridgePaths}\n`);

    // @TODO use path to figure out working directory so command can be run from anywhere in repo

    // Create folder paths
    var distDir = './dist/';
    var codeVersionDir = distDir + releaseName + '/' + releaseName;

    console.log(` -- code version directory: ${codeVersionDir}`);
    console.log('');

    // Validate and create dist folder
    fs.ensureDirSync(distDir);

    // Create or empty code deployment directory
    fs.emptyDirSync(codeVersionDir);

    // Copy all cartridges into /dist/build/cartridges folder
    // Uses async fs.copy because we don't care what order they're copied in
    cartridgePaths.forEach(cartridge => {
        let cartridgeFolderName = cartridge.split('/');

        let cartridgeName = cartridgeFolderName[cartridgeFolderName.length - 1];
        let destinationFolder = codeVersionDir + '/' + cartridgeName;

        fs.copySync(cartridge, destinationFolder);
        console.log(` -- copied ${cartridgeName}`);
    });
}

// Export the function
module.exports = prepareCartridges;
