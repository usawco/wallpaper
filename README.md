
![alt text](doc/images/sample-screenshot0.png "desktop-eye-candy")

A program for setting randomized background wallpapers in a Linux desktop.

Each time this program executes, it will select a random image from one of its configured providers to use as a desktop background. When launched from a keyboard shortcut, it provides a very simple yet effective method for changing your wallpaper. 

The following providers are supported:

* Google custom search
* Bing image search
* Pixabay image search
* Flickr
* Local json file of 'favorites' (See /installPath/favorites/items.json)

# Revision history
| when          | what   |
| ------------- | :------|
| 1.3.11  | An existing configuration is no longer overwritten. config.json moves to ~/.desktop-eye-candy/config.json | 
| 1.2.3  | A 'favorites' provider introduced, source code cleanup (eslint) |
| 1.1.3  | Update README for 17.10 support |
| 1.1.1  | Support global module installation |
| 1.0.7  | Initial release |
 
# Coming soon
* API to save current wallpaper to favorites provider
* detect resolution at install-time
* flickr hi-res api

# Installation

## When updating an existing pre-1.3.8 installation for the first time. 

( i.e. npm -g update desktop-eye-candy)

The existing configuration elements are no longer overwritten. Each time an update is applied, any new elements introduced into the source template lib/config.js file are added to your configuration (~/desktop-eye-candy/config.json) . Elements are never deleted or overwritten.

Copy your existing config.json file to ~/desktop-eye-candy/config.json before running npm -g update desktop-eye-candy. This manual step is only required one time since future updates will look for the configuration file in its new location.


