const util = require('util');
const fs = require('fs');
const { URL } = require('url');
const path = require('path');
const _util = require('./util');
const config = _util.config;
const _constants = require('../lib/constants');

_util.traceLog('Loading Favorites handler config');
_util.traceLog( JSON.stringify(config.providers.favorites));

var theFeed = ( () => {  
   _util.traceLog('Creating promise for Favorites handler: ${dirPath}');
   let models = [];
   _util.infoLog(`Favorites handler enabled? ${config.providers.favorites.enabled}`);
   if ( config.providers.favorites.enabled ) {
       let favoritesJsonPath = path.resolve( _constants.HOME_DIR, _constants.FAVORITES_FILE);
       models.push( createModel( favoritesJsonPath) );   
   }
   return Promise.all(models);
});
 
var createModel = function( favoritesPath ) {
    _util.traceLog(`Inspecting favorites path: ${favoritesPath}`);

    let total = 0;
    let model = {
        'desc' : config.providers.favorites.desc,
        'links' : []
    };
    let modelFileObj = {};
    
    try {   

        if ( fs.lstatSync(favoritesPath).isFile) {
            var data = fs.readFileSync( favoritesPath);
            if ( util.isNullOrUndefined( data)) {
                _util.traceLog(`No data in ${favoritesPath} file from favorites provider found.`);                  
            } else {
                _util.traceLog( `Parsing data into JSON object from ${favoritesPath}` );
                try {
                    modelFileObj = JSON.parse( data );
                
                    if ( modelFileObj.items  ) {        
                        total = modelFileObj.items.length;
                        _util.traceLog(`Loaded ${total} favorite items.`);         
                        modelFileObj.items.forEach( entry => {
                            let theLink = null;
                            try {
                                new URL(entry.link);
                                theLink = entry.link;
                            } catch (e) {
                                _util.traceLog( `Skipping ${entry.link} - not a valid URL`);
                            }
                                
                            if ( theLink != null) {
                                model.links.push( entry );
                                total += 1;
                            }

                        });
                        
                        _util.traceLog(`Found ${total} URLs for ${favoritesPath}`);
                        return Promise.resolve(model);
                    
                    } 
                } catch (e) {
                    _util.traceLog( `Skipping ${favoritesPath}  ${e.message}`);
                }

                    
            }
        } else {
            _util.traceLog(`No ${favoritesPath} file from favorites provider found.`);                  
        }        
                
    } catch (e) {
        _util.traceLog( e.stack );
        return Promise.reject(`Error creating favorites feed. ${e.message}`);
    }
    
};

module.exports = {
    'createFeed' : theFeed
};
