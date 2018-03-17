const util = require('util');
const path = require('path');
const _constants = require('./constants');

const infoLog = ( msg => {
    console.log( msg );
});

const traceLog = util.debuglog('wallpaper');

module.exports = {
    'infoLog' : infoLog,
    'traceLog' : traceLog,
    'config' : require( path.resolve(_constants.CONFIG_DIR,_constants.CONFIG_FILE))
};