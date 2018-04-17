const util = require('util');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const _util = require('./util');
const config = _util.config;
const ps = require('xml2js').parseString;

_util.traceLog('Loading RSS handler config');
_util.traceLog( JSON.stringify(config.providers.rss));

// 3 secs
const msTimeout = 3000;

let feeds = [];
if ( util.isNullOrUndefined(config.providers.rss.feeds)) {
    _util.traceLog('RSS handler has no URL feeds configured');

} else {
    feeds = config.providers.rss.feeds;
}


var sResponse;

var theFeed = ( () => {
    let models = [];
    _util.infoLog(`RSS feed enabled? ${config.providers.rss.enabled}`);
    
    if ( config.providers.rss.enabled) {
        for ( var key of Object.keys( feeds)) {
            models.push( feedMe(feeds[key], models) );
        };
    }
    return Promise.all(models);
});

var feedMe = function(feed, models) {
    let theHttp = http;
    feed.urls.forEach( url => {

    
        if ( url.toString().indexOf('https://') == 0 ) {        
            theHttp = https;
        }

        _util.traceLog('Creating promise for RSS feed handler: ${url}');
        try {
            let p = new Promise( (resolve, reject) => {
                let options = new URL(url);        
                options.headers = {
                    'Accept' : 'application/xml',
                    'Content-Type' : 'application/x-www-form-urlencoded'
                };
                let req = theHttp.request( options );   
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
                        _util.traceLog(`RSS feed response received: ${res.statusCode} ${res.statusMessage}`);
                        //TODO what if RSS Feed URL returns a redirect...
			_util.traceLog( `RSS feed returned response statusCode: ${res.statusCode} `);
                        if ( res.statusCode == 200) {
		                try {                        
		                    //_util.traceLog(`${decoder.write(sResponse)}`);
		                    ps(sResponse, (err, result) => {
		                        if ( err) {
		                            _util.traceLog(`Error parsing XML RSS feed ${url}. Error: ${err}`);
		                            _util.traceLog(sResponse);
		                        } else {
		                            //let jResponse  =JSON.parse( result);
		                            resolve(createModel(result, feed['location']));
		                        }
		                    });
		                } catch (e) {

		                    reject(({'error' : e, 'reason' : `Unable to parse the Pixabay JSON response: ${e.message}`}));
		                }
                        
                        }

                    });
                }); // request onResponse

                // send it
                req.end();

            });   // return the new Promise
            models.push(p);

        } catch (e) {
            models.push( Promise.reject(`Error creating RSS request feed. ${e.message}`) );
        }
    });
}; 

var createModel = function( jResponse, location ) {
    let model = {
        'desc' : null,
        'links' : []
    };
    if ( util.isNullOrUndefined(jResponse) ) {  
        _util.traceLog(`No jResponse from Pixabay (0 links)`);      
    } else {
        let desc = null;
        let idx=0;
        let total = 0;
        if ( jResponse.rss && jResponse.rss.channel && Array.isArray(jResponse.rss.channel) ) {
            for ( idx = 0; idx<jResponse.rss.channel.length; idx++) {
                desc = `RSS feed - ${jResponse.rss.channel[idx].title}`;
                if ( jResponse.rss.channel[idx].item && Array.isArray(jResponse.rss.channel[idx].item)) {
                    jResponse.rss.channel[idx].item.forEach( item => {
                        let links = [];
                        findKeys( item, links, location);
                        if ( links.length == 0) {
                            _util.traceLog( `No URLs found in ${location} elements`);
                            _util.traceLog( JSON.stringify( item, null, 4 ));                
                        }
                        total += links.length;
                        links.forEach ( link => {
                            let entry = {
                                'link' : link,
                                'published' : item.pubDate,
                                'title' : item.title,
                                'desc' : item.description,
                                'provider' : desc,
                            };
                            model.links.push( entry );

                        });
                    });            
                }                           
            }
            _util.infoLog(`Received ${total} RSS feed items for ${desc}`);
            model.desc = desc;
            
        }
    }            
    return model;
};


function findKeys( jsonObject, links, location ) {
  let jType = typeof(jsonObject);  
  if ( "object" === jType ) {
    for ( var key of Object.keys(jsonObject)) {
      let value = jsonObject[key];
      if ( !util.isNullOrUndefined(value )) {
        if ( key == location) {
            let key = 'http';
            let pos = value.indexOf(key);
            if (pos >= 0)  {
		// TODO, add regex to pick URL out of rest of element
                let theUrl = value.substring(pos);  
                links.push(theUrl);
            }
        } else if ( Array.isArray( value)) {
            value.forEach( ar => {
                let vType = typeof(ar);
                if ( "object" === vType ) {
                    findKeys( ar, links, location );
                }                    
            });
        } else {                       
            let vType = typeof(value);
            if ( "object" === vType ) {
                findKeys( value, links, location );
            }
        }
      }
    }
  }  
}

module.exports = {
    'createFeed' : theFeed
};
