const _util = require( '../lib/util');
const fs = require('fs');
const os = require('os');
const path = require('path');
const util = require('util');

_util.infoLog('Executing post installation script');

var configJsonPath;

try {
    let tmpdir = os.tmpdir();
    configJsonPath = path.resolve( __dirname,'../lib', _util.CONFIG_FILE);
    let configJsPath = path.resolve( __dirname,'../lib/config.js');
    let tmpPath = path.resolve( tmpdir, _util.CONFIG_FILE);

    let tmpExists = fs.existsSync(tmpPath);
    if ( tmpExists) {
        _util.infoLog(`Restoring archived ${configJsonPath} to lib/`);
        fs.copyFileSync( tmpPath, configJsonPath);
        fs.unlinkSync( tmpPath );
    }

    let configExists = fs.existsSync(configJsonPath);
    if ( configExists) {
        let objJs = require( configJsPath );
        let objJson = require( configJsonPath );        
        if ( objJson != null) {
            _util.infoLog("Copying any new elements from config.js into existing config.json");
            deepCopy( objJs, objJson );
            fs.writeFileSync( configJsonPath, JSON.stringify(objJson, null, 4));
        }
    }

} catch (e) {    
    _util.infoLog(`Warning, unable to migrate ${configJsonPath} file.  ${e.message}`);
    _util.traceLog(e.stack);
}

_util.infoLog("Post installation step completed");

/**
 * non-destructive recursive copy. used for config as long as its depth remains shallow
 * Otherwise, switch to a stack push and pop
 */
function deepCopy(src, target) {

    if ( !util.isNullOrUndefined(src) && !util.isNullOrUndefined(target)) {
        Object.keys(src).forEach( key => {
            let val = src[key];
            if( util.isNullOrUndefined( target[key])) {
                target[key] = val;
            } else if ( typeof val == "object") {
                deepCopy(val, target[key]);    
            }
        });                 
    }
}

