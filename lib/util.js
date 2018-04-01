const util = require('util');
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs');
const {URL} = require('url');
const {StringDecoder} = require('string_decoder');

const _constants = require('./constants');

var decoder = new StringDecoder('utf8');

const bufferToString = ((data) => {
    let str = null;
    if ( Buffer.isBuffer(data)) {
        str = decoder.write(data);
    } else {
        str = data;
    }
    return str;
});
const infoLog = ( msg => {
    console.log( bufferToString(msg));    
});
const errorLog = ( msg => {
    console.error( bufferToString(msg));
});

const configPath = path.resolve(_constants.CONFIG_DIR,_constants.CONFIG_FILE);
infoLog(`Resolving configuration from ${configPath}`);
const config = require( configPath );

const traceLog = util.debuglog('wallpaper');


/**
 * 
 * @param {*} entry Json metadata for the selected image 
 * @returns Promise containing error message or imagePath
 */
var downloadTheImage = ( (entry) => {
    const imagePath = '/tmp/wallpaper.jpg';

    if ( util.isNullOrUndefined(entry)) {
        return Promise.reject( new Error(`Downloader called with no image selected.`));
    } 
    infoLog(`Downloading image for entry ${JSON.stringify(entry)} to ${imagePath}`);

    return new Promise( function( resolve, reject) {
            

        let url = null;
        try {
            url = new URL(entry.link);
        } catch (e) {
            if ( fs.lstatSync(entry.link).isFile ) {
                fs.copyFileSync(entry.link, imagePath);
                return Promise.resolve({'statusCode' : 200, 'entry' : entry, 'info' : imagePath});
            }
            return Promise.reject( `Invalid URL for image: ${entry.link}`);        
        }

        let theHttp = http;
        if ( util.isNullOrUndefined(url) ) {
            return Promise.reject( new Error(`Missing URL for image.`));
            
        }


        if ( util.isNullOrUndefined( imagePath)) {
            return Promise.reject( new Error(`Missing destination image file path to receive download.`));
        }
            
        if ( url.protocol === 'https:' ) {        
            theHttp = https;
        }
        infoLog(`Downloading ${url}`);
        var req = theHttp.get(url, function(res) {
        
            infoLog( `Download Status: ${res.statusCode}`);
            traceLog(`Response headers: ${JSON.stringify(res.headers)}`);
        
            var bodyChunks = [];
            res.on('data', function(chunk) {   
            bodyChunks.push(chunk);
            }).on('end', function() {  
                let statusCode = res.statusCode;
                if ( statusCode == 200) {
                    var body = Buffer.concat(bodyChunks);
                    fs.writeFile( imagePath, body, (err) =>{
                        if ( err ) {
                            infoLog(`Error creating ${imagePath}: ${err.message}`);
                            traceLog( err);
                            resolve( {'statusCode': 0, 'entry' : entry, 'info' : `Error ${err} writing image data to ${imagePath}`});
                            return;
                        }
                        infoLog(`Created ${imagePath}`);
                        resolve({'statusCode' : 200, 'entry' : entry, 'info' : imagePath});
                    });                
                } else if ( statusCode == 301 ) {
                    // get new URL from the Location response header.
                    // return this so the caller can update the json entry and call again...
                    resolve({'statusCode' : 301, 'info' : res.getHeaders['location']});
                } else {
                    reject({'statusCode' : statusCode, 'entry' : entry, 'info' : res.message} );
                }
            });
        });


        req.on('error', function(e) {
            traceLog('ERROR: ' + e.message);
            traceLog( e.stack);
            reject( new Error(`Error downloading image ${e.message} from ${url}.`));
        });
        
    });
      
});



module.exports = {
    'bufferToString' : bufferToString,
    'infoLog' : infoLog,
    'traceLog' : traceLog,
    'errorLog' : errorLog,
    'config' : config,
    'downloadTheImage' : downloadTheImage
};