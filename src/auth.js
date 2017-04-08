import fs         from './lib/fs';
import os         from 'os';
import readline   from 'readline';
import GoogleAuth from 'google-auth-library';

// ******************** Module variables ********************

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/drive-nodejs-quickstart.json
let SCOPES     = ['https://www.googleapis.com/auth/drive'
                 ,'https://www.googleapis.com/auth/drive.scripts'];
let TOKEN_DIR  = os.homedir() + '/.credentials/';
let TOKEN_PATH = TOKEN_DIR + 'drive-nodejs-quickstart.json';

let authPromise;

// ******************** Functions ********************

/**
 *
 * @returns {Promise.<OAuth2Client>}
 */
async function initialize() {
    let clientSecret;

    clientSecret = await fs.readFile('client_secret.json');

    return authorize(JSON.parse(clientSecret));
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @returns {Promise.<OAuth2Client>}
 */
async function authorize(credentials) {
    let token;

    let clientSecret = credentials.installed.client_secret;
    let clientId     = credentials.installed.client_id;
    let redirectUrl  = credentials.installed.redirect_uris[0];
    let auth         = new GoogleAuth();
    let oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    try {
        token = await fs.readFile(TOKEN_PATH);
    }
    catch(err) {
        token = getNewToken(oauth2Client);
    }

    oauth2Client.credentials = JSON.parse(token);

    return oauth2Client;
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 */
function getNewToken(oauth2Client) {

    let /** @type {Promise} */ promise
      , /** @type {Object}  */ promiseHolder;

    promise = new Promise(function(fulfill, reject) {
        promiseHolder = {fulfill, reject};
    });

    let authUrl = oauth2Client.generateAuthUrl({ access_type: 'offline'
                                                , scope      : SCOPES});

    console.log('Authorize this app by visiting this url: ', authUrl);
    let rl = readline.createInterface({ input : process.stdin
                                     , output: process.stdout});

    rl.question('Enter the code from that page here: ',
        function(code) {
            rl.close();
            oauth2Client.getToken(code, function(err, token) {
                if (err) {
                    console.log('Error while trying to retrieve access token', err);
                    promiseHolder.reject(err);
                    return;
                }

                storeToken(token).then(function() {
                    promiseHolder.fulfill(token);
                });
            });
        });

    return promise;
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
async function storeToken(token) {

    try {
        await fs.mkdirSync(TOKEN_DIR);
    }
    catch (err) {
        if (err.code != 'EEXIST')
            throw err;
    }

    await fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
}

function getOauthClient() {
    
    if (typeof authPromise === 'undefined')
        authPromise = initialize();
    
    return authPromise;
}

export default {getOauthClient};
