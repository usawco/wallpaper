const _util = require( '../lib/util');
const fs = require('fs');
const os = require('os');
const path = require('path');

_util.infoLog('Executing pre installation script');

var configPath;
try {
    let tmpdir = os.tmpdir();
    configPath = path.resolve( __dirname,'../lib', _util.CONFIG_FILE);
    let tmpPath = path.resolve( tmpdir, _util.CONFIG_FILE);

    let tmpExists = fs.existsSync(tmpPath);
    if ( tmpExists) {
        fs.unlinkSync( tmpPath );
    }

    let configExists = fs.existsSync(configPath);
    if ( configExists) {
        _util.infoLog(`Backing up ${configPath} to ${tmpPath} before update`);
        fs.copyFileSync( configPath, tmpPath);
    }
} catch (e) {
    _util.infoLog(`Warning, unable to backup existing ${configPath} before update`);
}

_util.infoLog("Pre installation step completed");

