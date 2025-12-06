@echo off
REM Build Production APK using React Native CLI for Windows
REM This script generates native folders and builds APK for production

setlocal enabledelayedexpansion

echo.
echo ================================================
echo Building Production APK with React Native CLI
echo ================================================
echo.

REM Step 1: Set production environment
set NODE_ENV=production
set EXPO_PUBLIC_ENV=production
set EXPO_PUBLIC_API_URL=https://loyaltymanagement.onrender.com/api

echo.
echo Step 1: Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Generating native Android project...
call npx expo prebuild --platform android --clean
if errorlevel 1 (
    echo ERROR: expo prebuild failed!
    pause
    exit /b 1
)

echo.
echo Step 3: Checking Android build setup...
cd android

REM Check if gradlew.bat exists
if not exist "gradlew.bat" (
    echo ERROR: gradlew.bat not found in android folder!
    cd ..
    pause
    exit /b 1
)

REM Check if debug.keystore exists, create if missing
if not exist "app\debug.keystore" (
    echo.
    echo Creating debug.keystore file...
    REM Check if Java/keytool is available
    where keytool >nul 2>&1
    if errorlevel 1 (
        echo WARNING: keytool not found. Java JDK may not be installed or not in PATH.
        echo Please install Java JDK 17+ and ensure it's in your PATH.
        echo The build may fail without a keystore file.
    ) else (
        cd app
        keytool -genkey -v -keystore debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
        if errorlevel 1 (
            echo WARNING: Failed to create debug.keystore. Build may fail.
            echo You can create it manually with:
            echo   keytool -genkey -v -keystore debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000
        ) else (
            echo debug.keystore created successfully.
        )
        cd ..
    )
)

echo.
echo Step 4: Building production APK...

REM Build release APK
echo Building APK with Gradle...
echo This may take several minutes...
call gradlew.bat assembleRelease --stacktrace
set BUILD_EXIT_CODE=%ERRORLEVEL%

if %BUILD_EXIT_CODE% neq 0 (
    echo.
    echo ================================================
    echo ERROR: Gradle build failed with exit code %BUILD_EXIT_CODE%
    echo ================================================
    echo.
    echo Common issues:
    echo   1. Missing Java JDK - Install JDK 17 or higher
    echo   2. Missing Android SDK - Install Android Studio
    echo   3. Missing debug.keystore - Should be auto-generated
    echo   4. Insufficient memory - Increase Gradle memory in gradle.properties
    echo.
    echo Check the error messages above for details.
    cd ..
    pause
    exit /b %BUILD_EXIT_CODE%
)

cd ..

echo.
echo ================================================
echo Checking for APK file...
echo ================================================
echo.

REM Check multiple possible APK locations
set APK_FOUND=0
set APK_PATH=

REM Check standard release location
if exist "android\app\build\outputs\apk\release\app-release.apk" (
    set APK_PATH=android\app\build\outputs\apk\release\app-release.apk
    set APK_FOUND=1
)

REM Check if APK is in a different location (sometimes it's in a subfolder)
if %APK_FOUND%==0 (
    for /r "android\app\build\outputs\apk" %%f in (app-release.apk) do (
        if exist "%%f" (
            set APK_PATH=%%f
            set APK_FOUND=1
        )
    )
)

REM Check for any APK in the outputs folder
if %APK_FOUND%==0 (
    for /r "android\app\build\outputs" %%f in (*.apk) do (
        if exist "%%f" (
            set APK_PATH=%%f
            set APK_FOUND=1
        )
    )
)

if %APK_FOUND%==1 (
    echo ================================================
    echo Build SUCCESS! APK found!
    echo ================================================
    echo.
    echo APK Location:
    echo    %APK_PATH%
    echo.
    for %%A in ("%APK_PATH%") do (
        echo APK Size: %%~zA bytes
    )
    echo.
    echo To install on device:
    echo    adb install "%APK_PATH%"
    echo.
) else (
    echo ================================================
    echo WARNING: APK file not found!
    echo ================================================
    echo.
    echo Checked locations:
    echo    - android\app\build\outputs\apk\release\app-release.apk
    echo    - android\app\build\outputs\apk\*\app-release.apk
    echo    - android\app\build\outputs\*.apk
    echo.
    echo Please check the build logs above for errors.
    echo.
)

pause


