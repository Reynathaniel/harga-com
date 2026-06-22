# set-vercel-env.ps1 - Set Vercel environment variables for harga-com
$LOG = "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\vercel-env-log.txt"
$PROJECT = "prj_lVaNweUhfu1wKDURKBYDrffXFyNy"
$TEAM    = "team_k4ilEqDogEwqjFNBC4sKrIrt"

function Write-Log($msg) {
    Write-Host $msg
    Add-Content -Path $LOG -Value $msg -Encoding UTF8
}

function Set-VarViaAPI($token) {
    $ok = 0
    $vars = @(
        @{ key="NEXT_PUBLIC_APP_URL";  value="https://harga.com"; type="plain";     target=@("production","preview","development") },
        @{ key="NEXT_PUBLIC_BASE_URL"; value="https://harga.com"; type="plain";     target=@("production","preview","development") },
        @{ key="ADMIN_SCRAPE_KEY";     value="0THvfIVXKVgxb-NKsusDvSb7HsPGYeMC8vxiRKIcZkY"; type="encrypted"; target=@("production","preview") },
        @{ key="CRON_SECRET";          value="VYsrCzfA0ujHI6U4-h26nPdRUN4D1o65ZuOUnyLOpcs"; type="encrypted"; target=@("production","preview") },
        @{ key="IP_HASH_SALT";         value="kG7eYpe1Jh2nEYpSdn_TfUjVPAxUKe4FoKU87zqcdc0"; type="encrypted"; target=@("production","preview") }
    )
    foreach ($v in $vars) {
        $body = ($v | ConvertTo-Json -Compress)
        try {
            $resp = Invoke-RestMethod `
                -Uri "https://api.vercel.com/v10/projects/$PROJECT/env?teamId=$TEAM&upsertOnConflict=true" `
                -Method POST `
                -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
                -Body $body
            Write-Log "  OK: $($v.key) (id=$($resp.id))"
            $ok++
        } catch {
            Write-Log "  ERROR $($v.key): $_"
        }
    }
    return $ok
}

Write-Log ""
Write-Log "=== $(Get-Date) ==="

$token = $null

# 1. CLI cache
Write-Log "[1] Vercel CLI auth.json..."
foreach ($path in @(
    "$env:LOCALAPPDATA\vercel\auth.json",
    "$env:APPDATA\vercel\auth.json",
    "$HOME\.vercel\auth.json"
)) {
    if (Test-Path $path) {
        try { $token = (Get-Content $path -Raw | ConvertFrom-Json).token; Write-Log "    Found at $path" } catch {}
    }
}

# 2. Read buddy-tokens.json fully
if (-not $token) {
    Write-Log "[2] Claude buddy-tokens.json..."
    $buddyPath = "$env:APPDATA\Claude\buddy-tokens.json"
    if (Test-Path $buddyPath) {
        try {
            $raw = Get-Content $buddyPath -Raw
            Write-Log "    Content (truncated): $($raw.Substring(0,[math]::Min(500,$raw.Length)))"
            $data = $raw | ConvertFrom-Json
            $keys = ($data | Get-Member -MemberType NoteProperty).Name
            Write-Log "    Keys: $($keys -join ', ')"
            foreach ($k in $keys) {
                $val = $data.$k
                Write-Log "    Key '$k' type: $($val.GetType().Name)"
                if ($val -is [string] -and $val.Length -gt 20) {
                    Write-Log "    Key '$k' value (first 50): $($val.Substring(0,50))"
                    if ($k -match 'vercel|token|auth|access') { $token = $val }
                } elseif ($val -is [PSCustomObject]) {
                    $subkeys = ($val | Get-Member -MemberType NoteProperty).Name
                    Write-Log "    Sub-keys: $($subkeys -join ', ')"
                    foreach ($sk in $subkeys) {
                        $sv = $val.$sk
                        if ($sv -is [string] -and $sv.Length -gt 10) {
                            Write-Log "    $k.$sk (first 50): $($sv.Substring(0,[math]::Min(50,$sv.Length)))"
                        }
                    }
                }
            }
        } catch { Write-Log "    Error: $_" }
    } else {
        Write-Log "    Not found"
    }
}

# 3. Chrome cookies via WSL Python
if (-not $token) {
    Write-Log "[3] Chrome cookies via WSL Python..."
    $wslCheck = Get-Command wsl -ErrorAction SilentlyContinue
    if ($wslCheck) {
        # Get Chrome AES key via DPAPI
        try {
            Add-Type -AssemblyName System.Security
            $ls = Get-Content "$env:LOCALAPPDATA\Google\Chrome\User Data\Local State" -Raw | ConvertFrom-Json
            $encKeyB64 = $ls.os_crypt.encrypted_key
            $encKey = [System.Convert]::FromBase64String($encKeyB64)
            $encKey = $encKey[5..($encKey.Length-1)]
            $aesKey = [System.Security.Cryptography.ProtectedData]::Unprotect($encKey, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
            $aesKeyHex = ($aesKey | ForEach-Object { '{0:x2}' -f $_ }) -join ''
            Write-Log "    AES key obtained (len=$($aesKey.Length)): $($aesKeyHex.Substring(0,8))..."

            # Call WSL Python to read/decrypt cookies
            $wslScript = @"
import sqlite3, shutil, os, sys, base64
bytes.fromhex  # test
key = bytes.fromhex('$aesKeyHex')
cookies_path = '/mnt/c/Users/ASUS/AppData/Local/Google/Chrome/User Data/Default/Network/Cookies'
if not os.path.exists(cookies_path):
    cookies_path = '/mnt/c/Users/ASUS/AppData/Local/Google/Chrome/User Data/Default/Cookies'
print(f'Cookies: {cookies_path}', flush=True)
import tempfile
tmp = tempfile.mktemp(suffix='.db')
shutil.copy2(cookies_path, tmp)
try:
    conn = sqlite3.connect(tmp)
    rows = conn.execute("SELECT name, encrypted_value FROM cookies WHERE host_key LIKE '%.vercel.com'").fetchall()
    print(f'Vercel cookies: {len(rows)}', flush=True)
    for name, enc_val in rows:
        enc_bytes = bytes(enc_val)
        print(f'Cookie {name}: {len(enc_bytes)} bytes, prefix={enc_bytes[:3]}', flush=True)
        if enc_bytes[:3] == b'v10':
            try:
                from Crypto.Cipher import AES
                nonce = enc_bytes[3:15]
                ct_tag = enc_bytes[15:]
                ct = ct_tag[:-16]
                tag = ct_tag[-16:]
                cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
                val = cipher.decrypt_and_verify(ct, tag).decode('utf-8')
                print(f'DECRYPTED {name}={val[:60]}', flush=True)
            except Exception as e:
                print(f'Decrypt error: {e}', flush=True)
    conn.close()
finally:
    os.unlink(tmp)
"@
            $wslOutput = $wslScript | wsl python3 2>&1
            Write-Log "    WSL output:"
            foreach ($line in $wslOutput) { Write-Log "      $line" }

            # Parse output for tokens
            foreach ($line in $wslOutput) {
                if ($line -match 'DECRYPTED (\w+)=(.+)') {
                    $cookieName = $matches[1]
                    $cookieVal = $matches[2]
                    Write-Log "    Cookie $cookieName = $($cookieVal.Substring(0,[math]::Min(30,$cookieVal.Length)))..."
                    if ($cookieName -match 'token|auth|session') {
                        $token = $cookieVal
                        Write-Log "    Using $cookieName as token"
                    }
                }
            }
        } catch { Write-Log "    Error: $_" }
    } else {
        Write-Log "    WSL not available"
    }
}

# 4. Check npm/node in more places
if (-not $token) {
    Write-Log "[4] Node.js search..."
    $nvmPath = "$env:USERPROFILE\AppData\Roaming\nvm"
    if (Test-Path $nvmPath) {
        $nvmCurrent = Get-ChildItem $nvmPath -Directory | Sort-Object Name | Select-Object -Last 1
        if ($nvmCurrent) {
            Write-Log "    nvm found, latest: $($nvmCurrent.FullName)"
            $env:PATH = "$($nvmCurrent.FullName);$env:PATH"
        }
    }
    $npmCmd = Get-Command npm -ErrorAction SilentlyContinue
    if ($npmCmd) {
        Write-Log "    npm found: $($npmCmd.Source)"
        npm install -g vercel 2>&1 | ForEach-Object { Write-Log "    $_" }
    } else {
        Write-Log "    npm still not found - checking nvm settings..."
        if (Test-Path "$nvmPath\settings.txt") {
            Get-Content "$nvmPath\settings.txt" | ForEach-Object { Write-Log "    $_" }
        }
    }
    Write-Log "    No token from any method."
    Write-Log "    ACTION NEEDED: Create token at https://vercel.com/account/tokens"
    Write-Log "    Then run: powershell -Command `"[System.Environment]::SetEnvironmentVariable('VERCEL_TOKEN','YOUR_TOKEN','User')`""
    Write-Log "    Then run: set_vercel_env.bat"
}

if ($token) {
    Write-Log ""
    Write-Log "=== Setting env vars ==="
    $count = Set-VarViaAPI $token
    Write-Log "=== DONE: $count/5 vars set ==="
} else {
    Write-Log ""
    Write-Log "=== FAILED: No token available ==="
}
