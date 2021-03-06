// Override these settings, by creating a config.json file in the same directory 
// with this structure containing your data.
// 
var config = {
    // for windows, you need to specify the drive letter. e.g. c:/tmp
    'imagePathDirectory' : '/tmp',
    'socketTimeout' : 7000, // 7 seconds
    'providers' : {    
        
        'favorites': {
            'enabled': true,
            // additional image URLs may be saved to this file via wallpaper's 'fav' action
            'desc': '~/.desktop-eye-candy/favorites.json',
        },
        
        'localFS' : {
            'enabled' : true,            
            'desc' :  'List of local file system paths containing images',
            'feeds' : [
                // A list of 'read-only' locations containing image files
                // '~/.desktop-eye-candy/images' is automatically added to config.json post-installation

                // Additional absolute paths may be added here:
            ],
            
        },
        // The rss-handler will convert the XML response content to JSON and
        // extract any URL it finds in any element named in 'location'
        // that exists under the RSS 'item' for each channel in the response.

        // If 'searchLinks' is true, then the handler looks for <IMG> tags in
        // the HTML response of the RSS 'link' elements
        
        'rss' : {
            'enabled' : false,            
            'desc' : 'List of RSS feeds containing images',
            'feeds' : { 
                'nasa' : {
                    'urls' : [
                        'https://earthobservatory.nasa.gov/Feeds/rss/eo2.rss'                                               
                    ],
                    'location' : 'url',
                },
                // Astronomy Picture of the Day :)
                'apod' : {
                    'urls' : [
                        'https://apod.nasa.gov/apod.rss'
                    ],
                    'searchLinks' : 'true'
                },
                'smithsonian' : {
                    'urls' : [
                        'https://www.smithsonianmag.com/rss/photos/'
                    ],
                    'location' : 'url',
                    'searchLinks' : 'true'
                }
                
            }
            
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
