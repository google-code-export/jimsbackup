@ECHO OFF
SETLOCAL ENABLEDELAYEDEXPANSION

:: Set the scriptdir variable to the directory where this script is 
:: located with a trailing slash
SET scriptdir=%~dp0

SET rootdir=%~dp1

SET mappath=%~f2

SET bkfolder=bk-%date:~6,4%%date:~0,2%%date:~3,2%%time:~0,2%%time:~3,2%%time:~6,2%

IF [%1]==[] (
:: No parameters provided -- display usage.
TYPE "%scriptdir%usage.txt"
GOTO:eof
)

DEL /F /Q "%rootdir%backup.log"

IF EXIST "%rootdir%latest.txt" (
:: Apparently we already initialized, make hardlinks to previous 
:: backup.
FOR /F "usebackq delims=" %%G IN ("%rootdir%latest.txt") DO set lastbkfolder=%%G
FOR /F "tokens=1,2 delims=|" %%G IN (%mappath%) DO (call :mk_hardlinks "%rootdir%!lastbkfolder!\%%H" "%rootdir%%bkfolder%\%%H")
)

FOR /F "tokens=1,2 delims=|" %%G IN (%mappath%) DO robocopy.exe "%%G" "%rootdir%%bkfolder%\%%H" /V /MIR>>"%rootdir%backup.log"  2>>&1
@ECHO %bkfolder%>"%rootdir%latest.txt"

:: Delete old backups
IF NOT [%3]==[] (
:: "number-to-keep" parameter provided.  Delete oldest backups that exceed this
:: number.
FOR /F "skip=%3" %%G IN ('dir bk-* /A:D /B /O:-N') DO ECHO rmdir /S /Q %%G
GOTO:eof
)

GOTO:eof

:mk_hardlinks
 @ECHO MKDIR %2>>"%rootdir%backup.log"
 MKDIR %2>>"%rootdir%backup.log"
 @ECHO ln.exe Starting @ !date! !time!>>"%rootdir%backup.log"
 @ECHO "%scriptdir%..\bin\ln" -r %1 %2^>^>"%rootdir%backup.log">>"%rootdir%backup.log"
 "ln.exe" -r %1 %2>>"%rootdir%backup.log"
 @ECHO ln.exe Finished !date! !time!>>"%rootdir%backup.log"
 GOTO:eof
