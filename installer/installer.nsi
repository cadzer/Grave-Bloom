; Grave Bloom Installer
; Uses NSIS

!include "MUI2.nsh"
!include "FileFunc.nsh"

Name "Grave Bloom"
OutFile "..\build\GraveBloom-Setup.exe"
InstallDir "$LOCALAPPDATA\Grave Bloom"
InstallDirRegKey HKCU "Software\GraveBloom" "InstallDir"
RequestExecutionLevel user

!define MUI_ABORTWARNING

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Section "Install"
    SetOutPath "$INSTDIR"

    ; NW.js runtime + game files (from build/GraveBloom/)
    File /r "dist\*.*"

    WriteRegStr HKCU "Software\GraveBloom" "InstallDir" "$INSTDIR"

    WriteUninstaller "$INSTDIR\Uninstall.exe"

    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\GraveBloom" \
        "DisplayName" "Grave Bloom"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\GraveBloom" \
        "UninstallString" "$\"$INSTDIR\Uninstall.exe$\""
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\GraveBloom" \
        "InstallLocation" "$INSTDIR"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\GraveBloom" \
        "Publisher" "cadzer"

    ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
    IntFmt $0 "0x%08X" $0
    WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\GraveBloom" \
        "EstimatedSize" "$0"

    CreateShortcut "$DESKTOP\Grave Bloom.lnk" "$INSTDIR\GraveBloom.exe"
    CreateDirectory "$SMPROGRAMS\Grave Bloom"
    CreateShortcut "$SMPROGRAMS\Grave Bloom\Grave Bloom.lnk" "$INSTDIR\GraveBloom.exe"
    CreateShortcut "$SMPROGRAMS\Grave Bloom\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
SectionEnd

Section "Uninstall"
    RMDir /r "$INSTDIR"
    Delete "$DESKTOP\Grave Bloom.lnk"
    RMDir /r "$SMPROGRAMS\Grave Bloom"
    DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\GraveBloom"
    DeleteRegKey HKCU "Software\GraveBloom"
SectionEnd
