'use strict';
const fs = require('fs');
const path = require('path');
const DISALLOWED_FILES = ['users.xml', 'client_permissions.json', 'wapi_data_config.json'];

/**
 * Recursively gets all files in a directory
 * @param {string} dir the directory to search
 * @returns {array} a list of files
 */
function getAllFiles(dir) {
    let files = [];
    const getFilesRecursively = (directory) => {
        const filesInDirectory = fs.readdirSync(directory);
        for (const file of filesInDirectory) {
            const absolute = path.join(directory, file);
            if (fs.statSync(absolute).isDirectory()) {
                getFilesRecursively(absolute);
            } else {
                files.push(absolute);
            }
        }
    };
    getFilesRecursively(dir);
    return files;
}

/**
 * Iterates over files provided to find disallowed files by name
 * @param {array} files to check
 * @param {array} disallowedFiles a list of file names to disallow
 * @returns {array} a list invalid files
 */
function validateDisallowedFiles(files, disallowedFiles) {
    return files.filter((f) => {
        // Everything within sites is ok
        if (f.indexOf('sites/') > -1) {
            return false;
        }
        const fileName = f.split('/').pop();
        return disallowedFiles.indexOf(fileName) > -1;
    }).map((f) => {
        return `Please remove ${f} from the storefront data as it will override critical data in the target environment.`;
    });
}

module.exports = (dir) => {
    let issues = [];
    const files = getAllFiles(dir);
    issues = [...issues, ...validateDisallowedFiles(files, DISALLOWED_FILES)];
    return issues;
};
