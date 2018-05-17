const _util = require('./util');
const util = require('util');
const _constants = require('./constants');
const favorites = require('./favorites-handler');
const localFS = require('./localfs-handler');
const flickr = require('./flicker-handler');
const flickrHD = require('./flickr-hd-handler');
const googs = require('./google-handler');
const pixabay = require('./pixabay-handler');
const bing = require('./bing-handler');
const rss = require('./rss-handler');
const path = require('path');


const desktop = require('./desktop');

const fs = require('fs');
const config = _util.config;

_util.traceLog('Executing wallpaper-controller.js');
_util.traceLog(`socket timeout: ${config.socketTimeout}`);
_util.traceLog(`imagePath Directory: ${config.imagePathDirectory}`);


var setDesktop = ( () => {
    let entry = getLastEntry();
    desktop.setBackground(entry);
});

const jsonPath = `${config.imagePathDirectory}/wallpaper.json`;    
/**
 * @returns The wallpaper.json file contents as a string, or an empty object otherwise.
 */
var getLastEntry = ( () => {    
    let response = "{ }";
    //toss an error if we can't read this file.
    try {
        fs.accessSync( jsonPath, fs.constants.R_OK);
    
        let json = fs.readFileSync( jsonPath);        
        if ( !util.isNullOrUndefined( json)) {
            //response = JSON.stringify(_util.bufferToString(json), null, 4);
            response = _util.bufferToString(json);
        }
    } catch (e) {
        _util.traceLog(`Error getting ${jsonPath}. ${e.message}`);
        _util.traceLog( e.stack );
    }
    return response;
    
});


var getRandomImageEntry = ( () => {
    var entry = null;
    let theHandlers = [];
    if ( config.providers.favorites.enabled) theHandlers.push(favorites);
    if ( config.providers.localFS.enabled) theHandlers.push(localFS);
    if ( config.providers.bing.enabled) theHandlers.push(bing);
    if ( config.providers.google.enabled) theHandlers.push(googs);
    if ( config.providers.pixabay.enabled) theHandlers.push(pixabay);
    if ( config.providers.flickr.enabled) theHandlers.push(flickr);
    if ( config.providers.flickrHD.enabled) theHandlers.push(flickrHD);
    if ( config.providers.rss.enabled) theHandlers.push(rss);

    if ( theHandlers.length == 0) {
        _util.infoLog(' No handlers have been enabled in ~/desktop-eye-candy/config.json.');
        return;
    }
    
    let min = Math.ceil(0);
    let max = Math.floor(theHandlers.length);    
    // [min, max)
    let rand = Math.floor(Math.random() * (max - min)) + min;     
    entry = theHandlers[rand];
    _util.infoLog( `########\nSelected  #${rand} from set of [${min}-${max}) handlers\n#######`);

    let promises = [        
        entry.createFeed()
    ];
    return Promise.all(promises).then( models => {
        _util.infoLog(`Search results received from ${models.length} models`);
        return new Promise( (resolve, reject) => {

        
            var theLinks = [];

            try {        
                models.forEach( model => {
                    if (Array.isArray ( model )) {
                        model.forEach( m => {                            
                            if ( m && Array.isArray( m.links )) {
                                m.links.forEach( entry => {
                                    theLinks.push( entry );
                                });
                            }        

                        });
                    }
                });

                let imageTotal = theLinks.length;
                _util.infoLog(`Choosing from ${imageTotal} images`);

                if ( imageTotal > 0 ) {
                    min = Math.ceil(0);
                    max = Math.floor(theLinks.length);    
                    // [min, max)
                    let rand = Math.floor(Math.random() * (max - min)) + min; 
                    
                    entry = theLinks[rand];
                    _util.infoLog( `########\nSelected  ${rand} from set of [${min}-${max}) from ${entry.provider}: title: ${entry.title} ${entry.link}\n#######`);
                    fs.writeFile(jsonPath, JSON.stringify(entry), (err) => {
                        if ( err ) {
                            _util.infoLog(`Error creating ${jsonPath}: ${err.message}`);
                            _util.traceLog(err.stack);
                            reject(`Error creating ${jsonPath}: ${err.message}`);
                        }
                        resolve( entry);
                    });
                }
            } catch(err) {
                _util.infoLog( `Unable to select image: ${err.message}`);     
                _util.traceLog( JSON.stringify( err));   
            }

        });
    });
});

var generateImage = ((setDesktopToo) => {
    getRandomImageEntry()
        .then( (entry)  => _util.downloadTheImage( (entry))
        .then( data => {
            return new Promise( (resolve,reject) => {
                switch ( data.statusCode) {
                    case 200:
                        resolve(entry);
        
                    case 301:
                    case 302:
                    case 303:
                        entry.link = data.info;
                        // retry once 
                        _util.downloadTheImage( (entry)).then( (data) => {
                            _util.infoLog(`Redirect URL received and followed. status? ${data.statusCode}`);
                            if ( data.statusCode == 200) {
                                resolve(entry);
                                return;
                            }
                            reject(`Redirect failed. statusCode: ${data.statusCode}`);
                        });                        
                        break;

                    default:
                        reject(`Attempt to download image was not successful. status? ${data.statusCode}`); 
                        break;
                }
            });

        }).then( () => _util.updateImage(entry))
        .then( () => {        
            if ( setDesktopToo ) desktop.setBackground(entry);
        
        }).catch( e => {
            _util.infoLog( `Error generating image. ${e.message}`);
            _util.traceLog(e);
        })
    );
    

});


var setFavorite = () => {

    let currentObj = {};
    try {
        fs.accessSync( jsonPath, fs.constants.R_OK);    
        let json = fs.readFileSync( jsonPath);      // current image  
        if ( !util.isNullOrUndefined( json)) {
            currentObj = JSON.parse(json);
            let favoritesPath = path.resolve( _constants.HOME_DIR, _constants.FAVORITES_FILE);
            let data = fs.readFileSync( favoritesPath);     
            let jsonFavorites = null;
            if ( util.isNullOrUndefined(data)) {
                jsonFavorites = {
                    'items' : '[]'
                };
            } else {
                jsonFavorites = JSON.parse(data);
            }
            let exists = false;
            for (var i=0; i<jsonFavorites.items.length; i++) {
                if ( jsonFavorites.items[i].link == currentObj.link) {
                    exists = true;
                    break;
                }
            }
            if ( !exists ) {
                jsonFavorites.items.push( currentObj );                
                fs.writeFileSync( favoritesPath, JSON.stringify(jsonFavorites, null, 4));
                _util.infoLog( `${JSON.stringify(currentObj)} added to favorites.`);
            }
        }
    } catch (e) {
        _util.infoLog(`Error saving favorite. ${e.message}`);
        _util.traceLog( e.stack );
    }
    
};

module.exports = {
    'generateImage' : generateImage,
    'setDesktopImage' : setDesktop,
    'getLastEntry' : getLastEntry,
    'setFavorite' : setFavorite
};

