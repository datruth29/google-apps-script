const authenticate = require('./functions/authenticate.js');
const getMetadata = require('./functions/getMetadata.js');
const remoteDeleteProject = require('./functions/remoteDeleteProject.js');
const handleError = require('./functions/handleError.js');
const displayCheckbox = require('./functions/displayCheckbox.js');
const readline = require('readline');
const checkNewVersion = require('./functions/checkNewVersion.js');

/**
 * Delete a Google Apps Script project from your Google Drive
 *
 * @param {string} identifier - Identifier of the remote project to link to the current folder.
 * @returns {void}
 */
module.exports = (identifier) => {
    const checkedVersion = checkNewVersion();
    const gotAuth = authenticate([]);

    checkedVersion.then(() => {
        process.stdout.write(`Deleting \'${identifier}\' from your Google Drive...`);
    });


    const gotMetadata = Promise.all([gotAuth, checkedVersion, ]).then((values) => {
        return getMetadata(values[0], identifier);
    });

    const deleted = Promise.all([gotAuth, gotMetadata, ]).then((values) => {
        const metadata = values[1];
        process.stdout.clearLine();
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(`Deleting \'${metadata.name}\' from your Google Drive...`);
        return remoteDeleteProject(values[0], metadata.id, metadata.name);
    });

    const finished = deleted.then(() => {
        displayCheckbox('green');
        return;
    });

    // Catch all the errors
    Promise.all([gotAuth, gotMetadata, deleted, checkedVersion, finished, ]).catch((err) => {
        handleError(err, true);
        return;
    });
};
