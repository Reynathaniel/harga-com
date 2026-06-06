Set oShell = CreateObject("WScript.Shell")
Set oFSO = CreateObject("Scripting.FileSystemObject")

Dim logFile : logFile = "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\git_find3.txt"
If oFSO.FileExists(logFile) Then oFSO.DeleteFile logFile

Set oFile = oFSO.CreateTextFile(logFile, True)
oFile.WriteLine "Searching for git.exe..."

' Search common locations
Dim searchPaths(8)
searchPaths(0) = "C:\Users\ASUS\AppData\Local\GitHubDesktop"
searchPaths(1) = "C:\Users\ASUS\AppData\Local\Programs"
searchPaths(2) = "C:\Program Files"
searchPaths(3) = "C:\Program Files (x86)"
searchPaths(4) = "C:\Users\ASUS\scoop"
searchPaths(5) = "C:\ProgramData\scoop"
searchPaths(6) = "C:\tools"
searchPaths(7) = "C:\Users\ASUS\AppData\Roaming"
searchPaths(8) = "D:\tools"

Dim i
For i = 0 To 8
    If oFSO.FolderExists(searchPaths(i)) Then
        Dim oExec
        Set oExec = oShell.Exec("cmd.exe /c dir /s /b """ & searchPaths(i) & "\git.exe"" 2>nul")
        oFile.WriteLine "=== " & searchPaths(i) & " ==="
        Do While Not oExec.StdOut.AtEndOfStream
            oFile.WriteLine oExec.StdOut.ReadLine()
        Loop
    Else
        oFile.WriteLine "Not found: " & searchPaths(i)
    End If
Next

' Also check PATH env variable
oFile.WriteLine "=== PATH ==="
Dim oExecPath
Set oExecPath = oShell.Exec("cmd.exe /c echo %PATH%")
oFile.WriteLine oExecPath.StdOut.ReadLine()

oFile.WriteLine "=== DONE ==="
oFile.Close

MsgBox "Search complete! See git_find3.txt"
