@echo off
echo ====================================
echo DrishtiX Setup Script
echo ====================================
echo.

echo [1/5] Creating virtual environment...
python -m venv .venv
if %errorlevel% neq 0 (
    echo ERROR: Failed to create virtual environment
    pause
    exit /b 1
)
echo Virtual environment created successfully!
echo.

echo [2/5] Activating virtual environment...
call .venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)
echo.

echo [3/5] Upgrading pip...
python -m pip install --upgrade pip
echo.

echo [4/5] Installing dependencies from requirements.txt...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo WARNING: Some packages may have failed to install
    echo You can continue or press Ctrl+C to abort
    pause
)
echo.

echo [5/5] Installing OpenAI CLIP...
pip install ftfy regex tqdm
pip install git+https://github.com/openai/CLIP.git
if %errorlevel% neq 0 (
    echo WARNING: CLIP installation failed. Make sure Git is installed.
    echo You can install it manually later with: pip install git+https://github.com/openai/CLIP.git
)
echo.

echo ====================================
echo Setup Complete!
echo ====================================
echo.
echo Next steps:
echo 1. Make sure Redis is running
echo 2. Run vision API: python .\vision_api\app.py
echo 3. Or run stream engine: python .\stream_engine\main.py
echo.
pause
