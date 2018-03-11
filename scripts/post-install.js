const _util = require( '../lib/util');
const fs = require('fs');
const os = require('os');
const path = require('path');
const util = require('util');

_util.infoLog('Executing post installation script');

var configJsonPath;
try {
    let configJsPath = path.resolve( __dirname, '../lib/config.js');
    let homedir = os.homedir();    
    let configDirPath = path.resolve( homedir,'.desktop-eye-candy');    
    if ( !fs.existsSync(configDirPath)) {        
        _util.infoLog(`Creating configuration directory in ${configDirPath}`);        
        fs.mkdirSync(configDirPath);
    }
    configJsonPath = path.resolve( configDirPath, _util.CONFIG_FILE);    

    let objJs = require( configJsPath );
    let configExists = fs.existsSync(configJsonPath);
    let objJson;
    if ( configExists) {        
        objJson = require( configJsonPath );        
    } else {
        objJson = {};
    }
    _util.infoLog("Copying new elements from package's config.js into ${configJsonPath}");
    deepCopy( objJs, objJson );
    fs.writeFileSync( configJsonPath, JSON.stringify(objJson, null, 4));

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

