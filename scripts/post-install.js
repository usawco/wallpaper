const fs = require('fs');
const os = require('os');
const path = require('path');
const util = require('util');
const _constants = require('../lib/constants');

console.log('Executing post installation script');

var configJsonPath;
try {
    let configJsPath = path.resolve( __dirname, '../lib/config.js');
    if ( !fs.existsSync(_constants.CONFIG_DIR)) {        
        console.log(`Creating configuration directory in ${_constants.CONFIG_DIR}`);        
        fs.mkdirSync(_constants.CONFIG_DIR);
    }
    configJsonPath = path.resolve( _constants.CONFIG_DIR, _constants.CONFIG_FILE);    

    let objJs = require( configJsPath );
    let configExists = fs.existsSync(configJsonPath);
    let objJson;
    if ( configExists) {        
        objJson = require( configJsonPath );        
    } else {
        objJson = {};
    }
    console.log(`Copying new elements from package's config.js into ${configJsonPath}`);
    deepCopy( objJs, objJson );
    fs.writeFileSync( configJsonPath, JSON.stringify(objJson, null, 4));

} catch (e) {    
    console.log(`Warning, unable to migrate ${configJsonPath} file.  ${e.message}`);
    console.log(e.stack);
}

//_util.infoLog("Post installation step completed");

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

