import fs from 'fs';

function readdir(path) {
    let /** @type {Promise} */ promise
      , /** @type {Object}  */ promiseHolder;

    promise = new Promise(function(fulfill, reject) {
        promiseHolder = {fulfill, reject};
    });

    fs.readdir(path, function(err, files) {
        if (err)
            promiseHolder.reject(err);
        else
            promiseHolder.fulfill(files);
    });
    
    return promise;
}

/**
 * @param {string} file      - Name of the file
 * @param {Object} [options] - Option of the reader
 * @returns {Promise.<string>}
 */
function readFile(file, options) {
    let /** @type {Promise} */ promise
      , /** @type {Object}  */ promiseHolder;

    promise = new Promise(function(fulfill, reject) {
        promiseHolder = {fulfill, reject};
    });

    fs.readFile(file, options, function(err, fileContent) {
        if (err)
            promiseHolder.reject(err);
        else
            promiseHolder.fulfill(fileContent);

    });

    return promise;
}

function writeFile(file, content, options={}) {
    let /** @type {Promise} */ promise
      , /** @type {Object}  */ promiseHolder;

    promise = new Promise(function(fulfill, reject) {
        promiseHolder = {fulfill, reject};
    });

    fs.writeFile(file, content, options, function(err) {
        if (err)
            promiseHolder.reject(err);
        else
            promiseHolder.fulfill();
    });

    return promise;
}

export default { readdir
               , readFile
               , writeFile};
