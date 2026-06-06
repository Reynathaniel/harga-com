Set oShell = CreateObject("WScript.Shell")
Set oFSO = CreateObject("Scripting.FileSystemObject")

Dim logFile
logFile = "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\git_result.txt"

Dim projectDir
projectDir = "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app"

' Write initial log
Dim oFile
Set oFile = oFSO.CreateTextFile(logFile, True)
oFile.WriteLine "=== VBS GIT PUSH ==="
oFile.WriteLine "Time: " & Now()

' Run where git to find it
Dim oExec
Set oExec = oShell.Exec("cmd.exe /c where git 2>&1")
Dim gitLocation
gitLocation = ""
Do While Not oExec.StdOut.AtEndOfStream
    Dim line
    line = oExec.StdOut.ReadLine()
    If gitLocation = "" And InStr(line, "git") > 0 Then
        gitLocation = Trim(line)
    End If
    oFile.WriteLine "where git: " & line
Loop
oFile.WriteLine "Git found: " & gitLocation

' Try GitHub Desktop git if not found
If gitLocation = "" Then
    Dim ghDesktopGit
    ghDesktopGit = "C:\Users\ASUS\AppData\Local\GitHubDesktop\app-3.4.14\resources\app\git\cmd\git.exe"
    If oFSO.FileExists(ghDesktopGit) Then
        gitLocation = ghDesktopGit
        oFile.WriteLine "Using GitHub Desktop git: " & gitLocation
    End If
End If

If gitLocation = "" Then
    ' Search for git.exe
    oFile.WriteLine "Searching for git.exe..."
    Set oExec2 = oShell.Exec("cmd.exe /c dir /s /b C:\Users\ASUS\AppData\Local\GitHubDesktop\*.exe 2>&1 | findstr git.exe")
    Do While Not oExec2.StdOut.AtEndOfStream
        Dim found
        found = Trim(oExec2.StdOut.ReadLine())
        If InStr(LCase(found), "git.exe") > 0 And gitLocation = "" Then
            gitLocation = found
        End If
        oFile.WriteLine "Found: " & found
    Loop
End If

oFile.WriteLine "Final git path: " & gitLocation

If gitLocation = "" Then
    oFile.WriteLine "ERROR: git not found anywhere!"
    oFile.Close
    MsgBox "Git not found! Check git_result.txt"
    WScript.Quit 1
End If

' Run git commands
Dim cmd
cmd = "cmd.exe /c cd /d """ & projectDir & """ && """ & gitLocation & """ add . && """ & gitLocation & """ commit -m ""feat: referral and checkout system"" && """ & gitLocation & """ push origin main >> """ & logFile & """ 2>&1"

oFile.WriteLine "Running: " & cmd
oFile.Close

oShell.Run cmd, 0, True

' Append done marker
Set oFile = oFSO.OpenTextFile(logFile, 8, True)
oFile.WriteLine ""
oFile.WriteLine "=== VBS DONE ==="
oFile.Close

MsgBox "Done! Push completed. Check git_result.txt for details."
