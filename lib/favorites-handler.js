const util = require('util');
const fs = require('fs');
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

        feeds.forEach( path => {
            models.push( feedMe(path) );            
        });
    } else {
        util.traceLog('Favorites handler is disabled');
    }
    return Promise.all(models);
});

var feedMe = function(path) {    
    return new Promise( (resolve) => {            
            resolve(createModel(path) );
    });
}; 
var createModel = function( path ) {
    _util.traceLog(`Inspecting feed path: ${path}`);

    let model = {
        'desc' : config.providers.favorites.desc,
        'links' : []
    };
    
    try {        
        if ( fs.lstatSync(path).isDirectory() ) {  
            //TODO Look for fs path api in an OS-agnosic manner?        
            var modelFilePath = `${path}/items.json`;
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
                            model.links.push( entry );
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
