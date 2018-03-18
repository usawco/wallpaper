const util = require('util');
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs');
const _constants = require('./constants');

const infoLog = ( msg => {
    console.log( msg );
});

const configPath = path.resolve(_constants.CONFIG_DIR,_constants.CONFIG_FILE);
infoLog(`Resolving configuration from ${configPath}`);
const config = require( configPath );

const traceLog = util.debuglog('wallpaper');


/**
 * 
 * @param {*} url Image url
 * @param {*} imagePath  path to downloaded file
 * @returns Promise containing error message or imagePath
 */
const downloadTheImage = ( (url, imagePath) => {

    return new Promise( function( resolve, reject) {
        let theHttp = http;
        if ( util.isNullOrUndefined(url) ) {
            reject('Missing URL for image');
            return;
        }

        if ( util.isNullOrUndefined( imagePath)) {
            reject('Missing target imagePath for downloaded image');
            return;
        }
            
        if ( url.protocol === 'https:' ) {        
            theHttp = https;
        }
        let options = {
            url
        };
        var req = http.get(url, function(res) {
        
            infoLog( `Download Status: ${res.statusCode}`);
            traceLog(res.message);
            traceLog(JSON.stringify(res.headers));
        
            var bodyChunks = [];
            res.on('data', function(chunk) {
            // You can process streamed parts here...
            bodyChunks.push(chunk);
            }).on('end', function() {
                var body = Buffer.concat(bodyChunks);
                fs.writeFile( imagePath, body, (err) =>{
                    if ( err ) {
                        infoLog(`Error creating /tmp/wallpaper.json: ${err.message}`);
                        traceLog( err);
                        reject( `Error ${err} writing image data to ${imagePath}`)
                        return;
                    }
                    resolve(imagePath);
                });                
            })
        });


        req.on('error', function(e) {
            traceLog('ERROR: ' + e.message);
            traceLog( e.stack);
            reject( `Error downloading image ${e.message} from ${url}.`)
        });
        
    });
      
});



module.exports = {
    'infoLog' : infoLog,
    'traceLog' : traceLog,
    'config' : config,
    'downloadTheImage' : downloadTheImage
};