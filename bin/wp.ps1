echo "Running ps script"

echo NODE_HOME: ${Env:NODE_HOME}
echo 'Executing wallpaper.ps1'
echo $(date)
echo 'Producing random list of images'
if ( ! [System.IO.File]::Exists("${Env:NODE_HOME}\node.exe")) {
    echo "Can't find ${Env:NODE_HOME}\node executable"
    exit 1
}

#$launchJS = "$Env:NODE_HOME\node_modules\desktop-eye-candy\lib\index.js"
$launchJS = "..\lib\index.js"

if ( ![System.IO.File]::Exists( $launchJS)) {
    echo "Can't find launch file. ${launchJS}"
    exit 1
}

start-process ${Env:NODE_HOME}\node.exe -ArgumentList $launchJS

$file = "C:\tmp\wallpaper.json"
if ( [System.IO.File]::Exists( $file)) {

    $json = (Get-Content $file | Out-String | ConvertFrom-Json)
    echo $json
    $imageLink = ${json}.link
    echo $imageLink
    #$imageLink = 'https://www.hdwallpapers.in/download/monsters_inc_hd-2560x1440.jpg'

    $client = new-object System.Net.WebClient
    $output = "c:\tmp\wallpaper.jpg"
    #$client.Downloadfile($imageLink, $output)
    Invoke-WebRequest -Uri $imageLink -OutFile $output

    Set-ItemProperty -path 'HKCU:\Control Panel\Desktop\' -name wallpaper -value $output
    rundll32.exe user32.dll, UpdatePerUserSystemParameters
} else {
    echo "Can't find $file"
}