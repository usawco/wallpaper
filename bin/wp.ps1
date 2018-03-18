echo "Running ps script"

$jsonPath = "C:\tmp\wallpaper.json"
$imagePath = "C:\tmp\wallpaper.jpg"

echo NODE_HOME: ${Env:NODE_HOME}
echo 'Executing wallpaper.ps1'
echo $(date)
echo 'Producing random list of images'
if ( ! [System.IO.File]::Exists("${Env:NODE_HOME}\node.exe")) {
    echo "Can't find ${Env:NODE_HOME}\node executable"
    exit 1
}

$launchJS = "$PSScriptRoot\..\lib\index.js"

if ( ![System.IO.File]::Exists( $launchJS)) {
    echo "Can't find launch file. ${launchJS}"
    exit 1
}

# Don't -Wait as this will prevent the desktop background from being refreshed with the new image
start-process ${Env:NODE_HOME}\node.exe -ArgumentList $launchJS
Start-Sleep -s 5
if ( [System.IO.File]::Exists( $jsonPath)) {

    $json = (Get-Content $jsonPath | Out-String | ConvertFrom-Json)
    echo $json
    $imageLink = ${json}.link
    echo $imageLink
    #$imageLink = 'https://www.hdwallpapers.in/download/monsters_inc_hd-2560x1440.jpg'


    #if ( ![System.IO.File]::Exists( $imagePath)) {
    #    echo "######## Downloading file from powershell!"
    #    Invoke-WebRequest -Uri $imageLink -OutFile $imagePath
    #    # Wait a few seconds for the download to complete
    #    Start-Sleep -s 3
    #}
    echo "Setting desktop now..."
    Set-ItemProperty -path 'HKCU:\Control Panel\Desktop\' -name wallpaper -value $imagePath
    rundll32.exe user32.dll, UpdatePerUserSystemParameters
    echo "Return code: ${Env%ERRORLEVEL%}"
} else {
    echo "Can't find $jsonPath"
}