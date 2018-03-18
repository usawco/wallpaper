const _util = require('./util');
var program = require('commander');
const process = require('process');
const path = require('path');
const {URL} = require('url');

const favorites = require('./favorites-handler');
const flicker = require('./flicker-handler');
const googs = require('./google-handler');
const pixabay = require('./pixabay-handler');
const bing = require('./bing-handler');

const fs = require('fs');
_util.traceLog('Executing wallpaper.js');

const pkgJson = fs.readFileSync(path.resolve( __dirname, '../package.json'));
const json = JSON.parse( pkgJson );
program
  .version(json.version)
  .description('set random desktop background image')
  .parse(process.argv);
 
program.parse(process.argv);

var exec = ( () => {

    var entry = null;
    let promises = [        
        favorites.createFeed(),         
        bing.createFeed(),    
        googs.createFeed(),
        pixabay.createFeed(),           
        flicker.createFeed(),                
    ];
    Promise.all(promises).then( models => {
        // models[idx] = model for each handler    

        var theLinks = [];
        let imagePath = '/tmp/wallpaper.jpg';
        let jsonPath = '/tmp/wallpaper.json';

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
            fs.writeFile(jsonPath, JSON.stringify(entry), (err) => {
                if ( err ) {
                    _util.infoLog(`Error creating ${entryJson}: ${err.message}`);
                }
                _util.downloadTheImage( new URL(entry.link), imagePath)
                    .then( imagePath => {
                        _util.infoLog(`Downloaded ${imagePath}`);
                    }).catch( err => {
                        // so Node will exit with an error return code.
                        throw new Error(err);
                    }
                );
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
};

