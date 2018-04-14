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
        if ( config.providers.localFS.feeds ) {
            for ( var idx=0; idx<config.providers.localFS.feeds.length; idx++) {
                models.push( createModel(config.providers.localFS.feeds[idx]) );            
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
                try {           
                    theLink = path.resolve(resolvedDir,file);
                    let entry = {
                        'link' : theLink,
                        'published' : '',
                        'title' : theLink,
                        'provider' : 'localFS',
                    };
                    model.links.push( entry ); 
                    total+=1;
                } catch (e) {
                    _util.traceLog(`Skipping ${thePath} is not a valid URL`);                        
                }
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
