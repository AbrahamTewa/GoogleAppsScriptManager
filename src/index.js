// ******************** Node packages ********************
import 'babel-polyfill';

// ******************** App packages ********************
import auth from './auth';
import AppScriptManager from './GoogleAppsScriptManager';

// ******************** Functions ********************

const APP_PATH = './src/app';
const APP_NAME = 'GoogleDaemonApp';

/**
 * Lists the names and IDs of up to 10 files.
 *
 */
function main() {
    auth.getOauthClient().then(oauth2Client => {

         /** @type {GoogleAppScriptManager} */
        let appScriptManager;

        appScriptManager = new AppScriptManager({oauth2Client});

        return appScriptManager.upload({ appPath : APP_PATH
                                       , name    : APP_NAME});

    }).then(() => {
        console.log('uploaded !');
    });
}

main();
