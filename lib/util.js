const util = require('util');
const path = require('path');
const _constants = require('./constants');

const infoLog = ( msg => {
    console.log( msg );
});

const configPath = path.resolve(_constants.CONFIG_DIR,_constants.CONFIG_FILE);
infoLog(`Resolving configuration from ${configPath}`);
const config = require( configPath );

const traceLog = util.debuglog('wallpaper');

module.exports = {
    'infoLog' : infoLog,
    'traceLog' : traceLog,
    'config' : config
};