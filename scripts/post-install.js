/**
 * There is intentionally no reference to the local 'lib/util' in this script since it runs before the config.json is initailized
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const util = require('util');
const _constants = require('../lib/constants');

console.log('Executing post installation script');
var homeDirPath = path.resolve( _constants.HOME_DIR);
var configJsonPath = path.resolve( homeDirPath, _constants.CONFIG_FILE);    
var pre40FavoritesPath = path.resolve( __dirname, '../favorites');
var objConfig = {}; // the user's config in ~/.desktop-eye-candy/config.json

setup();

// This breaks npm -g uninstall desktop-eye-candy
//removeScript();
console.log("Post installation step completed");

function setup() {
    try {
        createHome();
        configureImagePath();
        migrateFavorites();
        
    } catch (e) {
        console.log(`Warning, unable to complete all setup tasks. ${e.message}`);
        console.log(e.stack);
    }
}

function createHome() {    
    if ( !fs.existsSync(homeDirPath)) {        
        console.log(`Creating app home directory in ${homeDirPath}`);        
        fs.mkdirSync(homeDirPath);
    }

    let userJsonExists = fs.existsSync(configJsonPath);
    let jsConfig = require( '../lib/config.js'); // the config.js script
    if ( userJsonExists) {   
        let data = fs.readFileSync( configJsonPath);    
        try { 
            objConfig = JSON.parse( data );
        } catch (e) {
            console.error( `Unable to parse ${configJsonPath}.  It must be valid JSON. Correct syntax or delete file and re-install. ${e.message} `)
            throw e;
        }
    } else {
        objConfig = {};
    }
    console.log(`Copying new elements from package's config.js into ${configJsonPath}`);
    deepCopy( jsConfig, objConfig );
    fs.writeFileSync( configJsonPath, JSON.stringify(objConfig, null, 4));

}

function configureImagePath() {

    // if windows, prepend 'C:' drive letter if it is not already present
    if ( 'win32' === os.platform() ) {
        objConfig = require( configJsonPath );
        var re = new RegExp("^([a-zA-Z]{1}[:]{1}.*)$");
        if (!re.test(objConfig.imagePathDirectory)) {
            console.log("Prepending 'C:' driver letter to the image path. (A drive letter is required for win32)")
            objConfig.imagePathDirectory = 'C:' + objConfig.imagePathDirectory;

            fs.writeFileSync( configJsonPath, JSON.stringify(objConfig, null, 4));
        }
    }
}

// migrate the pre4.0 favorites installations
function migrateFavorites() {
    const jsonFavoritesPath = path.resolve(homeDirPath,_constants.FAVORITES_FILE); // v4.0+ favorites JSON file
    const oldFavoritesPath = path.resolve( __dirname, '../favorites'); // pre4.0 sample favorites
    const localImagesPath = path.resolve( homeDirPath, _constants.IMAGES_DIR);
        // copy local images that come with the installation
    if ( !fs.existsSync(localImagesPath)) {        
        console.log(`Creating favorites directory in ${localImagesPath}`);        
        fs.mkdirSync(localImagesPath);
        console.log('Migrating local sample image files installed with the product');
        if ( fs.existsSync(oldFavoritesPath)) {  
            fs.readdir(oldFavoritesPath, (err, items) => {
                console.log(items);
                if ( err) {
                    console.log(`Unable to install sample favorites. ${err}`);
                }                
                let jsonFavorites = {}; // JSON object for the pre4.0 items.json file
                for (var i=0; i<items.length; i++) {
                    try {
                        if ( 'items.json' === items[i])  {
                            data = fs.readFileSync( path.resolve(oldFavoritesPath, 'items.json'));     
                            jsonFavorites = JSON.parse(data);
                            jsonFavorites.items.pop(); // remove the local file from favorites
                        } else {
                            // works with pre 8.5 API ( before fs.fileCopy)
                            fs.createReadStream(path.resolve(oldFavoritesPath,items[i])).pipe(fs.createWriteStream(path.resolve( localImagesPath, items[i])));
                        }
                    } catch (e) {
                        console.log(`Unable to migrate sample favorites. ${e}`);
                    }
                }
                // save the favorites to the new location
                fs.writeFileSync( jsonFavoritesPath, JSON.stringify(jsonFavorites, null, 4));
            });
        }
    }

    // remove this feed key from the json config file.
    delete objConfig.providers.favorites.feeds
    objConfig.providers.localFS.feeds = [ localImagesPath];
    fs.writeFileSync( configJsonPath, JSON.stringify(objConfig, null, 4));
    

}

function removeScript() {
    try {
        let osp = os.platform();
        if ( "win32" === osp) {
            fs.unlinkSync(path.resolve(__dirname, '../bin/wallpaper.sh'));
        } else if ( "linux") {
            fs.unlinkSync(path.resolve(__dirname, '../bin/wallpaper.bat'));
        }
    } catch (e) {

    }
}
/**
 * non-destructive recursive copy. used for config as long as its depth remains shallow
 * Otherwise, switch to a stack push and pop
 */
function deepCopy(src, target) {

    if ( !util.isNullOrUndefined(src) /*&& !util.isNullOrUndefined(target) */ ) {
        Object.keys(src).forEach( key => {
            let val = src[key];
            if( util.isNullOrUndefined( target[key])) {
                target[key] = val;
            } else if ( typeof val == "object") {
                deepCopy(val, target[key]);    
            }
        });                 
    }
}

