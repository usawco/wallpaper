const https = require('https');
const { URL } = require('url');
const util = require('util');
const _util = require('./util');
const config = _util.config;


_util.traceLog('Loading Pixabay config');
_util.traceLog( JSON.stringify(config.providers.pixabay));

// 3 secs
const msTimeout = 3000;

// https://pixabay.com/api/docs/

const apiKey = config.providers.pixabay.key;
const terms = config.providers.pixabay.terms;
const minHeight = config.providers.pixabay.height;
const minWidth = config.providers.pixabay.width;
/*
const apiKey = '8096402-415e3429b551a74d7eba123ad';
const terms = [
    //'nature','OR','cats','OR','dogs','OR','universe','OR','mountains'
    //'mountains', 'OR', 'forests', 'OR', 'house%20cats', 'OR', 'kittens'
    'mountains', 'OR', 'forest', 'OR', 'ocean'
    //'galaxy', 'OR', 'planets'
    //'yellow','flower'
    ];
*/
const imgType = 'photo';
const safe = 'true';
const editorschoice = 'false';
/*
const minWidth = '1920';
const minHeight = '1080';
*/
const perPage = '30';
const order = 'latest';
//const order = 'popular';

//const responseGroup = 'image_details';  // item.userImageURL
const responseGroup = 'high_resolution';  // item.fullHDURL

let feeds = [];
if ( terms.length > 0) {
    feeds = [
    
        // &response_group=high_resolution  request
        // fullHDURL  is the wallpaper
        `https://pixabay.com/api/?key=${apiKey}&q=${terms.join('+')}` +
            `&image_type=${imgType}&safesearch=${safe}`+
            `&min_width=${minWidth}&min_height=${minHeight}` +
            `&editors_choice=${editorschoice}` +
            `&imgType=${imgType}&response_group=${responseGroup}` +
            `&order=${order}&per_page=${perPage}`
    
    ];
} else {
    _util.traceLog('Pixabay feed has no search terms defined');
}

var sResponse;

var theFeed = ( () => {
    let models = [];
    _util.infoLog(`Pixabay feed enabled? ${config.providers.pixabay.enabled}`);
    
    if ( config.providers.pixabay.enabled) {
        feeds.forEach(url => {
            models.push( feedMe(url) );
        });
    }
    return Promise.all(models);
});

var feedMe = function(url) {
    _util.traceLog('Creating promise for Pixabay feed handler: ${url}');
    try {
        return new Promise( (resolve, reject) => {
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
                    _util.traceLog(`Pixabay custom search response received: ${res.statusCode} ${res.statusMessage}`);
                    if ( res.statusCode == 200) {
                    try {                        
                        //_util.traceLog(`${decoder.write(sResponse)}`);
                        let jResponse = JSON.parse( sResponse );
                        resolve(createModel(jResponse) );
                    } catch (e) {

                        reject(({'error' : e, 'reason' : `Unable to parse the Pixabay JSON response: ${e.message}`}));
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
        return Promise.reject(`Error creating Pixabay request feed. ${e.message}`);
    }
}; 
var createModel = function( jResponse ) {
    let model = {
        'desc' : null,
        'links' : []
    };
    if ( util.isNullOrUndefined(jResponse) ) {  
        _util.traceLog(`No jResponse from Pixabay (0 links)`);      
    } else {
        let desc = null;
        if ( jResponse.context ) {
            desc = `Pixabay search - ${jResponse.context.title}`;
        } else {
            desc = 'Pixabay search';
        }
        let total = jResponse.totalHits;        
        _util.traceLog(`Received ${total} pixabay items for ${desc}`);
        model.desc = desc;
        if ( total > 0 ) {            
            jResponse.hits.forEach( item => {

                // item.pageURL -- links to itemDetails
                // item.webformatURL -- always < 640 px
                // item.userImageURL -- original upload in its original resolution
                // item.fullHDURL -- this is 1920x1080 ( requires responseGroup: high_resolution )
                let thePic = item.fullHDURL;
                _util.traceLog(`(pixabay) item views: ${item.views}    url? ${thePic}`);
                //_util.traceLog(JSON.stringify(item)+'\n');
                if ( !util.isNullOrUndefined(thePic)) {
                    let entry = {
                        'link' : thePic,
                        'published' : item.user,
                        'title' : item.user,
                        'desc' : `item likes: ${item.likes}`,
                        'provider' : 'https://pixabay.com/',
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
