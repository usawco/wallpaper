const util = require('util');

const infoLog = ( msg => {
    console.log( msg );
});

const traceLog = util.debuglog('wallpaper');

module.exports = {
    'infoLog' : infoLog,
    'traceLog' : traceLog
};