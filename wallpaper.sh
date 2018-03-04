#!/bin/bash
rm /tmp/wallpaper.txt
echo NODE_HOME: $NODE_HOME
echo 'Executing wallpaper.sh'
echo $(date)
echo 'removing old image'
echo 'Getting list of images'

#NODE_DEBUG=$NODE_DEBUG /home/user/dev/tools/nodejs/node-v8.9.4-linux-x64/bin/node /home/user/dev/git/wallpaper/lib/wallpaper.js
NODE_DEBUG=$NODE_DEBUG /home/user/dev/tools/nodejs/node-v8.9.4-linux-x64/bin/node /home/user/dev/git/wallpaper/lib/index.js
echo 'Downloading ' $imageLink
if [ -f /tmp/wallpaper.json ] 
then
    imageLink=$(cat /tmp/wallpaper.json | jq .link | tr -d '"');
    echo imageLink=${imageLink}
    provider=$(cat /tmp/wallpaper.json | jq .provider | tr -d '"');
    title=$(cat /tmp/wallpaper.json | jq .title | tr -d '"');    
    # give a browser user agent to work around pixabay. I am still in agreement with their terms
    # The download is initiated by a me from the keyboard
    wget --header='User-Agent: Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.167 Safari/537.36' --no-http-keep-alive -d -O /tmp/wallpaper.jpg $imageLink
    #convert -background black -pointsize 16 -fill white -annotate +20+20 "[${provider}] ${title}" /tmp/wallpaper.jpg /tmp/image.jpg
    convert -background black -pointsize 16 -fill white -annotate +20+20 "[${provider}] ${title}" /tmp/wallpaper.jpg /tmp/convert.jpg
    #eog /tmp/convert.jpg
    echo 'Setting wallpaper'
    nitrogen --set-scaled --save /tmp/convert.jpg
fi