## Download from npm Registry
Perform a  global install, so 'wallpaper' is installed into your $NODE_HOME/bin directory.
```
npm install -g desktop-eye-candy
```
## Create API keys
Most of the supported providers ( [Bing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/search-api/web/), [Google Custom Search](https://developers.google.com/custom-search/json-api/v1/introduction#identify_your_application_to_google_with_api_key), and [Pixabay](https://pixabay.com/api/docs/) ) require an authorized API key. Moreover, for Pixabay, one must send an email requesting access to high-resolution images as discussed in their API docs. The Flickr provider requires no API key; however, it is disabled by default.

## Configure
Configure one of the supported providers by editing 'lib/config.json'. Minimally, you will want to install API keys and search terms.

## Invoke Shell Script
Run the globally installed 'wallpaper' script to randomly select a desktop image from one of the configured providers.

# Testing Details
The following platforms have been tested thus far.

| OS            | Notes  |
| ------------- | :------|
| Ubuntu 14.04  | None   |
| Ubuntu 16.04  | After installation and configuration, logout and log back in if using keyboard shortcut. Convert-injected text is not rendered when nitrogen sets desktop.|
| Ubuntu 17.10  | None   |


## Dependencies
Ensure the following dependencies are installed:
```
$ sudo apt-get install jq imagemagick nitrogen wget
```
* jq - JSON parser
* image-magic - Using 'convert' to inject text into image
* nitrogen - set the desktop background to the downloaded image
* wget - download image URL

## Node.js
* Install Node.js
* Export a NODE_HOME variable
```
export NODE_HOME=/path/to/Node.js
```
Note: The simplest approach is to add NODE_HOME to /etc/environment.

e.g. 
/etc/environment
```
NODE_HOME=/home/user/dev/node-v9.7.1-linux-x64
PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games"
user@zfs-VirtualBox:~/dev/git/usawco$ 

```

# Usage Notes
The same three files are created in the /tmp directory each time the shell script (wallpaper.sh) is run.

```
$ ls -l /tmp/wallpaper* /tmp/convert*
-rw-rw-r-- 1 user user 605612 Mar  5 09:05 /tmp/convert.jpg
-rw-rw-r-- 1 user user 557659 Mar  4  2015 /tmp/wallpaper.jpg
-rw-rw-r-- 1 user user    185 Mar  5 09:05 /tmp/wallpaper.json
$ 
```
## Configuration
Modify the lib/config.json file
* Insert your own API keys for [Bing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/search-api/web/), [Google Custom Search](https://developers.google.com/custom-search/json-api/v1/introduction#identify_your_application_to_google_with_api_key), or [Pixabay](https://pixabay.com/api/docs/)
* Modify the search terms for each provider. (There is no GUI config at this time.)
* The Flickr provider is disabled as their API doesn't seem to support hi-resolution image queries.


# Troubleshooting

## Shell script trace
Uncomment these lines at the top of wallpaper.sh to produce a shell script log
```
#!/bin/bash

# Uncomment to dump to a log file
#exec > /tmp/wallpaper.log 2>&1
#set -x

echo NODE_HOME: $NODE_HOME
echo 'Executing wallpaper.sh'
```

## Node JS logging
Node.js trace logging is available via NODE_DEBUG env variable.
```
$ cd ~/dev/git/usawco/wallpaper
$ NODE_DEBUG=wallpaper,http ./wallpaper.sh
 09:05:08 up 17:12,  4 users,  load average: 0.18, 0.28, 0.45
Done
NODE_HOME: /home/user/dev/tools/nodejs/node-v8.9.4-linux-x64
Executing wallpaper.sh
Mon Mar 5 09:05:08 EST 2018
removing old image
Getting list of images
WALLPAPER 10490: Loading Google config
WALLPAPER 10490: {"providers":{"google":{"enabled":true,Cache-Control: max-age=2592000
.
.
.
Expires: Wed, 04 Apr 2018 14:05:08 GMT
Connection: close
Content-Type: image/jpeg

---response end---
200 OK
Length: 557659 (545K) [image/jpeg]
Saving to: ‘/tmp/wallpaper.jpg’

100%[==================================================================================================>] 557,659      984KB/s   in 0.6s   

Closed fd 4
2018-03-05 09:05:10 (984 KB/s) - ‘/tmp/wallpaper.jpg’ saved [557659/557659]

Setting wallpaper
$ 
```

# Keyboard Shortcut
Add this program to a keyboard shortcut for maximum ease of use. I suggest using gnome-terminal for the terminal popup, so you can monitor its progress since some images may take a few seconds to download.
![alt text](doc/images/sample-screenshot1.png "gnome-terminal")

e.g. I've created a bash profile called 'login' in the example below that sets the custom green foreground color.
```
 $ gnome-terminal --window-with-profile=login -e /yourPathToNodeHome/bin/wallpaper
```
Tip: Make sure NODE_HOME environment variable is defined.
![alt text](doc/images/sample-screenshot2.png "keyboard shortcut")


# dev notes
## Adding another handler
wallpaper.js acts as a controller for a set of handlers (e.g. bing, pixabay, google custom search, flickr).

### Step 1: create a new handler
Use one of the existing handlers as a guide. Be sure to export an 'exec' function in the new handler's module that returns a Promise.

### Step 2: add handler to wallpaper.js
Add the handler to the list of promises defined in wallpaper.js. 
```js
    var entry = null;
    let promises = [                 
        bing.createFeed(),    
        googs.createFeed(),
        pixabay.createFeed(),           
        flicker.createFeed(),            
        // new handler goes here...
    ];
```
### Step 3: add configuration details to config.json
Your config elements may be different for your handler.
For example, here is the bing entry.  You would add a new entry with for your handler.  In this example, I'm returning images with the 'nature' search term. (See config.js for more details.)
```js
        "bing" : {
            "enabled" : true,
            "key" : "xxxxxxxxxxx",            
            "terms" : [ "nature" ],
            "width" : 1920,
            "height" : 1080
    
        },
```

# TODO
1. unit tests with mocking support
2. jsdoc
3. consider a GUI config
4. Pop a 'tile preview' panel containing a subset of the random entries. User clicks on a tile to select it. 
