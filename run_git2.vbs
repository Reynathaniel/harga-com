Set oShell = CreateObject("WScript.Shell")
Set oFSO = CreateObject("Scripting.FileSystemObject")

Dim logFile
logFile = "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\git_out2.txt"

Dim projectDir
projectDir = "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app"

' Delete old file if exists to bypass cache
If oFSO.FileExists(logFile) Then oFSO.DeleteFile logFile

' Write initial log
Dim oFile
Set oFile = oFSO.CreateTextFile(logFile, True)
oFile.WriteLine "START"
oFile.Close

' Find git via where command
Dim gitCmd
Dim oExec
Set oExec = oShell.Exec("cmd.exe /c where git")
gitCmd = ""
Do While Not oExec.StdOut.AtEndOfStream
    Dim ln : ln = Trim(oExec.StdOut.ReadLine())
    If ln <> "" And gitCmd = "" Then gitCmd = ln
Loop

' Try known paths if where fails
If gitCmd = "" Then
    Dim paths(5)
    paths(0) = "C:\Program Files\Git\cmd\git.exe"
    paths(1) = "C:\Program Files\Git\bin\git.exe"
    paths(2) = "C:\Users\ASUS\AppData\Local\Programs\Git\cmd\git.exe"
    Dim i
    For i = 0 To 2
        If oFSO.FileExists(paths(i)) Then
            gitCmd = paths(i)
            Exit For
        End If
    Next
End If

' Search GitHub Desktop
If gitCmd = "" Then
    Dim ghBase : ghBase = "C:\Users\ASUS\AppData\Local\GitHubDesktop"
    If oFSO.FolderExists(ghBase) Then
        Set oExec2 = oShell.Exec("cmd.exe /c dir /s /b """ & ghBase & "\git.exe"" 2>nul")
        Do While Not oExec2.StdOut.AtEndOfStream
            Dim f : f = Trim(oExec2.StdOut.ReadLine())
            If f <> "" And gitCmd = "" Then gitCmd = f
        Loop
    End If
End If

' Write git path found
Set oFile = oFSO.OpenTextFile(logFile, 8)
oFile.WriteLine "GIT=" & gitCmd
oFile.Close

If gitCmd = "" Then
    MsgBox "git not found!"
    WScript.Quit 1
End If

' Execute all git commands and append to log
Dim runCmd
runCmd = "cmd.exe /c cd /d """ & projectDir & """ && """ & gitCmd & """ add -A 2>&1 >> """ & logFile & """ && """ & gitCmd & """ commit -m ""feat: referral and checkout system"" 2>&1 >> """ & logFile & """ && """ & gitCmd & """ push origin main 2>&1 >> """ & logFile & """"
oShell.Run runCmd, 0, True

' Append done
Set oFile = oFSO.OpenTextFile(logFile, 8)
oFile.WriteLine "DONE"
oFile.Close

MsgBox "Complete! See git_out2.txt"
