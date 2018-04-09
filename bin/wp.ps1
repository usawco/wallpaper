echo "Running wp.ps1 script: $args"

$imagePath=$args[0]
echo "Setting desktop with imagePath: $imagePath"

#  https://msdn.microsoft.com/en-us/library/windows/desktop/ms724947(v=vs.85).aspx
$SetWallpaperAction = 0x14
$updateIni = 0x01
$broadcast = 0x02

if ( ![System.IO.File]::Exists( $imagePath)) {
    echo "Can't find $imagePath"
    return
}

    echo "Setting desktop using $imagePath"
#   Note: old method was to set the registry and use this undocumented method. ( Retired...)
#    Set-ItemProperty -path "HKCU:\Control Panel\Desktop" -name 'wallpaper' -value $imagePath
#    rundll32.exe user32.dll, UpdatePerUserSystemParameters


$signature = @'
    [DllImport("user32.dll", EntryPoint = "SystemParametersInfo")]
    public static extern bool SystemParametersInfo(
      uint uiAction,
      uint uiParam,
      String pvParam,
      uint fWinIni
    );
'@

$flags = ( $updateIni -bor $broadcast );


$SetWallpaper = Add-Type -MemberDefinition $signature -Name WinAPICall -Namespace SystemParamInfo -PassThru
$retValue = $SetWallpaper::SystemParametersInfo([uint32]$SetWallpaperAction, [uint32]$imagePath.length, $imagePath, [uint32]$flags)

echo "Execution successful? $retValue"
echo "Error? $error"
