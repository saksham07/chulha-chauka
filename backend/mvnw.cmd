@REM ----------------------------------------------------------------------------
@REM Maven Wrapper Script for Windows
@REM ----------------------------------------------------------------------------
@echo off
setlocal

set "BASE_DIR=%~dp0"
set "MAVEN_VERSION=3.9.9"
set "MAVEN_HOME=%USERPROFILE%\.m2\wrapper\dists\apache-maven-%MAVEN_VERSION%"

if not exist "%MAVEN_HOME%\bin\mvn.cmd" (
    echo Downloading Maven %MAVEN_VERSION%...
    powershell -Command "New-Item -ItemType Directory -Force -Path '%MAVEN_HOME%' | Out-Null; Invoke-WebRequest -Uri 'https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/%MAVEN_VERSION%/apache-maven-%MAVEN_VERSION%-bin.zip' -OutFile '%TEMP%\mvn.zip'; Expand-Archive '%TEMP%\mvn.zip' -DestinationPath '%TEMP%\mvn_extract'; Move-Item '%TEMP%\mvn_extract\apache-maven-*\\*' '%MAVEN_HOME%\\'; Remove-Item '%TEMP%\mvn.zip', '%TEMP%\mvn_extract' -Recurse -Force"
)

call "%MAVEN_HOME%\bin\mvn.cmd" %*
