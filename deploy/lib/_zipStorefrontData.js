/* eslint-disable no-unused-vars */
'use strict';

// Initialize any modules
const fs = require('fs-extra');
const zip = require('zip-a-folder').zip;
const file = require('fs');
const path = require('path');
const configUtils = require('./_configUtils');
const validateStorefrontData = require('./_validateStorefrontData');

/**
 * Copies a directory to a destination, then archives it, then removes the copied directory.
 * @param {string | array} directoriesToZip a directory or list of directories to archive
 * @param {string} releaseName the name associated with the data used as a filename segment
 * @param {*} destination the target directory to place the archive, defaults to './dist'
 * @returns {promise} resolves when all async functions are complete
*/
async function zipAndCleanDirs(directoriesToZip, releaseName, destination = './dist') {
    Promise.all([].concat(directoriesToZip).map(async (dir, idx) => {
        if (file.existsSync(path.resolve(dir))) {
            console.log(` -- resolving ${dir}`);
            const sourceDirectory = dir.replace(/\/$/, '');
            const dynamicDirName = `${idx}-${releaseName}${sourceDirectory.replace(/\.\/|\//gm, '-')}`;
            const targetDirectory = `${destination}/site-import-${releaseName}/${dynamicDirName}`;
            const zipFileOutput = `${targetDirectory}.zip`;

            // Validate files to make sure we're not uploading unwated data
            const validationErrors = validateStorefrontData(dir);
            if (validationErrors.length) {
                throw new Error(`Storefront data errors, ${validationErrors.toString()}`);
            }

            // Copy source directory
            fs.copySync(sourceDirectory, `${targetDirectory}/${dynamicDirName}`);
            console.log(` -- copied ${sourceDirectory} to ${targetDirectory}/${dynamicDirName}`);

            // Zip it up!
            await zip(targetDirectory, zipFileOutput);
            console.log(` -- file written to ${zipFileOutput}`);

            fs.remove(targetDirectory, function (remErr) {
                if (!remErr) {
                    console.log(' -- removed directory : ', targetDirectory);
                } else {
                    console.log(' -- warning: unable to remove directory : ', targetDirectory);
                }
            });
        } else {
            throw new Error(`${dir} is not a valid directory.`);
        }
    }));
}

/**
 *
 * @param {string} releaseName used to identify the release
 * @param {string} configFile the realm config data
 * @param {env} env the target environment/host
 */
async function zipStorefrontData({ releaseName, configFile, env }) {
    console.log('-----------------------------------');
    console.log(' Preparing Store Data Import');
    console.log('-----------------------------------\n');

    const configObj = configUtils.getConfig({ configFile, env: env });
    console.log(` -- using config file ${configFile}`);
    console.log(` -- copying and archiving [${configObj.dataset}]`);
    await zipAndCleanDirs(configObj.dataset, releaseName, './dist').catch((e)=>{
        console.log(e);
        process.exit(1);
    });
    console.log(' -- archiving complete!');
}

// Export the function
module.exports = zipStorefrontData;
