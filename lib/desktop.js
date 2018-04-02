const cp = require('child_process');
const os = require('os');
const fs = require('fs');
const util = require('util');

const _util = require('./util');

const setBackground = function(entry) {
  
    if ( util.isNullOrUndefined(entry)) {

        throw new Error('Image selection not sent to setDesktopBackground');
    }

    setTimeout( () => {
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
    }, 2000);
};

function setWindows(entry) {
    _util.traceLog(`Setting desktop background for ${entry.link}`);    
    if ( fs.lstatSync(_util.imagePath).isFile ) {
        let output = cp.execSync( `powershell.exe -ExecutionPolicy Bypass ${__dirname}/../bin/wp.ps1`);
        _util.infoLog(`powershell output: ${output}`);
        _util.traceLog(`Windows background update completed`);
    } else {
        _util.infoLog(`Desktop not updated. ${_util.imagePath} doesn't exist`);
    }
        
}

function setLinux(entry) {
    _util.traceLog(`Setting desktop background for ${entry.link}`);
    if ( fs.lstatSync(_util.imagePath).isFile ) {
        let output = cp.execSync(`nitrogen --set-scaled --save ${_util.imagePath}`);
        _util.infoLog(`nitrogen output: ${output}`);
        _util.traceLog(`Linux background update completed`);

    } else {
        _util.infoLog(`Desktop not updated. ${_util.imagePath} doesn't exist`);
    }
}

module.exports = {
    'setBackground' : setBackground
};