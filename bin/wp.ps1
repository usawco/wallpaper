echo "Running wp.ps1 script"

$imagePath='c:\tmp\wallpaper.jpg'

if ( [System.IO.File]::Exists( $imagePath)) {

    echo "Setting desktop using $imagePath"
    Set-ItemProperty -path "HKCU:\Control Panel\Desktop" -name 'wallpaper' -value $imagePath
    rundll32.exe user32.dll, UpdatePerUserSystemParameters
    echo "Execution successful? $?"
    echo "Error? $error"
} else {
    echo "Can't find $imagePath"
}
