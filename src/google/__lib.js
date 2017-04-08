function getPromise(apiFunction, options) {
    let /** @type {function} */ callback
      , /** @type {Promise}  */ promise
      , /** {Object}         */ promiseHolder;

    promise = new Promise(function(fulfill, reject) {
        promiseHolder = {fulfill, reject};
    });

    callback = function(err, response) {
        if (err)
            promiseHolder.reject(err);
        else
            promiseHolder.fulfill(response);
    };
    
    apiFunction( options
               , callback);

    return promise;
}

export {getPromise};
