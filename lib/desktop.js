const cp = require('child_process');
const os = require('os');
const _util = require('./util');
const util = require('util');

const setBackground = function(entry) {
  
    if ( util.isNullOrUndefined(entry)) {

        throw new Error('Image selection not sent to setDesktopBackground');
    }

    switch( os.platform() ) {
        case 'linux':
            setLinux(entry);
            break;

        case 'win32':
            setWindows(entry);
            break;

        default:
            _util.infoLog(`Unsupported platform? ${os.platform()}`);
    }
};

function setWindows(entry) {
    _util.traceLog(`Setting desktop background for ${entry.link}`);    
    let output = cp.execSync( `powershell.exe -ExecutionPolicy Bypass ${__dirname}/../bin/wp.ps1 "${entry.provider} ${entry.title}"`);
    _util.infoLog(`powershell output: ${output}`);

    _util.traceLog(`Windows background update completed`);
}

function setLinux(entry) {
    _util.traceLog(`Setting desktop background for ${entry.link}`);

    // TODO , retire and use jimp    
    let output = cp.execSync( `convert -background black -pointsize 16 -fill white -annotate +10+50 "${entry.provider} ${entry.title}" /tmp/wallpaper.jpg /tmp/convert.jpg`);
    _util.infoLog(`convert output: ${output}`);

    output = cp.execSync(`nitrogen --set-scaled --save /tmp/convert.jpg`);
    _util.infoLog(`nitrogen output: ${output}`);

    _util.traceLog(`Linux background update completed`);
}

module.exports = {
    'setBackground' : setBackground
};