Set oShell = CreateObject("WScript.Shell")
Set oFSO = CreateObject("Scripting.FileSystemObject")

Dim logFile : logFile = "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\ghd_result.txt"
If oFSO.FileExists(logFile) Then oFSO.DeleteFile logFile

Set oFile = oFSO.CreateTextFile(logFile, True)

' Find GitHub Desktop exe
Dim oExec
Set oExec = oShell.Exec("cmd.exe /c dir ""C:\Users\ASUS\AppData\Local\GitHubDesktop\"" /b 2>&1")
oFile.WriteLine "=== GitHubDesktop contents ==="
Dim appDir : appDir = ""
Do While Not oExec.StdOut.AtEndOfStream
    Dim ln : ln = Trim(oExec.StdOut.ReadLine())
    oFile.WriteLine ln
    If Left(ln, 4) = "app-" Then appDir = ln
Loop

oFile.WriteLine "Latest app dir: " & appDir

' Find git inside GitHub Desktop
Dim gitExe
gitExe = "C:\Users\ASUS\AppData\Local\GitHubDesktop\" & appDir & "\resources\app\git\cmd\git.exe"
oFile.WriteLine "Trying git at: " & gitExe

If oFSO.FileExists(gitExe) Then
    oFile.WriteLine "GIT FOUND!"
    ' Run git push
    Dim projectDir : projectDir = "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app"
    Dim cmd
    cmd = "cmd.exe /c cd /d """ & projectDir & """ && """ & gitExe & """ add -A && """ & gitExe & """ commit -m ""feat: referral and checkout system"" && """ & gitExe & """ push origin main >> """ & logFile & """ 2>&1"
    oShell.Run cmd, 0, True
    oFile.WriteLine "PUSH DONE"
Else
    oFile.WriteLine "Git not at expected path. Trying broader search..."
    Set oExec2 = oShell.Exec("cmd.exe /c dir /s /b ""C:\Users\ASUS\AppData\Local\GitHubDesktop\*.exe"" 2>&1 | findstr git.exe")
    Do While Not oExec2.StdOut.AtEndOfStream
        Dim f : f = Trim(oExec2.StdOut.ReadLine())
        If InStr(LCase(f), "git.exe") > 0 And gitExe = "" Then
            gitExe = f
        End If
        oFile.WriteLine "Found: " & f
    Loop
End If

Set oFile = oFSO.OpenTextFile(logFile, 8)
oFile.WriteLine "=== END ==="
oFile.Close

MsgBox "Done! Check ghd_result.txt"
