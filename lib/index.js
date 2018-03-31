
const wp = require('./wallpaper-controller.js');

module.exports = {
    'generateImage' : wp.generateImage,  // create a new image file
    'setBackground' : wp.setDesktopImage, // set last entry image on desktop
    'getLastEntry' : wp.getLastEntry // get the json metadata for last image
    
};
