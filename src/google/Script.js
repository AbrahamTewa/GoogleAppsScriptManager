import google from 'googleapis';
import auth from '../auth.js';
import * as lib from './__lib';

const authPromise = auth.getOauthClient();

const scriptPromise = authPromise.then(function(auth) {
    return google.script({ version: 'v1', auth: auth });
});

/**
 *
 * @param {string} api
 * @param {Object} options
 * @returns {Promise.<Object>}
 */
function getPromise(api, options) {
    return scriptPromise.then(function(script) {
        return lib.getPromise(script.scripts[api], options);
    });
}

function run(options) {
    return getPromise('run', options);
}

const methods = {run};

export default methods;
