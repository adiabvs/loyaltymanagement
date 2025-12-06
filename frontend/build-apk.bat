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

REM Check Java installation and JAVA_HOME
echo Checking Java installation...
java -version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Java is not installed or not in PATH!
    echo Please install Java JDK 17 or higher and add it to your PATH.
    echo.
    pause
    exit /b 1
)

REM Display Java version
echo Java version:
java -version 2>&1 | findstr /i "version" >nul
if errorlevel 1 (
    java -version
)

REM Check and set JAVA_HOME if needed
if "%JAVA_HOME%"=="" (
    echo.
    echo WARNING: JAVA_HOME is not set. Attempting to find Java JDK...
    
    REM Try common JDK installation locations
    set FOUND_JDK=
    
    REM Check Program Files\Java
    if exist "C:\Program Files\Java" (
        for /d %%i in ("C:\Program Files\Java\jdk*") do (
            if exist "%%i\bin\java.exe" (
                set FOUND_JDK=%%i
                goto found_jdk
            )
        )
    )
    
    REM Check Program Files (x86)\Java
    if exist "C:\Program Files (x86)\Java" (
        for /d %%i in ("C:\Program Files (x86)\Java\jdk*") do (
            if exist "%%i\bin\java.exe" (
                set FOUND_JDK=%%i
                goto found_jdk
            )
        )
    )
    
    REM Check Eclipse Adoptium
    if exist "C:\Program Files\Eclipse Adoptium" (
        for /d %%i in ("C:\Program Files\Eclipse Adoptium\jdk*") do (
            if exist "%%i\bin\java.exe" (
                set FOUND_JDK=%%i
                goto found_jdk
            )
        )
    )
    
    REM Check Microsoft OpenJDK
    if exist "C:\Program Files\Microsoft" (
        for /d %%i in ("C:\Program Files\Microsoft\jdk*") do (
            if exist "%%i\bin\java.exe" (
                set FOUND_JDK=%%i
                goto found_jdk
            )
        )
    )
    
    found_jdk:
    if defined FOUND_JDK (
        set JAVA_HOME=!FOUND_JDK!
        echo Found JDK at: !JAVA_HOME!
    ) else (
        echo.
        echo ERROR: Could not find Java JDK installation automatically.
        echo.
        echo Please enter the path to your JDK installation:
        echo (Example: C:\Program Files\Java\jdk-17)
        echo.
        set /p MANUAL_JDK_PATH=Enter JDK path: 
        
        if defined MANUAL_JDK_PATH (
            REM Remove quotes if present
            set MANUAL_JDK_PATH=!MANUAL_JDK_PATH:"=!
            REM Remove trailing backslash
            if "!MANUAL_JDK_PATH:~-1!"=="\" set MANUAL_JDK_PATH=!MANUAL_JDK_PATH:~0,-1!
            
            if exist "!MANUAL_JDK_PATH!\bin\java.exe" (
                set JAVA_HOME=!MANUAL_JDK_PATH!
                echo Using JDK at: !JAVA_HOME!
            ) else (
                echo ERROR: Invalid JDK path. java.exe not found at: !MANUAL_JDK_PATH!\bin\java.exe
                echo.
                echo Common JDK locations to check:
                echo   - C:\Program Files\Java\jdk-17
                echo   - C:\Program Files\Java\jdk-21
                echo   - C:\Program Files\Eclipse Adoptium\jdk-17
                echo   - C:\Program Files\Microsoft\jdk-17
                echo.
                pause
                exit /b 1
            )
        ) else (
            echo No path entered. Exiting.
            pause
            exit /b 1
        )
    )
) else (
    echo JAVA_HOME is set to: %JAVA_HOME%
)

REM Verify JAVA_HOME points to valid Java
if exist "%JAVA_HOME%\bin\java.exe" (
    echo Java found at: %JAVA_HOME%\bin\java.exe
) else (
    echo ERROR: JAVA_HOME does not point to a valid Java installation!
    echo Current JAVA_HOME: %JAVA_HOME%
    echo Please set JAVA_HOME to your JDK installation directory.
    pause
    exit /b 1
)

REM Ensure JAVA_HOME doesn't have trailing backslash
set "JAVA_HOME=%JAVA_HOME:"=%"
if "%JAVA_HOME:~-1%"=="\" set "JAVA_HOME=%JAVA_HOME:~0,-1%"

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
echo.
echo Building APK with Gradle...
echo This may take several minutes...
echo.
echo Using JAVA_HOME: %JAVA_HOME%
echo.

REM Clean build first to avoid cached issues
echo Cleaning previous build...
call gradlew.bat clean
if errorlevel 1 (
    echo WARNING: Clean failed, but continuing with build...
)

REM Clean Gradle cache for problematic modules
echo Cleaning Gradle cache...
call gradlew.bat cleanBuildCache
if errorlevel 1 (
    echo WARNING: Clean cache failed, but continuing...
)

REM Build release APK
echo Starting release build...
echo.
REM Ensure CLASSPATH is not set (can cause issues with Gradle)
set CLASSPATH=
REM Increase memory for Kotlin compilation
set GRADLE_OPTS=-Xmx4096m -XX:MaxMetaspaceSize=1024m
call gradlew.bat assembleRelease --stacktrace --no-daemon
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


