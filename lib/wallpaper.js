const _util = require('./util');

const flicker = require('./flicker-handler');
const googs = require('./google-handler');
const pixabay = require('./pixabay-handler');
const bing = require('./bing-handler');

const fs = require('fs');
_util.traceLog('Executing wallpaper.js');


var exec = ( () => {

    var entry = null;
    let promises = [                 
        bing.createFeed(),    
        googs.createFeed(),
        pixabay.createFeed(),           
        flicker.createFeed(),                
    ];
    Promise.all(promises).then( models => {
        // models[idx] = model for each handler    

        var theLinks = [];
        try {        
            _util.infoLog(`${models.length} models acquired`);
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

            let min = Math.ceil(0);
            let max = Math.floor(theLinks.length);    
            // [min, max)
            let rand = Math.floor(Math.random() * (max - min)) + min; 
            entry = theLinks[rand];
            _util.infoLog( `########\nSelected  ${rand} from set of [${min}-${max}) from ${entry.provider}: title: ${entry.title} ${entry.link}\n#######`);
            //_util.traceLog( `[${min}-${max}) -> ${rand}: ${JSON.stringify(entry)}`);
            fs.writeFile('/tmp/wallpaper.json', JSON.stringify(entry), (err) => {
                if ( err ) {
                    _util.infoLog(`Error creating /tmp/wallpaper.json: ${err.message}`);
                }
            });
        } catch(err) {
            _util.traceLog( JSON.stringify( err));    
        }
    }).catch( err => {
        _util.traceLog( JSON.stringify( err));
    });
});

module.exports = {
    'exec' : exec()
}

