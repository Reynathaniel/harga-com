Set oShell = CreateObject("WScript.Shell")
Set oFSO = CreateObject("Scripting.FileSystemObject")

Dim logFile : logFile = "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\ghd_find.txt"
If oFSO.FileExists(logFile) Then oFSO.DeleteFile logFile

Set oFile = oFSO.CreateTextFile(logFile, True)

' Check registry for GitHub Desktop
Dim oReg
Set oReg = CreateObject("WScript.Shell")

' List GitHub Desktop related dirs
Dim oExec

' Check AppData Local
Set oExec = oShell.Exec("cmd.exe /c dir C:\Users\ASUS\AppData\Local\ /b 2>&1 | findstr /i github")
oFile.WriteLine "=== AppData Local github dirs ==="
Do While Not oExec.StdOut.AtEndOfStream
    oFile.WriteLine oExec.StdOut.ReadLine()
Loop

' Search for GitHubDesktop.exe
Set oExec = oShell.Exec("cmd.exe /c dir C:\Users\ASUS\AppData\Local\ /s /b 2>&1 | findstr /i ""GitHubDesktop.exe"" 2>nul")
oFile.WriteLine "=== GitHubDesktop.exe locations ==="
Do While Not oExec.StdOut.AtEndOfStream
    oFile.WriteLine oExec.StdOut.ReadLine()
Loop

' Search for git.exe in all drives
Set oExec = oShell.Exec("cmd.exe /c for %d in (C D) do @dir /s /b %d:\git.exe 2>nul | findstr /v node_modules")
oFile.WriteLine "=== git.exe all drives (first 20) ==="
Dim count : count = 0
Do While Not oExec.StdOut.AtEndOfStream And count < 20
    oFile.WriteLine oExec.StdOut.ReadLine()
    count = count + 1
Loop

oFile.WriteLine "=== DONE ==="
oFile.Close

MsgBox "Done! Check ghd_find.txt"
