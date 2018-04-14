const path = require('path');
const os = require('os');

const CONFIG_FILE = 'config.json';
const HOME_DIR = path.resolve(os.homedir(),'.desktop-eye-candy');
// post-installation migrates the pre 4.0 'favorites' directry contents to this directory under HOME_DIR
const IMAGES_DIR = 'images';
const FAVORITES_FILE = 'favorites.json';
module.exports = {
    'CONFIG_FILE' : CONFIG_FILE,
    'HOME_DIR' : HOME_DIR,
    'FAVORITES_FILE' : FAVORITES_FILE,
    'IMAGES_DIR' : IMAGES_DIR
};