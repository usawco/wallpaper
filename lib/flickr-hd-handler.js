const https = require('https');
const { URL } = require('url');
const util = require('util');
const _util = require('./util');
const config = _util.config;


const apiKey = config.providers.flickrHD.apiKey;
const terms = config.providers.flickrHD.terms;

_util.traceLog('Loading flickr HD config');
_util.traceLog( JSON.stringify(config.providers.flickrHD));

// https://www.flickr.com/services/api/

let urls = [];

terms.forEach( term => {
   urls.push( `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=${apiKey}&tags=${term}&per_page=10&format=json&nojsoncallback=1`);
});

var theFeed = ( () => {    

    let models = [];
    _util.infoLog(`Flickr HD feed enabled? ${config.providers.flickrHD.enabled}`);
    if ( config.providers.flickrHD.enabled ) {
        _util.traceLog('Creating promises for flickr HD feed handler');
        urls.forEach(url => {
            models.push( feedMe(url) );
        });
    }
    return Promise.all(models);
});

var feedMe = function(url) {
    try {
        return new Promise( (resolve, reject) => {

            let sResponse;

            _util.traceLog(`Flickr HD promise for ${url}`);
            let options = new URL(url);     
            options.headers = {
                'Accept' : 'application/json',
                'Content-Type' : 'application/x-www-form-urlencoded'
            };
            let req = https.request( options );   
            req.setTimeout( config.socketTimeout, function() {
                _util.InfoLog(`timeout after ${config.socketTimeout} milliseconds!`);
                req.destroy();
            });

            req.on('response', (res) => {
               res.on('data', (data) => {
                   if ( util.isNullOrUndefined(sResponse)) {
                        sResponse = data;
                   } else {
                       sResponse += data;
                   }                   
               });

                res.on('end', () => {
                   _util.traceLog(`Flickr response received: ${res.statusCode}`);
                   let jResponse;
                   if ( res.statusCode == 200) {
                        try {
                            //_util.traceLog(`${sResponse}`);
                            jResponse = JSON.parse( sResponse );
                        } catch (e) {
                            _util.traceLog( `Error parsing JSON response: ${e.message}`);
                            resolve( createModel(null) );
                        }
                        if ( jResponse) {
                            resolve( createModel(jResponse));
                        }
                        
                   } else {
                       reject({ 'error': null, 'reason' : `Received ${res.statusCode} response code`});
                   }
                   
                }); //on end
            }); //on response for request

            req.on('connect', (res, socket, head) => {
                _util.traceLog(`Socket has connected to server... ${head}`);
            });
            // send the request
            req.end();

        }); // returned promise
    } catch (e) {
        return Promise.reject(`Error creating Flickr HD request feed. ${e.message}`);
    }    
};

var createModel = function( jResponse ) {
    let model = {
        'desc' : null,
        'links' : []
    };
    if ( util.isNullOrUndefined(jResponse) ) {  
        _util.traceLog(`No jResponse from flickr HD (0 links)`);      
        
    } else {

        //let desc = jResponse.title;        
        let desc = 'Flickr HD';
        model.desc = desc;
        let thePic = null;
        // See 'Photo Source URLs' https://www.flickr.com/services/api/misc.urls.html
        //let size = 'k'; // always returns 'image_no_longer_available
        let size = 'h';
        if ( !util.isNullOrUndefined(jResponse.photos) && Array.isArray(jResponse.photos.photo)) {
            _util.traceLog(`Received ${jResponse.photos.photo.length} Flickr HD items for ${desc}`);
            jResponse.photos.photo.forEach( item => {
                //_util.traceLog(JSON.stringify(item)+'\n');                
                // item.id = 26316947327
                // item.isfamily = 0
                // item.isfriend = 0
                // item.ispublic = 1
                // item.owner = 57289943@N03
                // item.secret = xxxxxx
                // item.server = 809
                // item.title = Puppyland-32
                // item.farm = 1
                thePic =  `https://farm${item.farm}.staticflickr.com/${item.server}/${item.id}_${item.secret}_${size}.jpg`;
                _util.traceLog(`(flickr HD) ${item.title} ${thePic}`);
                if ( !util.isNullOrUndefined(thePic)) {
                    let entry = {
                        'link' : thePic,
                        'published' : item.published,
                        'title' : item.title,
                        'desc' : item.description,
                        'provider' : 'flickrHD',
                    };
                    model.links.push( entry );
                }
            });
        }
            
    }

    return model;
};

module.exports = {
    'createFeed' : theFeed
};
