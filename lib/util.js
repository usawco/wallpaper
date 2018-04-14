const util = require('util');
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs');
const {URL} = require('url');
const {StringDecoder} = require('string_decoder');
const jimp = require('jimp');

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

const traceLog = util.debuglog('wallpaper');

const configPath = path.resolve(_constants.HOME_DIR,_constants.CONFIG_FILE);
traceLog(`Resolving configuration from ${configPath}`);
const config = require( configPath );



if ( util.isNullOrUndefined(config)) {
    infoLog(`${configPath} is missing!`);    
}

if ( util.isNullOrUndefined(config.imagePathDirectory)) {
    config.imagePathDirectory = '/tmp';
}

if ( !fs.existsSync( config.imagePathDirectory) ) {
    infoLog(`Creating ${config.imagePathDirectory}, to contain downloaded image file and metadata.`);
    fs.mkdirSync(config.imagePathDirectory);
}
const imagePath = `${config.imagePathDirectory}/wallpaper.jpg`;

/*
* Perform any updates to the image using jimp

* @param {*} entry Json metadata for the selected image 
* @returns Promise containing error message or imagePath
*/
var updateImage = ( (entry) => {
    return new Promise( function( resolve, reject) {
        if ( util.isNullOrUndefined( imagePath)) {
            return reject( new Error(`imagePath not specified`));
        }

        
        if ( fs.lstatSync(imagePath).isFile ) {

            try {
                jimp.read( imagePath, function (err, image) {      
                    if ( err ) {
                        traceLog(`Error reading image by jimp read image: ${err}`);  
                        if ( entry.provider === 'pixabay') {
                            reject( err );
                            return;                        
                        }
                    } else {
                        traceLog(`Jimp read image: ${image}`);              
                        jimp.loadFont(jimp.FONT_SANS_16_BLACK).then(function (font) {
                            traceLog(`font loaded`);
                            let msg = `[${entry.provider}] ${entry.title}`;
                            image.print(font, 100, 50, msg);                            
                            traceLog(`${msg} printed`);
                            image.write(imagePath);
                            traceLog(`image saved`);

                        }).catch( (err) => {
                            traceLog(`Error reading image by jimp read image: ${err}`);  
                            traceLog(`Error loading font by jimp read image: ${err}`);  
                            if ( entry.provider === 'pixabay') {
                                reject( err );
                                return;
                            };
                        });
                    }

                });
                resolve(imagePath);
            } catch (e) {
                if ( entry.link.indexof('pixabay') > 0 ) {
                    // part of the required terms is to give Pixabay credit for hidef images
                    reject(`Unable to credit Pixabay image. ${e.message}`);
                    traceLog(`Unable to credit Pixabay image. ${e}`);
                    return;
                }
                resolve(imagePath);
            }
        }

        

    });
});

/**
 * 
 * @param {*} entry Json metadata for the selected image 
 * @returns Promise containing error message or imagePath
 */
var downloadTheImage = ( (entry) => {
    

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
                try {
                    fs.createReadStream(entry.link).pipe(fs.createWriteStream(imagePath));  
                    return resolve({'statusCode' : 200, 'entry' : entry, 'info' : imagePath});  

                } catch (e1) {
                    return reject( e1 );
                }
                return;
            }
                        
            reject( `Invalid URL for image: ${entry.link}`);        
        }

        let theHttp = http;
        if ( util.isNullOrUndefined(url) ) {
            return reject( new Error(`Missing URL for image.`));
            
        }


        if ( util.isNullOrUndefined( imagePath)) {
            return reject( new Error(`Missing destination image file path to receive download.`));
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
                } else if ( statusCode > 300 && statusCode < 304 && res.headers.location) {
                    // get new URL from the 'location' response header.
                    // return this so the caller can update the json entry and call again...
                    resolve({'statusCode' : statusCode, 'info' : res.headers.location});
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
    'downloadTheImage' : downloadTheImage,
    'imagePath' : imagePath,
    'updateImage' : updateImage
};