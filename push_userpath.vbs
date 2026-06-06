Set oShell = CreateObject("WScript.Shell")
Set oFSO = CreateObject("Scripting.FileSystemObject")
Set oReg = GetObject("winmgmts:\\.\root\default:StdRegProv")

Dim logFile : logFile = "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\userpath_push.txt"
If oFSO.FileExists(logFile) Then oFSO.DeleteFile logFile

Set oFile = oFSO.CreateTextFile(logFile, True)
oFile.WriteLine "=== USER PATH PUSH ==="

' Read user PATH from registry
Const HKCU = &H80000001
Dim userPath
oReg.GetExpandedStringValue HKCU, "Environment", "PATH", userPath
oFile.WriteLine "UserPATH: " & Left(userPath, 200)

' Combine with system PATH
Dim fullPath
fullPath = userPath & ";" & oShell.Environment("System")("PATH")
oShell.Environment("Process")("PATH") = fullPath

' Now try where git and node
Dim oExec
Set oExec = oShell.Exec("cmd.exe /c set PATH=" & fullPath & " && where git && where node 2>&1")
oFile.WriteLine "=== where git/node with user PATH ==="
Dim gitPath : gitPath = ""
Dim nodePath : nodePath = ""
Do While Not oExec.StdOut.AtEndOfStream
    Dim ln : ln = Trim(oExec.StdOut.ReadLine())
    oFile.WriteLine ln
    If InStr(LCase(ln), "git.exe") > 0 Or InStr(LCase(ln), "git.cmd") > 0 Then
        If gitPath = "" Then gitPath = ln
    End If
    If InStr(LCase(ln), "node.exe") > 0 Then
        If nodePath = "" Then nodePath = ln
    End If
Loop
oFile.WriteLine "Git: " & gitPath
oFile.WriteLine "Node: " & nodePath
oFile.Close

' Run git push with full user PATH
Dim projectDir : projectDir = "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app"
Dim cmd
cmd = "cmd.exe /c set ""PATH=" & fullPath & """ && cd /d """ & projectDir & """ && git add -A && git commit -m ""feat: referral and checkout system"" && git push origin main >> """ & logFile & """ 2>&1"
oShell.Run cmd, 0, True

Set oFile = oFSO.OpenTextFile(logFile, 8)
oFile.WriteLine "=== DONE ==="
oFile.Close

MsgBox "Complete! Check userpath_push.txt"
