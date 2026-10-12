#Requires AutoHotkey v2.0
#SingleInstance Force
InstallKeybdHook()
InstallMouseHook()
SetKeyDelay 20, 20
SetMouseDelay 20
LogScriptEvent("started pid=" DllCall("GetCurrentProcessId", "UInt"))
OnExit(LogScriptExit)
OnError(LogScriptError)

LogScriptEvent(message) {
    try FileAppend(FormatTime(, "yyyy-MM-dd HH:mm:ss") " " message "`n", A_Temp "\ChromeOpenInFirefox.log")
}

LogScriptExit(reason, exitCode) {
    LogScriptEvent("exit reason=" reason " code=" exitCode)
}

LogScriptError(error, mode) {
    LogScriptEvent("error mode=" mode " message=" error.Message)
    return 0
}

#HotIf WinActive("ahk_exe chrome.exe") && GetKeyState("Ctrl", "P") && GetKeyState("Alt", "P")
*LButton::{
    FileAppend FormatTime(, "yyyy-MM-dd HH:mm:ss") " mapping triggered`n", A_Temp "\ChromeOpenInFirefox.log"
    SendEvent "{Blind}{LAlt up}{RAlt up}{LCtrl down}{LShift down}"
    Sleep 40
    SendEvent "{Blind}{LButton down}"
    KeyWait "LButton"
    SendEvent "{Blind}{LButton up}"
    Sleep 100
    if !GetKeyState("LShift", "P")
        SendEvent "{Blind}{LShift up}"
    if !GetKeyState("LCtrl", "P")
        SendEvent "{Blind}{LCtrl up}"
    if GetKeyState("LAlt", "P")
        SendEvent "{Blind}{LAlt down}"
    if GetKeyState("RAlt", "P")
        SendEvent "{Blind}{RAlt down}"
}

$*Left::NavigateTabHistory("Left")
$*Right::NavigateTabHistory("Right")
#HotIf

NavigateTabHistory(direction) {
    FileAppend FormatTime(, "yyyy-MM-dd HH:mm:ss") " tab " direction " triggered`n", A_Temp "\ChromeOpenInFirefox.log"
    SendEvent "{Blind}{LAlt up}{RAlt up}{LCtrl down}"
    Sleep 40
    SendEvent "{Blind}{" direction "}"
    if !GetKeyState("LCtrl", "P")
        SendEvent "{Blind}{LCtrl up}"
    if GetKeyState("LAlt", "P")
        SendEvent "{Blind}{LAlt down}"
    if GetKeyState("RAlt", "P")
        SendEvent "{Blind}{RAlt down}"
    KeyWait direction
}
