Set oShell = CreateObject("WScript.Shell")
Set oFSO = CreateObject("Scripting.FileSystemObject")

Dim logFile : logFile = "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\final_push.txt"
If oFSO.FileExists(logFile) Then oFSO.DeleteFile logFile

Set oFile = oFSO.CreateTextFile(logFile, True)
oFile.WriteLine "FINAL PUSH - " & Now()
oFile.Close

Dim projectDir : projectDir = "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app"
Dim gitPaths(3)
gitPaths(0) = "C:\Program Files\Git\cmd\git.exe"
gitPaths(1) = "C:\Program Files\Git\bin\git.exe"
gitPaths(2) = "C:\Program Files (x86)\Git\cmd\git.exe"
gitPaths(3) = "C:\Users\ASUS\AppData\Local\Programs\Git\cmd\git.exe"

Dim gitExe : gitExe = ""
Dim i
For i = 0 To 3
    If oFSO.FileExists(gitPaths(i)) Then
        gitExe = gitPaths(i)
        Exit For
    End If
Next

Set oFile = oFSO.OpenTextFile(logFile, 8)
oFile.WriteLine "Git found: " & gitExe
oFile.Close

If gitExe = "" Then
    ' Try winget now (visible window so we can see errors)
    oShell.Run "cmd.exe /c winget install --id Git.Git -e --accept-package-agreements --accept-source-agreements", 1, True
    ' Check again after install
    If oFSO.FileExists("C:\Program Files\Git\cmd\git.exe") Then
        gitExe = "C:\Program Files\Git\cmd\git.exe"
    End If
End If

Set oFile = oFSO.OpenTextFile(logFile, 8)
If gitExe = "" Then
    oFile.WriteLine "ERROR: git still not found after winget"
    oFile.Close
    MsgBox "Git not found! Install manually from git-scm.com"
    WScript.Quit 1
End If

oFile.WriteLine "Using git: " & gitExe
oFile.Close

' Re-init git and push
Dim cmd
cmd = "cmd.exe /c cd /d """ & projectDir & """ && """ & gitExe & """ init && """ & gitExe & """ remote add origin https://github.com/Reynathaniel/harga-com.git 2>nul && """ & gitExe & """ add -A && """ & gitExe & """ commit -m ""feat: referral and checkout system"" && """ & gitExe & """ push -u origin main --force 2>&1 >> """ & logFile & """"
oShell.Run cmd, 1, True

Set oFile = oFSO.OpenTextFile(logFile, 8)
oFile.WriteLine "PUSH DONE"
oFile.Close

MsgBox "Complete! Check final_push.txt"
