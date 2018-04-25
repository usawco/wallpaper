const https = require('https');
const { URL } = require('url');
const util = require('util');
const _util = require('./util');
const config = _util.config;

const terms = config.providers.flickr.terms;

_util.traceLog('Loading flickr config');
_util.traceLog( JSON.stringify(config.providers.flickr));

let urls = [];

terms.forEach( term => {
   urls.push( `https://api.flickr.com/services/feeds/photos_public.gne?tags=${term}&format=json&nojsoncallback=1`);
});

var theFeed = ( () => {    

    let models = [];
    _util.infoLog(`Flickr feed enabled? ${config.providers.flickr.enabled}`);
    if ( config.providers.flickr.enabled ) {
        _util.traceLog('Creating promises for flicker feed handler');
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

            _util.traceLog(`Flickr promise for ${url}`);
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
        return Promise.reject(`Error creating Flickr request feed. ${e.message}`);
    }    
};

var createModel = function( jResponse ) {
    let model = {
        'desc' : null,
        'links' : []
    };
    if ( util.isNullOrUndefined(jResponse) ) {  
        _util.traceLog(`No jResponse from flickr (0 links)`);      
        
    } else {

        let desc = jResponse.title;        
        model.desc = desc;
        let thePic = null;
        if ( !util.isNullOrUndefined(jResponse.items) && Array.isArray(jResponse.items)) {
            _util.traceLog(`Received ${jResponse.items.length} Flickr items for ${desc}`);
            jResponse.items.forEach( item => {
                //_util.traceLog(JSON.stringify(item)+'\n');
                _util.traceLog(`(flickr) ${item.title} ${item.media.m}`);
                thePic = item.media.m;
                if ( !util.isNullOrUndefined(thePic)) {
                    let entry = {
                        //'link' : item.link,
                        'link' : item.media.m,
                        'published' : item.published,
                        'title' : item.title,
                        'desc' : item.description,
                        'provider' : 'flickr',
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
