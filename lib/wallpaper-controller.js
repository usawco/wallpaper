const _util = require('./util');
const util = require('util');
const jimp = require('jimp');

const favorites = require('./favorites-handler');
const flicker = require('./flicker-handler');
const googs = require('./google-handler');
const pixabay = require('./pixabay-handler');
const bing = require('./bing-handler');

const desktop = require('./desktop');

const fs = require('fs');
_util.traceLog('Executing wallpaper-controller.js');


var setDesktop = ( () => {
    let entry = getLastEntry();
    desktop.setBackground(entry);
});

const jsonPath = '/tmp/wallpaper.json';    
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
    let promises = [        
        favorites.createFeed(),         
        bing.createFeed(),    
        googs.createFeed(),
        pixabay.createFeed(),           
        flicker.createFeed(),                
    ];
    return Promise.all(promises).then( models => {
        _util.infoLog(`Search results received from ${models.length} models`);
        return new Promise( (resolve, reject) => {

        
            var theLinks = [];
            let jsonPath = '/tmp/wallpaper.json';

            try {        
                models.forEach( model => {
                    if (Array.isArray ( model )) {
                        model.forEach( m => {
                            if ( Array.isArray( m.links )) {
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
                    let min = Math.ceil(0);
                    let max = Math.floor(theLinks.length);    
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
    
    }).catch( err => {
        _util.infoLog( `Unable to select image: ${err.message}`);    
        _util.traceLog( JSON.stringify( err));   
    });
});

var generateImage = ((setDesktopToo) => {
    getRandomImageEntry()
        .then( (entry)  => _util.downloadTheImage( (entry))
        .then( data => {
            switch ( data.statusCode) {
                case 200:
                    break;
    
                case 301:
                    entry.link = data.info;
                    // retry once
                    _util.downloadTheImage( (entry)).then( data => {
                        _util.infoLog(`Redirect URL received and followed. status? ${data.statusCode}`);
                    });
                    break;
                default:
                    _util.infoLog(`Attempt to download image was not successful. status? ${data.statusCode}`); 
                    break;
            }
        }).then( () => {
            _util.updateImage(entry);
            
        }).then( () => {
            if ( setDesktopToo ) desktop.setBackground(entry);
        
        }).catch( e => {
            _util.infoLog( `Error generating image. ${e.message}`);
            _util.traceLog(e);
        })
    );
    

});

module.exports = {
    'generateImage' : generateImage,
    'setDesktopImage' : setDesktop,
    'getLastEntry' : getLastEntry
};

