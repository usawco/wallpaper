const path = require('path');
const os = require('os');

const CONFIG_FILE = 'config.json';
const CONFIG_DIR = path.resolve(os.homedir(),'.desktop-eye-candy');
module.exports = {
    'CONFIG_FILE' : CONFIG_FILE,
    'CONFIG_DIR' : CONFIG_DIR,
};