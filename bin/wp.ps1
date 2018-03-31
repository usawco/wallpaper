echo "Running ps script"

echo $1

$jsonPath = "C:\tmp\wallpaper.json"
$imagePath = "C:\tmp\wallpaper.jpg"

if ( [System.IO.File]::Exists( $imagePath)) {

    echo "Setting desktop now for $1"
    Set-ItemProperty -path 'HKCU:\Control Panel\Desktop\' -name wallpaper -value $imagePath
    rundll32.exe user32.dll, UpdatePerUserSystemParameters
    echo "Return code: ${Env.%ERRORLEVEL%}"
} else {
    echo "Can't find $imagePath"
}
