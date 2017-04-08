import google from 'googleapis';
import auth from '../../auth.js';
import * as lib from '../__lib';

const authPromise = auth.getOauthClient();

const drivePromise = authPromise.then(function(auth) {
    return google.drive({ version: 'v3', auth: auth });
});

/**
 * 
 * @param api
 * @param options
 * @returns {Promise.<Object>}
 */
async function execute(api, options) {
    let drive;

    drive = await drivePromise;

    return await lib.getPromise(drive.files[api], options);
}

function copy(options) {
    return execute('copy', options);
}

/**
 * 
 * @param options
 * @returns {Promise.<Object>}
 */
function create(options) {
    return execute('create', options);
}

let deleteMethod = function (options) {
    return execute('delete', options);
};

function emptyTrash(options) {
    return execute('emptyTrash', options);
}

let exportFunction = function (options) {
    return execute('export', options);
};

function generateIds(options) {
    return execute('generateIds', options);
}

function get(options) {
    return execute('get', options);
}

function list(options) {
    return execute('list', options);
}

/**
 * 
 * @param options
 * @returns {Promise.<Object>}
 */
function update(options) {
    return execute('update', options);
}

function watch(options) {
    return execute('watch', options);
}

export default { copy
               , create
               , delete : deleteMethod
               , emptyTrash
               , export : exportFunction
               , generateIds
               , get
               , list
               , update
               , watch};
