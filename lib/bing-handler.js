const https = require('https');
const { URL } = require('url');
const _util = require('./util');
const util = require('util');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config.json');

_util.traceLog('Loading Bing config');
_util.traceLog( JSON.stringify(config));

// 3 secs
const msTimeout = 3000;

// https://docs.microsoft.com/en-us/azure/cognitive-services/bing-image-search/
// https://dev.cognitive.microsoft.com/docs/services/8336afba49a84475ba401758c0dbf749/operations/56b4433fcf5ff8098cef380c


const apiKey = config.providers.bing.key;
const terms = config.providers.bing.terms;

const count = '35';
// Strict Off Moderate
const safeSearch = 'Strict';
// Wide, Tall, Square, 
const aspect = 'Wide';
const height = config.providers.bing.height;
const width = config.providers.bing.width;
const imageType = 'Photo';
const size = 'Wallpaper';
const modules = 'Caption,BRQ';



//const responseGroup = 'image_details';  // item.userImageURL
const responseGroup = 'high_resolution';  // item.fullHDURL

let feeds = [];
if ( config.providers.bing.enabled && terms.length > 0) {
    feeds = [
    
        // &response_group=high_resolution  request
        // fullHDURL  is the wallpaper
        //`https://api.cognitive.microsoft.com/bing/v7.0/images/trending?` +
        `https://api.cognitive.microsoft.com/bing/v7.0/images/search?` +
            `subscription-key=${apiKey}` +
            `&q=${terms.join('+')}&count=${count}&safeSearch=${safeSearch}` +
            `&aspect=${aspect}&height=${height}&width=${width}&imageType=${imageType}&size=${size}`
    ];
} else {
    _util.infoLog('Bing feed disabled');
}
var decoder = new StringDecoder('utf8');

var sResponse;

var theFeed = ( () => {
    _util.traceLog('Creating promise for bing feed handler');
    let models = [];
    feeds.forEach(url => {
        models.push( feedMe(url) );
        console.log(url);
    });

    return Promise.all(models);
});

var feedMe = function(url) {
    _util.traceLog('Creating promises for google feed handler');
    try {
        return new Promise( (resolve, reject) => {
            console.log(`Search query: ${url}`);
            let options = new URL(url);        
            options.headers = {
                'Accept' : 'application/json',
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Ocp-Apim-Subscription-Key' : apiKey,
                'User-Agent' : 'PC'
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
                    _util.traceLog(`bing custom search response received: ${res.statusCode} ${res.statusMessage}`);
                    if ( res.statusCode == 200) {
                    try {                        
                        //_util.traceLog(`${decoder.write(sResponse)}`);
                        let jResponse = JSON.parse( sResponse );
                        resolve(createModel(jResponse) );
                    } catch (e) {

                        reject(({'error' : e, 'reason' : `Unable to parse the bing JSON response: ${e.message}`}));
                    }
                    
                    } else {
                        reject({ 'error': null, 'reason' : `Received (${res.statusCode}) ${res.statusMessage}`});
                    }
                    
                });
            }); // request onResponse

            // send it
            req.end();

        });   // return the new Promise
    } catch (e) {
        return Promise.reject(`Error creating bing request feed. ${e.message}`);
    }
}; 
var createModel = function( jResponse ) {
    let model = {
        'desc' : null,
        'links' : []
    };
    if ( util.isNullOrUndefined(jResponse) ) {  
        _util.traceLog(`No jResponse from bing (0 links)`);      
    } else {
        let desc = 'Bing Image Search';
        let total = jResponse.totalEstimatedMatches;        
        _util.traceLog(`Received ${total} bing items for ${desc}`);
        model.desc = desc;
        if ( total > 0 ) {            
            jResponse.value.forEach( item => {

                // item.pageURL -- links to itemDetails
                // item.webformatURL -- always < 640 px
                // item.userImageURL -- original upload in its original resolution
                // item.fullHDURL -- this is 1920x1080 ( requires responseGroup: high_resolution )
                let thePic = item.contentUrl;
                _util.traceLog(`(bing) item views: ${item.views}    url? ${thePic}`);
                //_util.traceLog(JSON.stringify(item)+'\n');
                if ( !util.isNullOrUndefined(thePic)) {
                    let entry = {
                        'link' : thePic,
                        'published' : item.datePublished,
                        'title' : item.name,
                        'desc' : item.imageCaption, // comes from 'modules' param
                        'provider' : 'bing',
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
