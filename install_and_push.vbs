Set oShell = CreateObject("WScript.Shell")
Set oFSO = CreateObject("Scripting.FileSystemObject")

Dim logFile : logFile = "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\install_push.txt"
If oFSO.FileExists(logFile) Then oFSO.DeleteFile logFile

Set oFile = oFSO.CreateTextFile(logFile, True)
oFile.WriteLine "=== INSTALL AND PUSH ==="
oFile.Close

Dim projectDir : projectDir = "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app"

' Step 1: Install git via winget
Dim cmd1
cmd1 = "cmd.exe /c winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements 2>&1 >> """ & logFile & """"
oShell.Run cmd1, 0, True

' Step 2: Wait for git to be available
oShell.Run "cmd.exe /c timeout /t 5", 0, True

' Step 3: Push with newly installed git
Dim cmd2
cmd2 = "cmd.exe /c set ""PATH=C:\Program Files\Git\cmd;%PATH%"" && cd /d """ & projectDir & """ && git add -A && git commit -m ""feat: referral and checkout system"" && git push origin main 2>&1 >> """ & logFile & """"
oShell.Run cmd2, 0, True

Set oFile = oFSO.OpenTextFile(logFile, 8)
oFile.WriteLine "=== ALL DONE ==="
oFile.Close

MsgBox "Done! Check install_push.txt"
