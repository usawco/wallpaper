const util = require('util');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const _util = require('./util');
const config = _util.config;
const ps = require('xml2js').parseString;

_util.traceLog('Loading RSS handler config');
_util.traceLog( JSON.stringify(config.providers.rss));

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
                        _util.traceLog(`RSS feed response received: ${res.statusCode} ${res.statusMessage}`);
                        //TODO what if RSS Feed URL returns a redirect...
			            _util.traceLog( `RSS feed returned response statusCode: ${res.statusCode} `);
                        if ( res.statusCode == 200) {
    		                try {                        
                                //_util.traceLog(`${decoder.write(sResponse)}`);
                                // xml2js parse xml string to json
                                ps(sResponse, (err, result) => {
                                    if ( err) {
                                        _util.traceLog(`Error parsing XML RSS feed ${url}. Error: ${err}`);
                                        _util.traceLog(sResponse);
                                    } else {
                                        let model = {
                                            'desc' : 'RSS',
                                            'links' : []
                                        };                                        
                                        Promise.all( findImages( result, feed['searchLinks']) ).
                                            then( responseBodies =>  searchHtml(responseBodies)).
                                            then( imageLinks => {
                                                // search location
                                                let locationLinks = searchLocation( result, feed['location']);
                                                imageLinks.push(...locationLinks);
                                                for (let jdx=0; jdx<imageLinks.length; jdx++) {
                                                    let link = imageLinks[jdx];                                                    
                                                    if ( !util.isNullOrUndefined(link)) {
                                                        let entry = {
                                                            'link' : link,
                                                            //'published' : item.pubDate,
                                                            //'title' : item.title,                                                            
                                                            //'desc' : item.description,
                                                            'title' : link,
                                                            'provider' : 'RSS',
                                                        };
                                                        model.links.push( entry );                                    
                                                    }
                                                }
                                                resolve(model);
                                            });
                                            
                                        
                                    }
                                
                                });
                            } catch (e) {

		                        reject(({'error' : e, 'reason' : `Unable to process the RSS response. Error message: ${e.message}`}));
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

var findImages = function( jResponse, searchLinks ) {

    let pLinks = [];
    if ( util.isNullOrUndefined(jResponse) ) {  
        _util.traceLog(`No jResponse from RSS handler (0 links)`);      
    } else {
        let theItem = null;
        if ( searchLinks && jResponse.rss && jResponse.rss.channel && Array.isArray(jResponse.rss.channel) ) {
            for ( let idx = 0; idx<jResponse.rss.channel.length; idx++) {
                if ( jResponse.rss.channel[idx].item && Array.isArray(jResponse.rss.channel[idx].item)) {
                    for ( let jdx=0; jdx<jResponse.rss.channel[idx].item.length; jdx++) {
                        theItem = jResponse.rss.channel[idx].item[jdx];
                        if ( !util.isNullOrUndefined(theItem.link) && Array.isArray( theItem.link)) {
                            for ( let kdx = 0; kdx<theItem.link.length; kdx++) {
                                let htmlLink = theItem.link[kdx];
                                if ( !util.isNullOrUndefined(htmlLink)) {
                                    _util.traceLog( `Looking in item link next: ${htmlLink}`);
                                    pLinks.push( _util.getHtmlPage( htmlLink));
                                }
                            }
                        }

                    }           
                }                           
            }
            
        }
    }            
    return pLinks;
};
var searchLocation = function( jResponse, location ) {
    let imageLinks = [];
    let theItem = null;
    if ( !util.isNullOrUndefined(location) && !util.isNullOrUndefined(jResponse) && jResponse.rss && jResponse.rss.channel && Array.isArray(jResponse.rss.channel) ) {
        for ( let idx = 0; idx<jResponse.rss.channel.length; idx++) {
            if ( jResponse.rss.channel[idx].item && Array.isArray(jResponse.rss.channel[idx].item)) {
                for ( let jdx=0; jdx<jResponse.rss.channel[idx].item.length; jdx++) {
                    theItem = jResponse.rss.channel[idx].item[jdx];
                    findKeys( theItem, imageLinks, location);
                    if ( imageLinks.length == 0) {
                        _util.traceLog( `No URLs found in ${location} elements`);
                        _util.traceLog( JSON.stringify( theItem, null, 4 ));      
                    }
                }
            }
        }
    }                        
    return imageLinks;
};


function searchHtml( responseBodies) {    
    return new Promise( (resolve) => {        
        let links = [];        
        if ( Array.isArray( responseBodies)) {
            for ( let idx=0; idx<responseBodies.length; idx++) {
                if ( !util.isNullOrUndefined(responseBodies[idx])) {
                    let body = responseBodies[idx].body;
                    
                    let str = responseBodies[idx].url;
                    let pos = str.lastIndexOf('/');
                    let link = null;
                    if ( pos > 0) {
                        link = str.substring(0,pos+1);
                    } else {
                        link = str;
                    }
                    if ( !util.isNullOrUndefined( body)) {

                        let start = body.toUpperCase().indexOf('<IMG SRC="');
                        if ( start > 0) {
                            str = body.substring( start+10);
                            let stop = str.indexOf('"');
                            if ( stop > 0) {    
                                let imgUrl = str.substring( 0, stop);                  
                                if ( imgUrl.startsWith('http')) {
                                    links.push( imgUrl);
                                } else {
                                    links.push( link + imgUrl);
                                }
                                
                            }
                        } else {
                            _util.traceLog(body);
                        }
                    }
                }
            }
        }
        resolve(links);
    });
}
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
