/* eslint-disable no-console */

'use strict';

// Initialize any modules
const zip = require('zip-a-folder').zip;
const { logHeading } = require('./_log');
/**
 * @function zipCartridges
 * @description Attempts to zip all cartridges into a single release bundle.
 * @param {string} releaseName Represents the optional name of a release to process
 */
async function zipCartridges(releaseName) {
    logHeading(' Zipping Cartridges Folder');

    // make release path and filenames
    var basePath = './dist/' + releaseName;
    var zipPath = './dist/' + releaseName + '.zip';

    // @TODO check if folder exists and throw an error if it doesn't

    // Debugging: Output the details of the archive process
    console.log(` -- archiving ${basePath}`);
    console.log(` -- writing file to ${zipPath}`);

    // zip all cartridges
    await zip(basePath, zipPath);
    console.log(` -- ${zipPath}.zip successfully created!`);
}

// Export the function
module.exports = zipCartridges;
