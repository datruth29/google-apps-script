const google = require('googleapis');
const fs = require('fs');
const sanitize = require('sanitize-filename');
const colors = require('colors');
const constants = require('../constants.js');
const listScriptFiles = require('./listScriptFiles.js');
const displayCheckbox = require('./displayCheckbox.js');

/**
 * Get the metadata of a file with a given id
 *
 * @param {google.auth.OAuth2} auth - An authorized OAuth2 client.
 * @param {string} identifier - Identifier we want to get data from, could be id or a name.
 * @returns {Promise} - A promise resolving metadata of the project
 */
function getMetadata(auth, identifier) {
    return new Promise((resolve, reject) => {
        // Test if identifier is an id
        listScriptFiles(auth, null, false, null, []).then((files) => {
            for (const file of files) {
                if (file.id === identifier) {
                    resolve(file);
                    return;
                }
            }

            // Identifier did not match an id
            listScriptFiles(auth, identifier, false, null, []).then((files) => {
                if (files.length === 0) { // 0 results
                    const err = {
                        message: `No project with name or id '${identifier}' found in your Google Drive`,
                        output: false,
                    };
                    process.stdout.write(`No project with name or id '${identifier}' found in your Google Drive`);
                    displayCheckbox('red');
                    console.log('Use \'gas list\' to show all the projects in your Google Drive.');
                    reject(err);
                    return;
                } else if (files.length === 1) { // 1 result
                    const result = files[0];
                    if (result.name === identifier) {
                        result.name = sanitize(result.name);
                        resolve(result);
                        return;
                    } else {
                        // Check for exact match if exists
                        const err = {
                            message: `No exact match with name or id '${identifier}' found in your Google Drive`,
                            output: false,
                        };
                        process.stdout.write('No exact match found in your Google Drive');
                        displayCheckbox('red');
                        console.log(`Did you perhaps mean: '${result.name}'?`);
                        reject(err);
                        return;
                    }
                } else { // More than 1 result
                    const exactMatches = [];
                    for (const match of files) {
                        if (match.name === identifier) {
                            exactMatches.push(match);
                        }
                    }
                    if (exactMatches.length === 0) { // 0 results
                        const err = {
                            message: `No project called '${identifier}' found in your Google Drive`,
                            output: false,
                        };
                        process.stdout.write(`No project called '${identifier}' found in your Google Drive`);
                        displayCheckbox('red');
                        console.log('Did you mean one of these projects? :');
                        for (const file2 of files) {
                            console.log("[%s] %s", file2.id, file2.name);
                        }
                        reject(err);
                        return;
                    } else if (exactMatches.length === 1) { // 1 result
                        exactMatches[0].name = sanitize(exactMatches[0].name);
                        resolve(exactMatches[0]);
                        return;
                    } else {
                        const err = {
                            message: `Multiple projects called '${identifier}' found in your Google Drive`,
                            output: false,
                        };
                        process.stdout.write(`Multiple projects called '${identifier}' found in your Google Drive`);
                        displayCheckbox('red');
                        console.log('Use \'gas rename <fileId> <newName>\' to rename projects so they have a unique name or use the fileId as identifier');
                        for (const exactMatch of exactMatches) {
                            console.log("[%s] %s", exactMatch.id, exactMatch.name);
                        }
                        reject(err);
                        return;
                    }
                }
            }).catch((err) => {
                reject(err);
                return;
            });
        }).catch((err) => {
            reject(err);
            return;
        });
    });
}

module.exports = getMetadata;
