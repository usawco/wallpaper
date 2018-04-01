echo "Running wp.ps1 script"

echo "Image details: $1"

if ( [System.IO.File]::Exists( $imagePath)) {

    echo "Setting desktop using $imagePath"
    Set-ItemProperty -path "HKCU:\Control Panel\Desktop" -name 'wallpaper' -value 'c:\tmp\wallpaper.jpg'
    rundll32.exe user32.dll, UpdatePerUserSystemParameters
    echo "Execution successful? $?"
    echo "Error? $error"
} else {
    echo "Can't find $imagePath"
}
