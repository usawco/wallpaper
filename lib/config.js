// Override these settings, by creating a config.json file in the same directory 
// with this structure containing your data.
// 
var config = {
    'imagePathDirectory' : '/tmp',
    'providers' : {        
        'favorites' : {
            'enabled' : true,            
            'desc' :  'List of favorite images',
            'feeds' : [
                // list of locations containing model entries
                'favorites/'
            ],
            
        },
        'google' : {
            'enabled' : false,
            'desc': 'Google custom search API',
            // https://cse.google.com/cse/all  ( codes are here)
            'cx' : 'customer id goes here',
            'key' : 'your key goes here',
            // Enable search terms
            'terms' : ['kittens', 'OR', 'volcanoes'],
            // huge, large, xlarge, xxlarge
            'imgSize' : 'huge'

        },
        'bing' : {
            'enabled' : false,
            'desc':  'Bing (Azure) image search API',
            'key' : 'your key goes here',
            // AND OR NOT allowed 
            // Adv Operators: https://msdn.microsoft.com/library/ff795620.aspx
            // Enable search terms
            'terms' : [ 'tropical', 'nature' ],
            'width' : 1920,
            'height' : 1080
        },      
        // https://pixabay.com/api/docs/
        'pixabay' : {
            'enabled' : false,
            'desc' : 'Pixabay.com image search API',
            'key' : 'your key goes here',
            // Enable search terms
            'terms' : ['mountains'],
            'width' : 1920,
            'height' : 1080
        },
        'flickr' : {
            'enabled' : false,
            'desc' : 'Flickr low resolution images (No key required)',
            // Enable search terms
            'terms' : ['kittens', 'puppies'],
            // not supported yet...
            // 'width' : 1920,
            // 'height' : 1080
        },
        //https://www.flickr.com/services/api/
        // https://www.flickr.com/services/api/flickr.photos.search.html
        'flickrHD' : {
            'enabled' : false,
            'desc' : 'Flickr HD images',
            // Enable search terms
            'terms' : ['kittens', 'puppies'],
            'apiKey' : 'your key goes here',
        }
    }
};
  
module.exports = config;
