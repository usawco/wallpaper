const https = require('https');
const { URL } = require('url');
const _util = require('./util');
const util = require('util');

const config = require('./config.json');

// 3 secs
const msTimeout = 3000;

const terms = config.providers.flickr.terms;

let urls = [];

terms.forEach( term => {
   urls.push( `https://api.flickr.com/services/feeds/photos_public.gne?tags=${term}&format=json&nojsoncallback=1`);
});

var theFeed = ( () => {
    _util.traceLog('Creating promises for flicker feed handler');

    let models = [];
    if ( config.providers.flickr.enabled ) {
        
        urls.forEach(url => {
            models.push( feedMe(url) );
        });
    } else {
        _util.infoLog('flickr feed disabled');
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
            req.setTimeout( msTimeout, () => {
                _util.traceLog( `Connection timeout to ${url}`);                
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
                            //_util.traceLog( `Error parsing JSON response:\n${sResponse}`);
                            _util.traceLog( `Error parsing JSON response: ${e.message}`);
                            //reject(({'error' : e, 'reason' : 'Unable to parse the Flicker JSON response'}));
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