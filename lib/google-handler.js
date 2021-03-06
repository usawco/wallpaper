const https = require('https');
const { URL } = require('url');

const util = require('util');
const _util = require('./util');
const config = _util.config;



_util.traceLog('Loading Google config');
_util.traceLog( JSON.stringify(config.providers.google));

/*
searchTerm = 'parrot'
startIndex = '1'
key = ' Your API key here. '
cx = ' Your CSE ID:USER here. '
searchUrl = "https://www.googleapis.com/customsearch/v1?q=" + \
    searchTerm + "&start=" + startIndex + "&key=" + key + "&cx=" + cx + \
    "&searchType=image"
*/    
/*const apiKey = 'AIzaSyC7OkefaCMSzD0AckGY3AR98w03OexJIfk';
const terms = [
    //'mountains','forests', 'oceans', 'cats','dogs','universe'
    'kittens', 'OR', 'volcanoes'
    //'linux'
    //'fantasy'
    ];

const cx = '011234693644851488476:l3qriqihqgk';
*/
const apiKey = config.providers.google.key;
const terms = config.providers.google.terms;
const cx = config.providers.google.cx;
// color, gray, mono
//const imgColorType = 'color'; 
// huge, large, xlarge, xxlarge
//const imgSize = 'huge';
const imgSize = config.providers.google.imgSize;

// clipart, face, photo, news, lineart
const imgType = 'photo';

const searchType = 'image';

// high, medium , off
const safe="high";
//const safe="off";

//const startIndex = Math.random(10);


const fileType = "jpg";

let feeds = [];
if ( terms.length > 0) {
    feeds = [
        `https://www.googleapis.com/customsearch/v1?cx=${cx}&key=${apiKey}&q=${terms.join('%20')}` +
            `&safe=${safe}&imgSize=${imgSize}` +
           `&searchType=${searchType}&imgType=${imgType}&fileType=${fileType}&alt=json`    
    ];
} else {
    _util.traceLog('Google feed has no search terms defined');
}

var sResponse;

var theFeed = ( () => {
    let models = [];
    _util.infoLog(`Google feed enabled? ${config.providers.google.enabled}`);
    if ( config.providers.google.enabled ) {
        feeds.forEach(url => {
            models.push( feedMe(url) );
        });
    }
    return Promise.all(models);
});


var feedMe = function(url) {
    _util.traceLog(`Creating promise for google feed handler: ${url}`);
    try {
        return new Promise( (resolve, reject) => {
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
                    _util.traceLog(`Google search response received: ${res.statusCode} ${res.statusMessage}`);
                    if ( res.statusCode == 200) {
                    try {                        
                        //_util.traceLog(`${decoder.write(sResponse)}`);
                        let jResponse = JSON.parse( sResponse );

                        resolve(createModel(jResponse) );
                    } catch (e) {
                        _util.traceLog(`Unable to parse the Google JSON response: ${e.message}`);
                        reject(({'error' : e, 'reason' : 'Unable to parse the Google JSON response'}));
                    }
                    
                    } else {
                        //If Ihit the limit, just ignore it
                        resolve(createModel(null));
                        //reject({ 'error': null, 'reason' : `Received (${res.statusCode}) ${res.statusMessage}`});
                    }
                    
                });
            }); // request onResponse

            // send it
            req.end();

        });   // return the new Promise
    } catch (e) {
        return Promise.reject(`Error creating Google request feed. ${e.message}`);
    }
}; 
/*
{
  "kind": "customsearch#search",
  "url": {
    "type": "application/json",
    "template": "https://www.googleapis.com/customsearch/v1?q={searchTerms}&num={count?}&start={startIndex?}&safe={safe?}&cx={cx?}
    &sort={sort?}&filter={filter?}&gl={gl?}&cr={cr?}&googlehost={googleHost?}&c2coff={disableCnTwTranslation?}
    &hq={hq?}&hl={hl?}&siteSearch={siteSearch?}&siteSearchFilter={siteSearchFilter?}&exactTerms={exactTerms?}
    &excludeTerms={excludeTerms?}&linkSite={linkSite?}&orTerms={orTerms?}&relatedSite={relatedSite?}
    &dateRestrict={dateRestrict?}&lowRange={lowRange?}&highRange={highRange?}&searchType={searchType}&fileType={fileType?}
    &rights={rights?}&imgSize={imgSize?}&imgType={imgType?}&imgColorType={imgColorType?}&imgDominantColor={imgDominantColor?}&alt=json"
  },
*/
var createModel = function( jResponse ) {
    let model = {
        'desc' : null,
        'links' : []
    };
    if ( util.isNullOrUndefined(jResponse) ) {  
        _util.traceLog(`No jResponse from Google (0 links)`);      

    } else {
        //console.log( JSON.stringify( jResponse, null, 4));
        let desc = null;
        if ( jResponse.context ) {
            desc = jResponse.context.title;
        } else {
            desc = 'Google search';
        }
        let total = jResponse.searchInformation.totalResults;        
        model.desc = desc;
        if ( total > 0 ) {
        
            let thePic = null;

            _util.traceLog(`Received ${jResponse.items.length} Google search items for ${desc}`);
            jResponse.items.forEach( item => {
                //_util.traceLog(JSON.stringify(item)+'\n');
                //let height = item.image.height;
                //let width = item.image.width;            
                thePic = item.link;                    
                _util.traceLog(`(google) item title: ${item.title}  url:  ${thePic}`);
                if ( !util.isNullOrUndefined( thePic)) {

                    let entry = {
                        'link' : thePic,
                        //'link' : pagemap.link,
                        'published' : item.published,
                        'title' : item.title,
                        //'desc' : `${width}x${height}`
                        'provider' : 'google',
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
