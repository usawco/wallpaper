// Override these settings, by creating a config.json file in the same directory 
// with this structure containing your data.
// 
var config = {
    'providers' : {
        'google' : {
            'enabled' : true,
            // https://cse.google.com/cse/all  ( codes are here)
            'cx' : 'customer id goes here',
            'key' : 'your key goes here',
            'terms' : ['kittens', 'OR', 'volcanoes'],
            // huge, large, xlarge, xxlarge
            'imgSize' : 'huge'

        },
        'bing' : {
            'enabled' : true,
            'key' : 'your key goes here',
            // AND OR NOT allowed 
            // Adv Operators: https://msdn.microsoft.com/library/ff795620.aspx
            'terms' : [ 'tropical', 'nature' ],
            'width' : 1920,
            'height' : 1080
        },      
        // https://pixabay.com/api/docs/
        'pixabay' : {
            'enabled' : true,
            'key' : 'your key goes here',
            'terms' : ['mountains', 'OR', 'forest', 'OR', 'ocean'],
            'width' : 1920,
            'height' : 1080
        },
        'flickr' : {
            'enabled' : false,
            'terms' : ['kittens', 'puppies'],
            // not supported yet...
            // 'width' : 1920,
            // 'height' : 1080
        }
    }
};
  
module.exports = config;