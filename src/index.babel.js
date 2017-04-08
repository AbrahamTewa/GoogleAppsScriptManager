const sourceMapSupport = require('source-map-support');
sourceMapSupport.install();

require('babel-register');
require('./index');
