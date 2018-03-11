const util = require('util');

const infoLog = ( msg => {
    console.log( msg );
});

const traceLog = util.debuglog('wallpaper');
const CONFIG_FILE = 'config.json';

module.exports = {
    'infoLog' : infoLog,
    'traceLog' : traceLog,
    'CONFIG_FILE' : CONFIG_FILE
};