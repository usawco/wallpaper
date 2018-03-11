const util = require('util');
const os = require('os');
const path = require('path');

const infoLog = ( msg => {
    console.log( msg );
});

const traceLog = util.debuglog('wallpaper');
const CONFIG_FILE = 'config.json';
const CONFIG_DIR = path.resolve(os.homedir(),'.desktop-eye-candy');

module.exports = {
    'infoLog' : infoLog,
    'traceLog' : traceLog,
    'CONFIG_FILE' : CONFIG_FILE,
    'CONFIG_DIR' : CONFIG_DIR,
    'config' : require( path.resolve(CONFIG_DIR,CONFIG_FILE))

};