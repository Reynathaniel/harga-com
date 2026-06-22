Set oShell = CreateObject("WScript.Shell")
Set oFSO = CreateObject("Scripting.FileSystemObject")

Dim logFile : logFile = "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\push_final.txt"
If oFSO.FileExists(logFile) Then oFSO.DeleteFile logFile

Dim projectDir : projectDir = "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app"

' Set PATH to include GitHub Desktop bin
oShell.Environment("Process")("PATH") = "C:\Users\ASUS\AppData\Local\GitHubDesktop\bin;" & oShell.Environment("Process")("PATH")

' Write log
Set oFile = oFSO.CreateTextFile(logFile, True)
oFile.WriteLine "PUSH_FINAL START"

' Check what's in GitHubDesktop bin
Dim oDir
Set oDir = oShell.Exec("cmd.exe /c dir C:\Users\ASUS\AppData\Local\GitHubDesktop\bin 2>&1")
oFile.WriteLine "=== GitHubDesktop\bin contents ==="
Do While Not oDir.StdOut.AtEndOfStream
    oFile.WriteLine oDir.StdOut.ReadLine()
Loop
oFile.Close

' Run git commands via cmd with PATH set
Dim gitCmd
gitCmd = "cmd.exe /c set PATH=C:\Users\ASUS\AppData\Local\GitHubDesktop\bin;%PATH% && cd /d """ & projectDir & """ && git add -A && git commit -m ""feat: referral and checkout system"" && git push origin main >> """ & logFile & """ 2>&1"

oShell.Run gitCmd, 0, True

' Append done
Set oFile = oFSO.OpenTextFile(logFile, 8)
oFile.WriteLine "=== FINAL DONE ==="
oFile.Close

MsgBox "Done! Check push_final.txt"
