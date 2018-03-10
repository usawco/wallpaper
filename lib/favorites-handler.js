const util = require('util');
const fs = require('fs');
const { URL } = require('url');
const path = require('path');
const config = require('./config.json');
const _util = require('./util');

_util.traceLog('Loading Favorites handler config');
_util.traceLog( JSON.stringify(config));

var feeds = [];    
_util.traceLog('Favorites handler feeds:' + config.providers.favorites.feeds );
if ( util.isNullOrUndefined(config.providers.favorites.feeds)) {

    _util.traceLog('Favorites handler has no file paths configured');

} else {
    feeds = config.providers.favorites.feeds;
}

var theFeed = ( () => {    
    let models = [];
    if ( config.providers.favorites.enabled ) {
        _util.traceLog('Creating promises for Favorites handler');

        feeds.forEach( dirPath => {
            models.push( feedMe(dirPath) );            
        });
    } else {
        util.traceLog('Favorites handler is disabled');
    }
    return Promise.all(models);
});

var feedMe = function(dirPath) {    
    return new Promise( (resolve) => {            
            resolve(createModel(dirPath) );
    });
}; 
var createModel = function( dirPath ) {
    _util.traceLog(`Inspecting feed path: ${dirPath}`);

    let model = {
        'desc' : config.providers.favorites.desc,
        'links' : []
    };
    
    try {   
        let resolvedDir;     
        if ( path.isAbsolute( dirPath )) {
            resolvedDir = path.resolve(dirPath);            
        } else {
            resolvedDir = path.resolve(__dirname,'..',dirPath);
        }
        
        if ( fs.lstatSync(resolvedDir).isDirectory() ) {          
            var modelFilePath = path.resolve(resolvedDir, 'items.json');
            if ( fs.lstatSync(modelFilePath).isFile) {
            } else {
                _util.traceLog(`No ${modelFilePath} file from favorites provider found.`);                  
            }
            var data = fs.readFileSync( modelFilePath);
            if ( util.isNullOrUndefined( data)) {
                _util.traceLog(`No data in ${modelFilePath} file from favorites provider found.`);                  
            } else {
                _util.traceLog( `Parsing data into JSON object from ${modelFilePath}` );
                var modelFileObj = JSON.parse( data );
                let total = 0;
                if ( modelFileObj.items  ) {        
                    total = modelFileObj.items.length;
                    _util.traceLog(`Loaded ${total} favorite items.`);
                    if ( total > 0 ) {            
                        modelFileObj.items.forEach( entry => {
                            let theLink = null;
                            try {
                                new URL(entry.link);
                                theLink = entry.link;
                            } catch (e) {
                                // see if it's a file path
                                
                                try {                                    
                                    let absPath = path.resolve(entry.link);
                                    if ( fs.lstatSync(modelFilePath).isFile ) {
                                        theLink = new URL(`file://${absPath}`);                                    
                                    } else {
                                        _util.traceLog(`${entry.link} does not exist as a local file`);     
                                    }
                                } catch (e) {
                                    _util.traceLog(`${entry.link} is not a valid URL or local file path`);
                                }
                            }
                            if ( theLink != null) {
                                model.links.push( entry );
                            }
                            
                        });
                    }
                } else {
                    _util.traceLog(`No item links in ${modelFilePath} file from favorites provider found.`);     
                }
            }
                
        } else {
            _util.traceLog(`No local file system path feeds from favorites provider (0 links)`);                  
        }
    } catch (e) {
        _util.traceLog( e.stack );
        return Promise.reject(`Error creating favorites feed. ${e.message}`);
    }
    

    return model;
};

module.exports = {
    'createFeed' : theFeed
};
