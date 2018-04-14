const util = require('util');
const fs = require('fs');
const { URL } = require('url');
const path = require('path');
const _util = require('./util');
const config = _util.config;

_util.traceLog('Loading localFS handler config');
_util.traceLog( JSON.stringify(config.providers.localFS));

var feeds = [];    
if ( util.isNullOrUndefined(config.providers.localFS.feeds)) {
    _util.traceLog('localFS handler has no file paths configured');

} else {
    feeds = config.providers.localFS.feeds;
}

var theFeed = ( () => {    
    let models = [];
    _util.infoLog(`local File System feed enabled? ${config.providers.localFS.enabled}`);
    if ( config.providers.localFS.enabled ) {
        feeds.forEach( dirPath => {
            models.push( feedMe(dirPath) );            
        });
    } 
    return Promise.all(models);
});

var feedMe = function(dirPath) {    
    _util.traceLog('Creating promise for localFS handler: ${dirPath}');
    return new Promise( (resolve) => {            
            resolve(createModel(dirPath) );
    });
}; 
var createModel = function( dirPath ) {
    _util.traceLog(`Inspecting feed path: ${dirPath}`);

    let model = {
        'desc' : config.providers.localFS.desc,
        'links' : []
    };                 
    let total = 0;
    try {   
        let resolvedDir = path.resolve(dirPath);                            
        let theLink = null;

        if ( fs.lstatSync(resolvedDir).isDirectory() ) {       
            fs.readdir(resolvedDir, (err, items) => {
                if ( err ) {
                    _util.infoLog( `Skipping localFS ${dirPath} feed due to error: ${err}`);
                } else {
                    for (var i=0; i<items.length; i++) {
                        let thePath = null;
                        try {           
                            thePath = 'file://'+path.resolve(resolvedDir,items[i]);
                            theLink = new URL(thePath);
                            let entry = {
                                'link' : theLink,
                                'published' : '',
                                'title' : theLink,
                                'provider' : 'localFS',
                            };
                            model.links.push( entry ); 
                            total+=1;
                        } catch (e) {
                            _util.traceLog(`Skipping ${thePath} is not a valid URL or local file path`);                        
                        }
                    }
                    _util.traceLog(`Found ${total} images for ${dirPath}`);
                    return Promise.resolve(model);
                }
            });            
        } else {
            _util.infoLog(`Skipping configured localFS feed directory.  It must be an absolute file path to a directory. ${dirPath}`);
            
        }
    } catch (e) {
        _util.traceLog( e.stack );
        return Promise.reject(`Error creating favorites feed. ${e.message}`);
    }    
};

module.exports = {
    'createFeed' : theFeed
};
