@echo off
cd /d "%~dp0"
echo ============================================
echo  harga.com Full Platform Scraper
echo  Running on residential IP (this machine)
echo ============================================
echo.

set KEYWORDS=iphone 16,samsung galaxy,laptop gaming,headphone bluetooth,smartwatch,kamera digital,tv led 50 inch,speaker portable,tablet android,powerbank 20000,sepatu olahraga,tas ransel,jam tangan pria,parfum pria,skincare wanita,rice cooker,blender portable,vacuum cleaner,mainan anak,drone dji,gaming chair,mechanical keyboard,rgb mouse,action camera,electric scooter

echo Starting scraper for all platforms...
echo Keywords: 25 keywords
echo.

node scripts/scrape-all-local.mjs --queries "%KEYWORDS%" --platform "shopee,tiktok,tokopedia,lazada,bukalapak,blibli,amazon,aliexpress" --limit 40

echo.
echo ============================================
echo  DONE! Check Supabase for new products.
echo ============================================
pause
