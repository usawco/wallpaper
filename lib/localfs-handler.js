const util = require('util');
const fs = require('fs');
const path = require('path');
const _util = require('./util');
const config = _util.config;

_util.traceLog('Loading localFS handler config');
_util.traceLog( JSON.stringify(config.providers.localFS));

let feeds = [];
if ( util.isNullOrUndefined(config.providers.localFS.feeds)) {
    _util.traceLog('localFS handler has no file paths configured');

} else {
    feeds = config.providers.localFS.feeds;
}

var theFeed = ( () => {    
    let models = [];
    _util.infoLog(`local File System feed enabled? ${config.providers.localFS.enabled}`);
    if ( config.providers.localFS.enabled ) {
        if ( feeds ) {
            for ( var idx=0; idx<feeds.length; idx++) {
                models.push( createModel(feeds[idx]) );            
            }
        }
    } 
    return Promise.all(models);
});

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
            fs.readdirSync(resolvedDir).forEach( (file) => {              
                theLink = path.resolve(resolvedDir,file);
                let entry = {
                    'link' : theLink,
                    'published' : '',
                    'title' : theLink,
                    'provider' : 'localFS',
                };
                model.links.push( entry ); 
                total+=1;
            });     
            _util.traceLog(`Found ${total} images for ${dirPath}`);
            return Promise.resolve(model);
            
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
