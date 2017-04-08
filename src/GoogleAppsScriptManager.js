// ******************** Node packages ********************
import google from 'googleapis';
import path from 'path';

// ******************** Internal packages ********************

import fs from './lib/fs';
import {drive} from './google';

// ******************** Module variables ********************

/**
 * Google Mime type of App scripts
 * @type {string}
 */
const APP_MIME_TYPE = 'application/vnd.google-apps.script';

/**
 *
 * @type {WeakMap.<GoogleAppScriptManager, PrivateGoogleAppScriptManager>}
 */
const privatePublicMap = new WeakMap();

// ******************** Functions ********************
async function toGoogleAppScriptFormat(appPath) {
    /**
     * List of all created scripts
     * @type {Promise.<{name:string, type:string, source: string}>[]}
     */
    let appScriptFiles;

    /**
     * List of all files to upload.
     *
     * @type {string[]}
     */
    let files;

    try {
        files = await fs.readdir(appPath);
    }
    catch(err) {
        console.error(`Error reading application path "${appPath}" :`, err.message);

        throw err;
    }

    // Only *.js and *.html files are uploaded
    // Other files (such as sourcemaps) are not uploaded
    files = files.filter(file => ['.js', '.html'].includes(path.extname(file).toLowerCase()) );

    if (files.length === 0)
        throw new Error(`No *.js nor *.html file into the application path ${appPath}"`);

    appScriptFiles = files.map(async function(fileName) {

        /** @type {string} */
        let content;

        /** @type {string} */
        let filePath;

        filePath = path.resolve(appPath, fileName);

        /**
         * Reading the file and returning an object
         * usable for the AppScript final object
         */
        content = await fs.readFile(filePath, 'utf8');

        return { name   : path.basename(fileName, path.extname(fileName))
               , type   : 'server_js'
               , source : content };
    });

    return {files: await Promise.all(appScriptFiles)};
}

// ******************** Classes ********************

/**
 *
 * @param {OAuth2Client} oauth2Client - Google client secret file or object
 */
class GoogleAppScriptManager {

    constructor(configuration) {
        PrivateGoogleAppScriptManager.declare(this, configuration);
    }

    /**
     * Run a function in a Apps Script project.
     *
     * For options, see https://developers.google.com/apps-script/execution/rest/v1/scripts/run
     * @param {string} scriptId
     * @param {Object} options
     * @returns {Promise}
     */
    run(scriptId, options) {
        return PrivateGoogleAppScriptManager.get(this).run(scriptId, options);
    }

    /**
     *
     * @param {Object} options
     * @param {string} options.appPath - Path to the application file
     * @param {string} options.name    - Name of your application
     * @returns {Promise}
     */
    upload(options) {
        return PrivateGoogleAppScriptManager.get(this).upload(options);
    }

}



class PrivateGoogleAppScriptManager {

    constructor({oauth2Client}) {
        this.oauth2Client = oauth2Client;
        this.scriptAPI = google.script({ auth: oauth2Client
                                       , version: 'v1'});
    }

    /**
     * Run a function in a Apps Script project.
     *
     * For options, see https://developers.google.com/apps-script/execution/rest/v1/scripts/run
     * @param {string} scriptId
     * @param {Object} options
     * @returns {Promise}
     */
    run(scriptId, options) {
        /** @type {function} */
        let callback;

        /** @type {Promise} */
        let promise;

        /** {Object} */
        let promiseHolder;

        options = Object.assign({}, options);

        options.scriptId = scriptId;

        promise = new Promise(function(fulfill, reject) {
            promiseHolder = {fulfill, reject};
        });

        callback = function(err, response) {
            if (err)
                promiseHolder.reject(err);
            else
                promiseHolder.fulfill(response);
        };

        this.scriptAPI.script['run']( options
                                    , callback);

        return promise;
    }

    async upload({name,
                  appPath}) {

        let appScriptObject,
            appFile,
            editPath,
            fileMetadata;

        [appScriptObject, appFile] = await Promise.all([toGoogleAppScriptFormat(appPath)
                                                       ,this.getAppFile(name)]);

        // Creating the application if not it doesn't exists
        if (typeof appFile === 'undefined') {
            let appContent;

            let query;

            appContent = JSON.stringify(appScriptObject);

            query = { media : { body : appContent}
                    , resource : { name
                                 , mimeType : APP_MIME_TYPE + '+json'}};

            fileMetadata = await drive.files.create(query, {auth: this.oauth2Client});
        }
        else
            fileMetadata = await this.update(appScriptObject, appFile);

        editPath = `https://script.google.com/d/${fileMetadata.id}/edit`;

        return { app    : editPath
               , upload : { fileInfo : fileMetadata
                          , status   : 'success'}};
    }

    /**
     *
     * @param appScriptObject
     * @param appFile
     * @private
     * @returns {Promise.<void>}
     */
    async update(appScriptObject, appFile) {
        let appExport;

        /** @type {string} */
        let appContent;

        /** @type {Object} */
        let query;

        appExport = await drive.files.export({ auth     : this.oauth2Client
                                             , fileId   : appFile.id
                                             , mimeType : APP_MIME_TYPE + '+json'});

        // Matching local files to app script files
        appExport.files.forEach(function(fileExport) {
            let /** @type {Object} */ appScriptFile;

            appScriptFile = appScriptObject.files.find(appScriptFile => appScriptFile.name === fileExport.name);

            if (!appScriptFile)
                return;

            appScriptFile.id = fileExport.id;
        });

        appContent = JSON.stringify(appScriptObject);

        query = { fileId   : appFile.id
                , media    : { body : appContent }
                , fields   : 'id, modifiedTime'
                , resource : { modifiedTime: new Date().toISOString()
                             , mimeType    : APP_MIME_TYPE + '+json'}};

        return drive.files.update(query, {auth: this.oauth2Client});
    }

    async getAppFile(name) {

        let files;

        /** @type {string} */
        let query;

        query =  `name='${name}' and mimeType='${APP_MIME_TYPE}'`;

        files = await drive.files.list({ auth  : this.oauth2Client
                                       , fields: 'nextPageToken, files(id, name)'
                                       , q     : query});

        return files.files[0];
    }

    static declare(googleAppScriptUpdater, configuration) {
        privatePublicMap[googleAppScriptUpdater] = new PrivateGoogleAppScriptManager(configuration);
    }

    /**
     *
     * @param googleAppScriptUpdater
     * @returns {PrivateGoogleAppScriptManager}
     */
    static get(googleAppScriptUpdater) {
        return privatePublicMap[googleAppScriptUpdater];
    }

}

// ******************** Exports ********************

export {toGoogleAppScriptFormat};
export default GoogleAppScriptManager;
