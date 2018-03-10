#!/bin/bash

# Uncomment to dump to a log file
# exec > /tmp/wallpaper.log 2>&1
#set -x

echo NODE_HOME: $NODE_HOME
echo 'Executing wallpaper.sh'
echo $(date)
echo 'Producing random list of images'

if [ ! -f $NODE_HOME/bin/node ] 
then 
    echo "Can't find ${NODE_HOME}/bin/node executable"
    exit 1
fi
    
LAUNCH_JS=${NODE_HOME}/lib/node_modules/desktop-eye-candy/lib/index.js

if [ ! -f $LAUNCH_JS ]
then
    echo "Can't find launch JS script: ${LAUNCH_JS}.  Please install package globally."
    exit 1
fi
echo "Executing... NODE_DEBUG=$NODE_DEBUG ${NODE_HOME}/bin/node ${LAUNCH_JS}"
NODE_DEBUG=$NODE_DEBUG $NODE_HOME/bin/node ${LAUNCH_JS}
echo 'Downloading ' $imageLink
if [ -f /tmp/wallpaper.json ] 
then
    imageLink=$(cat /tmp/wallpaper.json | jq .link | tr -d '"');
    echo imageLink=${imageLink}
    provider=$(cat /tmp/wallpaper.json | jq .provider | tr -d '"');
    title=$(cat /tmp/wallpaper.json | jq .title | tr -d '"');    
    # give a browser user agent to work around pixabay.
    # The download is initiated by a me from the keyboard
    if [ -f ${imageLink} ]        
    then
        cp ${imageLink} /tmp/wallpaper.jpg
    else
        wget --header='User-Agent: Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.167 Safari/537.36' --no-http-keep-alive -d -O /tmp/wallpaper.jpg $imageLink
    fi
    # Use convert to inject provider details (Required by Pixabay's high resolution requirements)
    convert -background black -pointsize 16 -fill white -annotate +10+50 "[${provider}] ${title}" /tmp/wallpaper.jpg /tmp/convert.jpg
    #eog /tmp/convert.jpg
    echo 'Setting wallpaper'
    nitrogen --set-scaled --save /tmp/convert.jpg
fi

