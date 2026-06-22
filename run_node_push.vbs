Set oShell = CreateObject("WScript.Shell")
Set oFSO = CreateObject("Scripting.FileSystemObject")

Dim logFile : logFile = "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\node_push.txt"
If oFSO.FileExists(logFile) Then oFSO.DeleteFile logFile

' Find node.exe
Dim nodePaths(4)
nodePaths(0) = "C:\Program Files\nodejs\node.exe"
nodePaths(1) = "C:\Users\ASUS\AppData\Roaming\nvm\current\node.exe"
nodePaths(2) = "C:\Program Files (x86)\nodejs\node.exe"
nodePaths(3) = "C:\Users\ASUS\AppData\Local\Programs\nodejs\node.exe"
nodePaths(4) = "C:\Windows\System32\node.exe"

Dim nodeExe : nodeExe = ""
Dim i
For i = 0 To 4
    If oFSO.FileExists(nodePaths(i)) Then
        nodeExe = nodePaths(i)
        Exit For
    End If
Next

' Try where node
If nodeExe = "" Then
    Dim oExec
    Set oExec = oShell.Exec("cmd.exe /c where node 2>&1")
    Dim ln : ln = ""
    Do While Not oExec.StdOut.AtEndOfStream
        ln = Trim(oExec.StdOut.ReadLine())
        If ln <> "" And nodeExe = "" Then nodeExe = ln
    Loop
End If

' Write initial log
Set oFile = oFSO.CreateTextFile(logFile, True)
oFile.WriteLine "NODE=" & nodeExe
oFile.Close

If nodeExe = "" Then
    MsgBox "Node.js not found!"
    WScript.Quit 1
End If

' Run the node script
Dim cmd
cmd = "cmd.exe /c """ & nodeExe & """ """ & "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\git_push_node.js" & """ 2>&1 >> """ & logFile & """"
oShell.Run cmd, 0, True

Set oFile = oFSO.OpenTextFile(logFile, 8)
oFile.WriteLine "VBS DONE"
oFile.Close

MsgBox "Complete! Check node_push.txt"
