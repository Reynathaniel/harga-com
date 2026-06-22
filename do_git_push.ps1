$logFile = 'D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\git_result.txt'
$projectDir = 'D:\10. BUILD YOUR DREAM\07_HARGA_COM\app'

# Find git.exe
$gitPaths = @(
    'C:\Program Files\Git\cmd\git.exe',
    'C:\Program Files\Git\bin\git.exe',
    'C:\Program Files (x86)\Git\bin\git.exe',
    'C:\Users\ASUS\AppData\Local\GitHubDesktop\app-3.4.14\resources\app\git\cmd\git.exe'
)

# Also search common locations
$found = $null
foreach ($p in $gitPaths) {
    if (Test-Path $p) { $found = $p; break }
}

# Try searching in Program Files
if (-not $found) {
    $search = Get-ChildItem 'C:\Program Files' -Filter 'git.exe' -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($search) { $found = $search.FullName }
}

# Try PATH
if (-not $found) {
    $fromPath = (Get-Command git -ErrorAction SilentlyContinue)
    if ($fromPath) { $found = $fromPath.Source }
}

$result = @()
$result += "=== GIT PUSH LOG ==="
$result += "Git found: $found"
$result += "PATH: $($env:PATH)"
$result += ""

if (-not $found) {
    $result += "ERROR: git.exe not found!"
    $result | Set-Content $logFile
    exit 1
}

Set-Location $projectDir
$result += "=== git status ==="
$result += (& $found status 2>&1)
$result += ""
$result += "=== git add ==="
$result += (& $found add . 2>&1)
$result += ""
$result += "=== git commit ==="
$result += (& $found commit -m "feat: referral and checkout system" 2>&1)
$result += ""
$result += "=== git push ==="
$result += (& $found push origin main 2>&1)
$result += ""
$result += "=== DONE ==="

$result | Set-Content $logFile -Encoding UTF8
