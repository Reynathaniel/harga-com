# ============================================================
# DO_GIT_PUSH_NOW.ps1
# Jalankan di PowerShell (klik kanan -> Run with PowerShell)
# atau buka PowerShell dan jalankan:
#   cd "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app"
#   .\DO_GIT_PUSH_NOW.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$AppDir = "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app"

Write-Host "=== HARGA.COM GIT PUSH ===" -ForegroundColor Cyan
Write-Host ""

# Pindah ke folder app
Set-Location $AppDir
Write-Host "[1] Working dir: $(Get-Location)" -ForegroundColor Yellow

# Hapus stale lock files
$lockFiles = @(".git\index.lock", ".git\config.lock")
foreach ($f in $lockFiles) {
    if (Test-Path $f) {
        Remove-Item $f -Force
        Write-Host "[OK] Hapus stale lock: $f" -ForegroundColor Green
    }
}

# Cek git tersedia
try {
    $gitVersion = git --version
    Write-Host "[2] Git: $gitVersion" -ForegroundColor Yellow
} catch {
    Write-Host "[ERROR] Git tidak ditemukan! Install dari https://git-scm.com" -ForegroundColor Red
    Read-Host "Tekan Enter untuk keluar"
    exit 1
}

# Status repo
Write-Host ""
Write-Host "[3] Git status:" -ForegroundColor Yellow
git status

# Set user config
git config user.email "secrettrader011200@gmail.com"
git config user.name "Reynathaniel"

# Add semua file
Write-Host ""
Write-Host "[4] Git add ..." -ForegroundColor Yellow
git add .

# Commit
Write-Host ""
Write-Host "[5] Git commit ..." -ForegroundColor Yellow
git commit -m "feat: add referral system + checkout flow"

# Cek branch
$branch = git rev-parse --abbrev-ref HEAD
Write-Host ""
Write-Host "[6] Branch aktif: $branch" -ForegroundColor Yellow

# Push
Write-Host ""
Write-Host "[7] Git push ke GitHub ..." -ForegroundColor Yellow
Write-Host "    (Jika muncul dialog login, masukkan username + Personal Access Token GitHub)" -ForegroundColor Gray
Write-Host "    (Bukan password biasa - gunakan token dari https://github.com/settings/tokens)" -ForegroundColor Gray
Write-Host ""

git push origin $branch

Write-Host ""
Write-Host "=== PUSH BERHASIL ===" -ForegroundColor Green
Write-Host "Cek di: https://github.com/Reynathaniel/harga-com" -ForegroundColor Cyan

Read-Host "`nTekan Enter untuk keluar"
